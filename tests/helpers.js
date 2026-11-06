// Общие помощники тестов: чтение файлов проекта и сплющивание словарей в набор путей.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

export const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

export function readJson(rel) {
  return JSON.parse(read(rel));
}

// { a: { b: "x", c: ["y"] } } → ["a.b", "a.c.0"]
export function flattenKeys(obj, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object') {
      const inner = flattenKeys(v, path);
      if (inner.length) out.push(...inner);
      else out.push(path);
    } else {
      out.push(path);
    }
  }
  return out;
}
