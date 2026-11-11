// Админка текстов /admin/ (T38): вход токеном GitHub → тексты из main → правка → один коммит → деплой Actions.
// Весь вывод — через textContent / value / setAttribute: ни одна строка из файлов и из полей не попадает в разметку как HTML.
import './admin.css';
import { ACTIONS_URL, FILES, OWNER, REPO, TOKEN_URL } from './config.js';
import { buildFields, commitMessage, currentValue, groupBySection, pendingFiles, rebaseEdits, search, setEdit } from './fields.js';
import { createClient, errorText } from './github.js';
import { clearToken, isTokenShape, loadToken, saveToken } from './token.js';
import { validate } from './validate.js';

const PATHS = FILES.map((f) => f.path);
const LANG_TAG = { ua: 'UA', en: 'EN', all: 'UA і EN' };
const MAX_RESULTS = 200;

const state = {
  client: null,
  base: null, // { commit, files: { [path]: { sha, text } } } — версия main, на которой стоят правки
  texts: {},
  fields: [],
  sections: [],
  edits: new Map(),
  section: 'hero',
  query: '',
  busy: false,
};

let ui = {}; // узлы каркаса редактора
let refs = new Map(); // slot.id → { slot, field, input, box, error } для полей на экране

/* ——— DOM без HTML-строк ——— */

function h(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'value') node.value = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children.flat()) if (child != null && child !== false) node.append(child);
  return node;
}

const link = (href, text) => h('a', { href, target: '_blank', rel: 'noopener noreferrer', text });
const plural = (n, one, few, many) => {
  const m10 = n % 10;
  const m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
};

/* ——— вход ——— */

function renderLogin(message = '') {
  ui = {};
  refs = new Map();
  const input = h('input', {
    class: 'adm-input',
    id: 'adm-token',
    type: 'password',
    autocomplete: 'off',
    spellcheck: 'false',
    placeholder: 'github_pat_…',
    required: true,
  });
  const remember = h('input', { type: 'checkbox', id: 'adm-remember' });
  const error = h('p', { class: 'adm-login__error', role: 'alert', text: message, hidden: !message });
  const submit = h('button', { class: 'adm-btn adm-btn--primary', type: 'submit', text: 'Увійти' });

  const form = h(
    'form',
    {
      class: 'adm-login__form',
      novalidate: true,
      onsubmit: async (event) => {
        event.preventDefault();
        const token = input.value.trim();
        if (!isTokenShape(token)) {
          error.textContent = 'Це не схоже на токен GitHub: він починається з github_pat_ і не містить пробілів.';
          error.hidden = false;
          input.focus();
          return;
        }
        submit.disabled = true;
        submit.textContent = 'Перевіряю…';
        error.hidden = true;
        const fail = await start(token);
        if (!fail) {
          saveToken(token, remember.checked);
          return;
        }
        submit.disabled = false;
        submit.textContent = 'Увійти';
        error.textContent = fail;
        error.hidden = false;
      },
    },
    h('label', { class: 'adm-label', for: 'adm-token', text: 'GitHub token' }),
    input,
    h('label', { class: 'adm-check' }, remember, h('span', { text: 'Запамʼятати на цьому пристрої' })),
    error,
    submit,
  );

  const steps = h(
    'ol',
    { class: 'adm-login__steps' },
    h('li', {}, 'Відкрийте ', link(TOKEN_URL, 'створення токена на GitHub'), '.'),
    h('li', { text: `Repository access → Only select repositories → ${REPO}.` }),
    h('li', { text: 'Permissions → Repository permissions → Contents → Read and write.' }),
    h('li', { text: 'Generate token — скопіюйте його й вставте сюди.' }),
  );

  document.body.replaceChildren(
    h(
      'main',
      { class: 'adm-login' },
      h(
        'section',
        { class: 'adm-login__card', 'aria-labelledby': 'adm-login-title' },
        h('p', { class: 'adm-kicker', text: 'eLeads' }),
        h('h1', { class: 'adm-title', id: 'adm-login-title', text: 'Тексти сайту' }),
        h('p', {
          class: 'adm-muted',
          text: 'Увійдіть токеном GitHub — і змініть будь-який текст сторінки українською чи англійською. Після збереження сайт оновиться сам за 2–3 хвилини.',
        }),
        form,
        h('details', { class: 'adm-login__help' }, h('summary', { text: 'Як отримати токен' }), steps),
        h('p', {
          class: 'adm-login__note',
          text: 'Токен зберігається тільки у вашому браузері й надсилається лише на api.github.com.',
        }),
      ),
    ),
  );
  input.focus();
}

