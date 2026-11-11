// T38 (H51): клиент GitHub админки на подменённом fetch — вход, чтение из main, сохранение одним коммитом
// (blobs → tree → commit → ref), конфликт sha, токен только на api.github.com. Реальных запросов нет.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GitHubError, createClient, errorText, fromBase64Utf8, toBase64Utf8 } from '../src/admin/github.js';

const TOKEN = `github_pat_${'T3st'.repeat(20)}`;
const REPO = 'https://api.github.com/repos/w1teen8/eleads-landing';

/** Мини-GitHub в памяти: файлы по коммитам, ветка main, журнал запросов. */
function fakeGitHub({ push = true, status = {} } = {}) {
  const log = [];
  let n = 0;
  const sha = (p) => `${p}${String(++n).padStart(6, '0')}`;
  const files = {
    'src/data/content.ua.json': { sha: 'blobua', text: '{\n  "hero": {\n    "title": "Привіт"\n  }\n}\n' },
    'src/data/faq.json': { sha: 'blobfaq', text: '{\n  "items": [\n    { "q": { "ua": "Питання?", "en": "Question?" } }\n  ]\n}\n' },
  };
  const gh = { log, head: 'c0', commits: { c0: { tree: 't0', files: structuredClone(files) } }, blobs: {}, trees: {}, patch: null };

  gh.fetch = async (url, init = {}) => {
    const method = init.method || 'GET';
    const body = init.body ? JSON.parse(init.body) : null;
    log.push({ url, method, auth: init.headers?.Authorization, body, credentials: init.credentials, redirect: init.redirect });
    const reply = (code, data) => ({ ok: code < 300, status: code, headers: new Map(), json: async () => data });
    const u = new URL(url);
    const p = u.pathname.replace('/repos/w1teen8/eleads-landing', '');
    const key = `${method} ${p}`;
    if (status[key]) return reply(status[key], { message: 'x' });
    if (key === 'GET ') return reply(200, { private: false, permissions: { admin: false, push, pull: true } });
    if (key === 'GET /git/ref/heads/main') return reply(200, { object: { sha: gh.head } });
    if (p.startsWith('/contents/') && method === 'GET') {
      const path = decodeURIComponent(p.slice('/contents/'.length));
      const f = gh.commits[u.searchParams.get('ref')]?.files[path];
      if (!f) return reply(404, {});
      const b64 = toBase64Utf8(f.text).replace(/(.{60})/g, '$1\n'); // GitHub переносит base64 по 60 символов
      return reply(200, { sha: f.sha, encoding: 'base64', content: b64 });
    }
    if (method === 'GET' && p.startsWith('/git/commits/')) {
      const c = gh.commits[p.split('/').pop()];
      return c ? reply(200, { sha: p.split('/').pop(), tree: { sha: c.tree } }) : reply(404, {});
    }
    if (key === 'POST /git/blobs') {
      const s = sha('b');
      gh.blobs[s] = fromBase64Utf8(body.content);
      return reply(201, { sha: s });
    }
    if (key === 'POST /git/trees') {
      const s = sha('t');
      gh.trees[s] = body;
      return reply(201, { sha: s });
    }
    if (key === 'POST /git/commits') {
      const s = sha('c');
      const parent = gh.commits[body.parents[0]];
      const next = structuredClone(parent.files);
      for (const e of gh.trees[body.tree].tree) next[e.path] = { sha: e.sha, text: gh.blobs[e.sha] };
      gh.commits[s] = { tree: body.tree, files: next, message: body.message, parents: body.parents };
      return reply(201, { sha: s, html_url: `https://github.com/w1teen8/eleads-landing/commit/${s}` });
    }
    if (key === 'PATCH /git/refs/heads/main') {
      if (gh.commits[body.sha].parents[0] !== gh.head) return reply(422, { message: 'Update is not a fast forward' });
      gh.patch = body;
      gh.head = body.sha;
      return reply(200, { object: { sha: body.sha } });
    }
    return reply(404, {});
  };

  /** Кто-то другой записал в main: новый коммит с изменённым файлом. */
  gh.pushOther = (path, text) => {
    const files = structuredClone(gh.commits[gh.head].files);
    if (path) files[path] = { sha: sha('b'), text };
    const id = sha('c');
    gh.commits[id] = { tree: sha('t'), files, parents: [gh.head] };
    gh.head = id;
  };
  return gh;
}

const PATHS = ['src/data/content.ua.json', 'src/data/faq.json'];

test('вход: push-права есть — ок; токен не принят / нет доступа / только чтение — понятная ошибка', async () => {
  const ok = fakeGitHub();
  await createClient({ token: TOKEN, fetchImpl: ok.fetch }).checkAccess();
  assert.equal(ok.log[0].url, REPO);

  const readOnly = fakeGitHub({ push: false });
  await assert.rejects(createClient({ token: TOKEN, fetchImpl: readOnly.fetch }).checkAccess(), { code: 'no-push' });
  const bad = fakeGitHub({ status: { 'GET ': 401 } });
  await assert.rejects(createClient({ token: TOKEN, fetchImpl: bad.fetch }).checkAccess(), { code: 'bad-token' });
  const hidden = fakeGitHub({ status: { 'GET ': 404 } });
  await assert.rejects(createClient({ token: TOKEN, fetchImpl: hidden.fetch }).checkAccess(), { code: 'no-access' });
  const offline = createClient({ token: TOKEN, fetchImpl: async () => { throw new TypeError('Failed to fetch'); } });
  await assert.rejects(offline.checkAccess(), { code: 'network' });

  for (const code of ['bad-token', 'no-access', 'no-push', 'network', 'conflict', 'rate-limit']) {
    const text = errorText(new GitHubError(code));
    assert.ok(text.length > 20 && !text.includes(TOKEN), code);
  }
});

