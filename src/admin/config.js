// Админка текстов (T38): откуда читать и куда сохранять. Токена и адресов почты здесь нет и быть не должно —
// токен вводит владелец сайта на странице /admin/, он живёт только в sessionStorage / localStorage его браузера.

export const OWNER = 'w1teen8';
export const REPO = 'eleads-landing';
export const BRANCH = 'main';

/** Единственный хост, куда уходит токен. Любой другой адрес клиент GitHub отклоняет до запроса. */
export const API = 'https://api.github.com';

export const REPO_URL = `https://github.com/${OWNER}/${REPO}`;
export const ACTIONS_URL = `${REPO_URL}/actions`;
export const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new';

/** Файлы, в которых правятся тексты. kind — как из файла достаются поля (src/admin/model.js). */
export const FILES = [
  { path: 'src/data/content.ua.json', kind: 'content', lang: 'ua' },
  { path: 'src/data/content.en.json', kind: 'content', lang: 'en' },
  { path: 'src/data/faq.json', kind: 'bilingual', section: 'faq' },
  { path: 'src/data/cases.json', kind: 'bilingual', section: 'cases' },
  { path: 'src/data/calculator.json', kind: 'bilingual', section: 'calculator' },
  { path: 'src/data/config.json', kind: 'config', keys: ['telegramUrl', 'telegramHandle'] },
];

/** Предел длины одного значения: самые длинные тексты сайта — около 300 символов. */
export const MAX_LENGTH = 2000;