/** Проверка доступа и загрузка текстов. Возвращает текст ошибки или '' при успехе. */
async function start(token) {
  const client = createClient({ token });
  try {
    await client.checkAccess();
    const data = await client.load(PATHS);
    state.client = client;
    state.edits = new Map();
    state.query = '';
    applyLoaded(data);
    renderApp();
    return '';
  } catch (err) {
    return errorText(err);
  }
}

function applyLoaded(data) {
  state.base = { commit: data.commit, files: {} };
  state.texts = {};
  for (const [path, file] of Object.entries(data.files)) {
    state.base.files[path] = { sha: file.sha };
    state.texts[path] = file.text;
  }
  state.fields = buildFields(state.texts);
  state.sections = groupBySection(state.fields);
  if (!state.sections.some((s) => s.id === state.section)) state.section = state.sections[0]?.id || '';
}

function logout() {
  if (state.edits.size && !window.confirm('Незбережені зміни зникнуть. Вийти?')) return;
  clearToken();
  Object.assign(state, { client: null, base: null, texts: {}, fields: [], sections: [], edits: new Map(), query: '' });
  renderLogin();
}

/* ——— редактор ——— */

function renderApp() {
  ui.count = h('span', { class: 'adm-count', 'aria-live': 'polite' });
  ui.undo = h('button', { class: 'adm-btn', type: 'button', text: 'Скасувати зміни', onclick: undoAll });
  ui.save = h('button', { class: 'adm-btn adm-btn--primary', type: 'button', text: 'Зберегти', onclick: () => save() });
  ui.banner = h('div', { class: 'adm-banner', role: 'status', hidden: true });
  ui.nav = h('nav', { class: 'adm-nav', 'aria-label': 'Розділи сайту' });
  ui.main = h('main', { class: 'adm-main', id: 'adm-main', tabindex: '-1' });
  ui.search = h('input', {
    class: 'adm-input adm-search',
    type: 'search',
    placeholder: 'Пошук по всіх текстах',
    'aria-label': 'Пошук по всіх текстах',
    value: state.query,
    oninput: (event) => {
      clearTimeout(ui.searchTimer);
      ui.searchTimer = setTimeout(() => {
        state.query = event.target.value;
        renderMain();
      }, 120);
    },
  });

  const actions = h(
    'div',
    { class: 'adm-bar__actions' },
    ui.count,
    ui.undo,
    ui.save,
    h('a', { class: 'adm-btn adm-btn--ghost', href: '../', target: '_blank', rel: 'noopener', text: 'Відкрити сайт ↗' }),
    h('button', { class: 'adm-btn adm-btn--ghost', type: 'button', text: 'Вийти', onclick: logout }),
  );
  const brand = h('p', { class: 'adm-bar__brand' }, h('span', { class: 'adm-kicker', text: 'eLeads' }), h('span', { text: 'Тексти сайту' }));

  document.body.replaceChildren(
    h(
      'div',
      { class: 'adm-app' },
      h('div', { class: 'adm-top' }, h('header', { class: 'adm-bar' }, brand, actions), ui.banner),
      h('div', { class: 'adm-body' }, h('aside', { class: 'adm-side' }, ui.search, ui.nav), ui.main),
    ),
  );
  // высота липкой шапки (с сообщением или без) — для липкого списка разделов слева
  const top = document.querySelector('.adm-top');
  if (top && 'ResizeObserver' in window) {
    new ResizeObserver(() => document.documentElement.style.setProperty('--adm-top', `${top.offsetHeight}px`)).observe(top);
  }
  renderNav();
  renderMain();
  updateCounter();
}