test('чтение: все файлы из одного коммита main, base64 → UTF-8 с кириллицей', async () => {
  const gh = fakeGitHub();
  const data = await createClient({ token: TOKEN, fetchImpl: gh.fetch }).load(PATHS);
  assert.equal(data.commit, 'c0');
  assert.equal(data.files['src/data/content.ua.json'].text, gh.commits.c0.files['src/data/content.ua.json'].text);
  assert.equal(data.files['src/data/faq.json'].sha, 'blobfaq');
  assert.ok(gh.log.filter((r) => r.url.includes('/contents/')).every((r) => r.url.endsWith('?ref=c0')));
});

test('сохранение: два файла — один коммит (blobs → tree → commit → ref), токен только на api.github.com', async () => {
  const gh = fakeGitHub();
  const client = createClient({ token: TOKEN, fetchImpl: gh.fetch });
  const base = await client.load(PATHS);
  gh.log.length = 0;
  const changes = [
    { path: 'src/data/content.ua.json', text: '{\n  "hero": {\n    "title": "Вітаю — ’"\n  }\n}\n' },
    { path: 'src/data/faq.json', text: '{\n  "items": [\n    { "q": { "ua": "Питання?", "en": "New?" } }\n  ]\n}\n' },
  ];
  const result = await client.save({ base, changes, message: 'Тексти: правка через адмінку (2 поля)' });

  const calls = gh.log.map((r) => `${r.method} ${r.url.replace(REPO, '')}`);
  assert.deepEqual(calls, [
    'GET /git/ref/heads/main',
    'GET /git/commits/c0',
    'POST /git/blobs',
    'POST /git/blobs',
    'POST /git/trees',
    'POST /git/commits',
    'PATCH /git/refs/heads/main',
  ]);
  assert.equal(calls.filter((c) => c === 'POST /git/commits').length, 1, 'ровно один коммит');
  const tree = gh.log.find((r) => r.url.endsWith('/git/trees')).body;
  assert.equal(tree.base_tree, 't0');
  assert.deepEqual(tree.tree.map((e) => [e.path, e.mode, e.type]), [
    ['src/data/content.ua.json', '100644', 'blob'],
    ['src/data/faq.json', '100644', 'blob'],
  ]);
  const commit = gh.log.find((r) => r.url.endsWith('/git/commits') && r.method === 'POST').body;
  assert.deepEqual(commit.parents, ['c0']);
  assert.equal(commit.message, 'Тексти: правка через адмінку (2 поля)');
  assert.equal(commit.author, undefined, 'автор — владелец токена, email в коде не пишется');
  assert.equal(gh.patch.force, false, 'ветка не перематывается силой');
  assert.equal(gh.commits[gh.head].files['src/data/content.ua.json'].text, changes[0].text, 'кириллица дошла как есть');
  assert.equal(result.commit, gh.head);
  assert.match(result.url, /^https:\/\/github\.com\//);

  for (const r of gh.log) {
    assert.ok(r.url.startsWith('https://api.github.com/'), r.url);
    assert.equal(r.auth, `Bearer ${TOKEN}`);
    assert.equal(r.credentials, 'omit');
    assert.equal(r.redirect, 'error');
    assert.ok(!JSON.stringify(r.body ?? '').includes(TOKEN), 'токен не в теле запроса');
  }

  // следующая правка ложится на только что созданный коммит
  const again = await client.save({
    base: { commit: result.commit, files: { 'src/data/faq.json': { sha: result.files['src/data/faq.json'].sha } } },
    changes: [{ path: 'src/data/faq.json', text: changes[1].text.replace('New?', 'Newer?') }],
    message: 'm',
  });
  assert.deepEqual(gh.commits[again.commit].parents, [result.commit]);
});

test('конфликт: правленый файл на сервере изменился — ничего не пишется; изменился другой файл — коммит поверх нового main', async () => {
  const gh = fakeGitHub();
  const client = createClient({ token: TOKEN, fetchImpl: gh.fetch });
  const base = await client.load(PATHS);
  gh.pushOther('src/data/faq.json', '{\n  "items": []\n}\n');
  gh.log.length = 0;
  await assert.rejects(
    client.save({ base, changes: [{ path: 'src/data/faq.json', text: '{}\n' }], message: 'm' }),
    (err) => err.code === 'conflict' && err.files.join() === 'src/data/faq.json',
  );
  assert.ok(!gh.log.some((r) => r.method !== 'GET'), 'при конфликте — только чтение');

  const other = await client.save({ base, changes: [{ path: 'src/data/content.ua.json', text: '{\n  "hero": {}\n}\n' }], message: 'm' });
  assert.deepEqual(gh.commits[other.commit].parents.length, 1);
  assert.equal(gh.commits[other.commit].files['src/data/faq.json'].text, '{\n  "items": []\n}\n', 'чужая правка цела');
});

test('конфликт в последний момент: main ушёл вперёд между чтением и записью ref → conflict, ветка не перезаписана', async () => {
  const gh = fakeGitHub();
  const client = createClient({ token: TOKEN, fetchImpl: gh.fetch });
  const base = await client.load(PATHS);
  const fetchImpl = async (url, init) => {
    if (init?.method === 'PATCH') gh.pushOther(null); // кто-то успел раньше
    return gh.fetch(url, init);
  };
  const racing = createClient({ token: TOKEN, fetchImpl });
  const before = gh.head;
  await assert.rejects(racing.save({ base, changes: [{ path: 'src/data/faq.json', text: '{}\n' }], message: 'm' }), { code: 'conflict' });
  assert.notEqual(gh.head, before);
  assert.equal(gh.patch, null, 'ref не переписан');
});
