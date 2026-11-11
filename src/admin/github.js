// Клиент GitHub API для админки: чтение текстов из main и сохранение всех правок одним коммитом
// (Git Data API: blobs → tree → commit → ref). Токен уходит только на API (config.js); fetch подменяется в тестах.
import { API, BRANCH, OWNER, REPO } from './config.js';

/* ——— base64 ⇄ UTF-8: Contents API отдаёт файлы в base64, кириллица — многобайтная ——— */

export function toBase64Utf8(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export function fromBase64Utf8(base64) {
  const binary = atob(String(base64).replace(/\s+/g, ''));
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

/* ——— ошибки: код для логики, текст — для владельца сайта ——— */

export class GitHubError extends Error {
  constructor(code, status = 0, extra = {}) {
    super(code);
    this.name = 'GitHubError';
    this.code = code;
    this.status = status;
    Object.assign(this, extra);
  }
}

const MESSAGES = {
  'bad-token': 'GitHub не прийняв токен: він неправильний, прострочений або відкликаний. Створіть новий.',
  'no-access': `Токен не бачить репозиторій ${OWNER}/${REPO}. Під час створення токена в «Repository access» виберіть саме його.`,
  'no-push': 'Токен без права на запис. У налаштуваннях токена: Repository permissions → Contents → Read and write.',
  'rate-limit': 'GitHub тимчасово обмежив кількість запитів. Спробуйте за кілька хвилин.',
  network: 'Немає зʼєднання з GitHub. Перевірте інтернет і спробуйте ще раз.',
  conflict: 'Поки ви редагували, тексти на GitHub змінилися.',
  'bad-file': 'Файл на GitHub не вдалося прочитати як текст.',
  'bad-url': 'Запит не на api.github.com — заблоковано.',
  rejected: 'GitHub відхилив запис. Оновіть сторінку й спробуйте ще раз.',
};

export function errorText(err) {
  if (err instanceof GitHubError) return MESSAGES[err.code] || `GitHub відповів помилкою ${err.status || ''}`.trim();
  return 'Щось пішло не так. Оновіть сторінку й спробуйте ще раз.';
}

const encodePath = (path) => path.split('/').map(encodeURIComponent).join('/');

/**
 * token — fine-grained PAT; fetchImpl — для тестов. Все запросы — только на API, без cookies и referrer,
 * без перехода по редиректам (заголовок Authorization не уйдёт на чужой адрес).
 */
export function createClient({ token, fetchImpl = (...args) => globalThis.fetch(...args) }) {
  const repo = `/repos/${OWNER}/${REPO}`;

  async function call(method, path, body) {
    const url = new URL(path, API);
    if (url.origin !== API) throw new GitHubError('bad-url');
    let res;
    try {
      res = await fetchImpl(url.href, {
        method,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          ...(body ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'error',
        referrerPolicy: 'no-referrer',
      });
    } catch {
      throw new GitHubError('network');
    }
    if (res.ok) return res.status === 204 ? null : res.json();
    const status = res.status;
    if (status === 401) throw new GitHubError('bad-token', status);
    if (status === 403 || status === 429) {
      const left = res.headers?.get?.('x-ratelimit-remaining');
      throw new GitHubError(left === '0' || status === 429 ? 'rate-limit' : 'no-push', status);
    }
    if (status === 404) throw new GitHubError('no-access', status);
    if (status === 409 || status === 422) throw new GitHubError('rejected', status);
    throw new GitHubError('http', status);
  }

  /** Вход: токен действителен, репозиторий виден, запись разрешена. */
  async function checkAccess() {
    const info = await call('GET', repo);
    if (info?.permissions && info.permissions.push !== true) throw new GitHubError('no-push', 403);
    return { private: Boolean(info?.private) };
  }

  const headCommit = async () => (await call('GET', `${repo}/git/ref/heads/${BRANCH}`)).object.sha;

  async function readFile(path, ref) {
    const data = await call('GET', `${repo}/contents/${encodePath(path)}?ref=${encodeURIComponent(ref)}`);
    let base64 = data?.encoding === 'base64' ? data.content : '';
    if (!base64 && data?.sha) base64 = (await call('GET', `${repo}/git/blobs/${data.sha}`)).content; // файл > 1 МБ
    try {
      return { sha: data.sha, text: fromBase64Utf8(base64) };
    } catch {
      throw new GitHubError('bad-file');
    }
  }

  /** Тексты из текущего main: { commit, files: { [path]: { sha, text } } } — все файлы одной версии. */
  async function load(paths) {
    const commit = await headCommit();
    const list = await Promise.all(paths.map((p) => readFile(p, commit)));
    return { commit, files: Object.fromEntries(paths.map((p, i) => [p, list[i]])) };
  }

  /**
   * Сохранение одним коммитом. base — то, что вернул load (commit и sha файлов на момент загрузки);
   * changes — [{ path, text }]. Если правленый файл на сервере успел поменяться — GitHubError('conflict', { files }),
   * ничего не записывается. Изменения в других файлах не мешают: коммит ложится поверх нового main.
   */
  async function save({ base, changes, message }) {
    const head = await headCommit();
    if (head !== base.commit) {
      const now = await Promise.all(changes.map((c) => call('GET', `${repo}/contents/${encodePath(c.path)}?ref=${encodeURIComponent(head)}`)));
      const files = changes.filter((c, i) => now[i]?.sha !== base.files[c.path]?.sha).map((c) => c.path);
      if (files.length) throw new GitHubError('conflict', 409, { files });
    }
    const parent = await call('GET', `${repo}/git/commits/${head}`);
    const blobs = await Promise.all(
      changes.map((c) => call('POST', `${repo}/git/blobs`, { content: toBase64Utf8(c.text), encoding: 'base64' })),
    );
    const tree = await call('POST', `${repo}/git/trees`, {
      base_tree: parent.tree.sha,
      tree: changes.map((c, i) => ({ path: c.path, mode: '100644', type: 'blob', sha: blobs[i].sha })),
    });
    const commit = await call('POST', `${repo}/git/commits`, { message, tree: tree.sha, parents: [head] });
    try {
      await call('PATCH', `${repo}/git/refs/heads/${BRANCH}`, { sha: commit.sha, force: false });
    } catch (err) {
      // кто-то успел записать в main между чтением и записью — ветку не перематываем
      if (err.code === 'rejected') throw new GitHubError('conflict', err.status, { files: changes.map((c) => c.path) });
      throw err;
    }
    return {
      commit: commit.sha,
      url: commit.html_url || '',
      files: Object.fromEntries(changes.map((c, i) => [c.path, { sha: blobs[i].sha, text: c.text }])),
    };
  }

  return { checkAccess, load, save };
}