function changedIn(fields) {
  let n = 0;
  for (const f of fields) for (const s of f.slots) if (state.edits.has(s.id)) n++;
  return n;
}

function renderNav() {
  ui.nav.replaceChildren(
    ...state.sections.map((s) => {
      const changed = changedIn(s.fields);
      return h(
        'button',
        {
          class: 'adm-nav__item',
          type: 'button',
          'aria-current': !state.query.trim() && s.id === state.section ? 'true' : false,
          onclick: () => {
            state.section = s.id;
            if (state.query) {
              state.query = '';
              ui.search.value = '';
            }
            renderNav();
            renderMain();
            ui.main.focus({ preventScroll: true });
            ui.main.scrollTop = 0;
            window.scrollTo({ top: 0 });
          },
        },
        h('span', { text: s.title }),
        changed ? h('span', { class: 'adm-nav__badge', text: String(changed), title: 'Змінено полів' }) : h('span', { class: 'adm-nav__n', text: String(s.fields.length) }),
      );
    }),
  );
}

function renderMain() {
  refs = new Map();
  const q = state.query.trim();
  if (q) {
    const found = search(state.fields, q, state.edits);
    const shown = found.slice(0, MAX_RESULTS);
    const blocks = groupBySection(shown).map((s) => h('section', { class: 'adm-results' }, h('h2', { class: 'adm-h2', text: s.title }), renderFields(s.fields)));
    ui.main.replaceChildren(
      h('h1', { class: 'adm-title adm-title--sm', text: 'Пошук' }),
      h('p', {
        class: 'adm-muted',
        text: found.length
          ? `«${q}» — знайдено ${found.length} ${plural(found.length, 'поле', 'поля', 'полів')}${found.length > MAX_RESULTS ? `, показано перші ${MAX_RESULTS}` : ''}`
          : `«${q}» — нічого не знайдено`,
      }),
      ...blocks,
    );
  } else {
    const section = state.sections.find((s) => s.id === state.section);
    ui.main.replaceChildren(h('h1', { class: 'adm-title adm-title--sm', text: section?.title || '' }), renderFields(section?.fields || []));
  }
  renderNav();
  requestAnimationFrame(() => {
    for (const r of refs.values()) autosize(r.input);
  });
}

function renderFields(fields) {
  const out = [];
  let group = null;
  for (const field of fields) {
    if (field.group !== group) {
      group = field.group;
      if (group) out.push(h('h3', { class: 'adm-group', text: group }));
    }
    out.push(renderField(field));
  }
  return h('div', { class: 'adm-fields' }, out);
}

function renderField(field) {
  const reset = h('button', {
    class: 'adm-link',
    type: 'button',
    text: 'Повернути',
    onclick: () => {
      for (const s of field.slots) {
        state.edits.delete(s.id);
        const r = refs.get(s.id);
        if (r) {
          r.input.value = s.value;
          autosize(r.input);
        }
      }
      refreshField(field);
      updateCounter();
      renderNav();
    },
  });
  const box = h(
    'div',
    { class: `adm-field${field.slots.length === 1 ? ' adm-field--single' : ''}`, 'data-field': field.id },
    h('div', { class: 'adm-field__head' }, h('span', { class: 'adm-field__label', text: field.label }), h('code', { class: 'adm-field__path', text: field.keyPath }), reset),
    h('div', { class: 'adm-field__pair' }, field.slots.map((s) => renderSlot(field, s))),
  );
  field.box = box;
  field.reset = reset;
  refreshField(field);
  return box;
}

