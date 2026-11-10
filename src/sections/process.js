// 07 Процес (T29): семь шагов в один ряд, номер шага крупно шрифтом канала. Переходов и появления по прокрутке нет (H11);
// всё движение блока — hover-микродвижения в CSS (transform/opacity). Здесь — только акцентная строка заголовка.
import { accentTitles } from '../core/title-accent.js';

export function init(root) {
  accentTitles(root);
}
