// 12 Матеріали (T36, H49): картки-пости, як у каналі Telegram — выбор пользователя, вариант A
// (reference/run3/materials-A-chosen.png). Четыре превью постов: обложка, строка канала, заголовок, «Читати в Telegram».
// T40 (документ клиента, блок 12): у карточки — зображення поста (materials.items.*.image, файл в public/img/posts/;
// пока пусто — прежняя обложка-заглушка), назва, опис 1–3 речення (materials.items.*.text), джерело — фото и название
// канала «єЛіди! → [маркетинг]» (materials.channel, materials.channelImage; без фото — круг-заглушка) и кнопка
// «Читати в Telegram» на пост (materials.items.*.url; пока пусто — общий config.telegramUrl из разметки).
// Пути и ссылки — строки словаря: их правит владелец сайта в админке; сюда пускаются только проверенные (postUrl, imagePath).
// Лента в духе showcase-scroll (H07): на широком экране блок закрепляется под шапкой, карточки едут влево по мере
// прокрутки страницы (showcaseScroll из motion-kit — единственный переход по прокрутке, H11). На узком экране и при
// reduced-motion — горизонтальная прокрутка пальцем (CSS, .is-static).
import { $, $$, el } from '../core/dom.js';
import { accentTitles } from '../core/title-accent.js';
import { showcaseScroll } from '../core/motion-kit.js';
import { t, onLangChange } from '../core/i18n.js';
import { publicUrl } from '../core/public-url.js';

/** Ссылка на пост канала: только https://t.me/<канал> или https://t.me/<канал>/<номер>; иначе null. */
export const postUrl = (v) => {
  const s = typeof v === 'string' ? v.trim() : '';
  return /^https:\/\/t\.me\/[A-Za-z0-9_]{3,64}(?:\/\d{1,10})?\/?$/.test(s) ? s : null;
};

/** Картинка из public/ (например img/posts/8-sposobiv.webp): без «..», адресов и схем, webp/avif/jpg/png; иначе null. */
export const imagePath = (v) => {
  const s = typeof v === 'string' ? v.trim() : '';
  return /^(?!\/\/)\/?(?!.*\.\.)[A-Za-z0-9_\-/.]+\.(?:webp|avif|jpe?g|png)$/i.test(s) ? s : null;
};

const str = (key) => {
  const v = t(key);
  return typeof v === 'string' && v !== key ? v : '';
};

/** Картинка в рамке box (обложка поста, фото канала): нет пути или файл не загрузился — остаётся заглушка. */
function paintImage(box, value, cls) {
  if (!box) return;
  const path = imagePath(value);
  const old = $(`.${cls}`, box);
  if (old && old.dataset.path === path) return;
  old?.remove();
  box.classList.remove('has-image');
  if (!path) return;
  const img = el('img', { class: cls, attrs: { src: publicUrl(path), alt: '', loading: 'lazy', decoding: 'async' } });
  img.dataset.path = path;
  img.addEventListener('load', () => box.classList.add('has-image'), { once: true });
  img.addEventListener(
    'error',
    () => {
      img.remove();
      box.classList.remove('has-image');
    },
    { once: true },
  );
  box.append(img);
}

/** Данные поста из словаря текущего языка: картинки, ссылка, заглушки «уточнити». */
function paint(root) {
  const tbd = str('common.tbd');
  for (const node of $$('.mat__title, .mat__text', root)) node.classList.toggle('is-tbd', Boolean(tbd) && node.textContent.trim() === tbd);
  for (const avatar of $$('[data-mat-channel-image]', root)) paintImage(avatar, str('materials.channelImage'), 'mat__avatar-img');
  for (const cover of $$('[data-mat-image]', root)) paintImage(cover, str(`materials.items.${cover.dataset.matImage}.image`), 'mat__cover-img');
  for (const link of $$('[data-mat-url]', root)) {
    // общий адрес канала из разметки (config.telegramUrl) — запасной, пока у поста нет своей ссылки
    link.dataset.fallback ??= link.getAttribute('href') || '';
    link.setAttribute('href', postUrl(str(`materials.items.${link.dataset.matUrl}.url`)) || link.dataset.fallback);
  }
}

export function init(root) {
  accentTitles(root);
  paint(root);
  onLangChange(() => paint(root));

  const track = $('[data-mat-track]', root);
  const progress = $('[data-mat-progress]', root);
  if (!track) return;
  const ride = showcaseScroll(root, track, {
    onProgress: (p) => {
      if (progress) progress.style.transform = `scaleX(${p})`;
    },
  });
  // лента не поедет (reduced-motion, ?nomotion=1, GSAP не загрузился) — запасная горизонтальная прокрутка
  ride.ready.then((ok) => root.classList.toggle('is-static', !ok));
}