function renderSlot(field, s) {
  const id = `adm-${refs.size}`;
  const input = h('textarea', {
    class: 'adm-input adm-input--area',
    id,
    rows: '1',
    spellcheck: 'true',
    lang: s.lang === 'en' ? 'en' : 'uk',
    value: currentValue(state.edits, s),
    oninput: () => {
      setEdit(state.edits, s, input.value);
      autosize(input);
      refreshField(field);
      updateCounter();
      updateBadges();
    },
    onkeydown: (event) => {
      if (event.key === 'Enter') event.preventDefault(); // тексты сайта однострочные
    },
  });
  const error = h('span', { class: 'adm-slot__error', role: 'alert' });
  const box = h('div', { class: 'adm-slot' }, h('label', { class: 'adm-slot__lang', for: id, text: LANG_TAG[s.lang] || s.lang }), input, error);
  refs.set(s.id, { slot: s, field, input, box, error });
  return box;
}

function slotError(field, s) {
  if (!state.edits.has(s.id)) return null;
  return validate(state.edits.get(s.id), { original: s.value, kind: field.kind });
}

function refreshField(field) {
  let changed = false;
  let invalid = false;
  for (const s of field.slots) {
    const r = refs.get(s.id);
    const isChanged = state.edits.has(s.id);
    const err = slotError(field, s);
    changed ||= isChanged;
    invalid ||= Boolean(err);
    if (!r) continue;
    r.box.classList.toggle('is-changed', isChanged);
    r.box.classList.toggle('is-invalid', Boolean(err));
    r.input.setAttribute('aria-invalid', err ? 'true' : 'false');
    r.error.textContent = err || '';
  }
  field.box?.classList.toggle('is-changed', changed);
  field.box?.classList.toggle('is-invalid', invalid);
  if (field.reset) field.reset.hidden = !changed;
}

function autosize(input) {
  input.style.height = 'auto';
  input.style.height = `${input.scrollHeight + 2}px`;
}

function invalidSlots() {
  const out = [];
  for (const f of state.fields) for (const s of f.slots) if (slotError(f, s)) out.push({ field: f, slot: s });
  return out;
}

let badgeFrame = 0;
function updateBadges() {
  cancelAnimationFrame(badgeFrame);
  badgeFrame = requestAnimationFrame(renderNav);
}

function updateCounter() {
  const n = state.edits.size;
  ui.count.textContent = `Змінено: ${n}`;
  ui.count.classList.toggle('is-on', n > 0);
  ui.undo.disabled = !n || state.busy;
  ui.save.disabled = !n || state.busy;
  document.title = n ? `● Тексти сайту — eLeads` : 'Тексти сайту — eLeads';
}

function undoAll() {
  const n = state.edits.size;
  if (!n || !window.confirm(`Скасувати всі зміни (${n})?`)) return;
  state.edits = new Map();
  renderMain();
  updateCounter();
  hideBanner();
}

/* ——— сообщения ——— */

function banner(type, text, { links = [], action = null } = {}) {
  ui.banner.className = `adm-banner adm-banner--${type}`;
  ui.banner.setAttribute('role', type === 'error' || type === 'conflict' ? 'alert' : 'status');
  const nodes = [h('p', { class: 'adm-banner__text', text }), ...links.filter(Boolean).map((l) => link(l.href, l.text))];
  if (action) nodes.push(h('button', { class: 'adm-btn adm-btn--primary', type: 'button', text: action.text, onclick: action.fn }));
  ui.banner.replaceChildren(...nodes);
  ui.banner.hidden = false;
  // на телефоне шапка не липкая — сообщение может оказаться выше экрана
  if (ui.banner.getBoundingClientRect().bottom < 0) ui.banner.scrollIntoView({ block: 'start' });
}

function hideBanner() {
  ui.banner.hidden = true;
  ui.banner.replaceChildren();
}

function setBusy(on, label = 'Зберігаю…') {
  state.busy = on;
  ui.save.textContent = on ? label : 'Зберегти';
  updateCounter();
}

