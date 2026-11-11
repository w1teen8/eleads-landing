// Где живёт токен: sessionStorage (до закрытия вкладки) или, по галочке «Запамʼятати», localStorage.
// «Вийти» стирает из обоих. Хранилища подменяются в тестах; недоступное хранилище (приватный режим) — не ошибка.
const KEY = 'eleads-admin-token';

/** fine-grained (github_pat_…) или классический (ghp_…) токен; пробелы по краям при вставке убираются заранее. */
export const isTokenShape = (token) => /^(?:github_pat_|gh[pousr]_)[A-Za-z0-9_]{20,250}$/.test(String(token));

function browserStores() {
  const pick = (name) => {
    try {
      return globalThis[name] || null;
    } catch {
      return null;
    }
  };
  return { session: pick('sessionStorage'), local: pick('localStorage') };
}

const safe = (fn, fallback = null) => {
  try {
    return fn();
  } catch {
    return fallback;
  }
};

export function loadToken(stores = browserStores()) {
  const token = safe(() => stores.session?.getItem(KEY)) || safe(() => stores.local?.getItem(KEY)) || '';
  return isTokenShape(token) ? token : '';
}

export function saveToken(token, remember, stores = browserStores()) {
  clearToken(stores);
  const target = remember ? stores.local : stores.session;
  safe(() => target?.setItem(KEY, token));
}

export function clearToken(stores = browserStores()) {
  safe(() => stores.session?.removeItem(KEY));
  safe(() => stores.local?.removeItem(KEY));
}