/* ——— сохранение ——— */

const githubUrl = (url) => (/^https:\/\/github\.com\//.test(String(url)) ? url : '');

async function save(prefix = '') {
  if (state.busy || !state.edits.size) return;
  const bad = invalidSlots();
  if (bad.length) {
    const { field } = bad[0];
    banner('error', `Виправте ${plural(bad.length, 'поле', 'поля', 'полів')} з помилкою (${bad.length}) — інакше сайт не збереться.`);
    state.query = '';
    ui.search.value = '';
    state.section = field.section;
    renderMain();
    requestAnimationFrame(() => {
      const r = refs.get(bad[0].slot.id);
      r?.input.focus();
      r?.box.scrollIntoView({ block: 'center' });
    });
    return;
  }
  const count = state.edits.size;
  setBusy(true);
  banner('info', `${prefix}Зберігаю ${count} ${plural(count, 'зміну', 'зміни', 'змін')} на GitHub…`);
  try {
    const changes = pendingFiles(state.fields, state.edits, state.texts).map(({ path, text }) => ({ path, text }));
    const result = await state.client.save({ base: state.base, changes, message: commitMessage(count) });
    for (const [path, file] of Object.entries(result.files)) {
      state.base.files[path] = { sha: file.sha };
      state.texts[path] = file.text;
    }
    state.base.commit = result.commit;
    state.edits = new Map();
    state.fields = buildFields(state.texts);
    state.sections = groupBySection(state.fields);
    setBusy(false);
    renderMain();
    banner('ok', `${prefix}Збережено: ${count} ${plural(count, 'зміна', 'зміни', 'змін')}. Сайт оновиться за 2–3 хвилини.`, {
      links: [{ href: ACTIONS_URL, text: 'Хід публікації (GitHub Actions)' }, githubUrl(result.url) && { href: result.url, text: 'Коміт' }],
    });
  } catch (err) {
    setBusy(false);
    if (err?.code === 'bad-token') {
      clearToken();
      renderLogin(errorText(err));
      return;
    }
    if (err?.code === 'conflict') {
      const files = (err.files || []).map((p) => p.split('/').pop()).join(', ');
      banner('conflict', `${errorText(err)}${files ? ` (${files})` : ''} Ваші правки нікуди не ділися — вони тут, на сторінці. Оновіть тексти з GitHub, і правки ляжуть поверх нової версії.`, {
        action: { text: 'Оновити й повторити', fn: refreshAndRetry },
      });
      return;
    }
    banner('error', errorText(err));
  }
}

async function refreshAndRetry() {
  if (state.busy) return;
  setBusy(true, 'Оновлюю…');
  banner('info', 'Завантажую свіжі тексти з GitHub…');
  try {
    applyLoaded(await state.client.load(PATHS));
  } catch (err) {
    setBusy(false);
    banner('error', errorText(err));
    return;
  }
  const { edits, dropped } = rebaseEdits(state.edits, state.fields);
  state.edits = edits;
  setBusy(false);
  renderMain();
  const note = dropped ? `${dropped} ${plural(dropped, 'правка зникла', 'правки зникли', 'правок зникли')}: цих текстів на сайті вже немає. ` : '';
  if (!edits.size) {
    banner('info', `${note}Тексти оновлено, ваших змін у них уже немає — зберігати нічого.`);
    return;
  }
  await save(note);
}

/* ——— запуск ——— */

window.addEventListener('beforeunload', (event) => {
  if (state.edits.size) event.preventDefault();
});

window.addEventListener('keydown', (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's' && state.client) {
    event.preventDefault();
    save();
  }
});

async function boot() {
  const token = loadToken();
  if (!token) return renderLogin();
  document.body.replaceChildren(h('p', { class: 'adm-loading', text: `Завантажую тексти з ${OWNER}/${REPO}…` }));
  const fail = await start(token);
  if (fail) {
    clearToken();
    renderLogin(fail);
  }
}

boot();
