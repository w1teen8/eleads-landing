// 14 Фінальний CTA (T37; T41 — документ клиента, стр. 14; 2026-11-11): слева заголовок, текст и кнопка в Telegram,
// справа — вырезанная фигура Володимира с тёплым свечением за головой. Фон всего блока — «Silk» (выбор пользователя
// «silk сделай на весь блок»): тонкие линии складываются в шёлковую ткань, которая медленно волнуется, по ней
// пробегает тёплый отблеск.
// 2026-11-12 «Сделай чтобы не лагало» → «сделай как видео на фоне»: ткань, которую браузер рисовал каждый кадр
// (12 кадров/с при 4× замедлении процессора, без неё — 30), заранее отрисована в бесшовную петлю (build/render-silk.cjs)
// и здесь только проигрывается: декодирует видеокарта, страница ничего не считает. Чёрный фон кадра убирает режим
// screen (cta.css) — сквозь ткань видна пыль. Видео создаётся здесь (в HTML его нет — без JS блок просто без ткани),
// грузится, только когда блок подъезжает к экрану, играет, пока виден, и встаёт, когда вкладка скрыта.
// reduced-motion / ?nomotion=1 — только заставка (первый кадр), видео не грузится.
import { accentTitles } from '../core/title-accent.js';
import { t, onLangChange } from '../core/i18n.js';
import { reduced } from '../core/motion.js';
import { publicUrl } from '../core/public-url.js';

/** Широкий альбомный экран — горизонтальная петля, иначе (телефон, портрет) — вертикальная. Как раскладка блока. */
export const SILK_MEDIA = '(min-width: 900px) and (orientation: landscape)';

/** Файл петли без расширения: .mp4 — видео, .jpg — заставка. */
export const silkFile = (wide) => `/video/silk-${wide ? 1920 : 720}`;

export function init(root) {
  accentTitles(root);
  accentPhrase(root);
  silk(root);
}

/** «…реклами. Можемо просто познайомитися, поспілкуватися…» + «Можемо просто познайомитися» → три части; фразы нет → null. */
export function splitPhrase(full, phrase) {
  if (typeof full !== 'string' || typeof phrase !== 'string' || !phrase.trim()) return null;
  const at = full.indexOf(phrase.trim());
  if (at < 0) return null;
  return { before: full.slice(0, at), accent: phrase.trim(), after: full.slice(at + phrase.trim().length) };
}

/** 2026-11-12 клиент о тексте под заголовком: «Якось дуже простенько. Наче не на своєму місці він» — пользователь выбрал
 *  «Крупно с акцентом»: текст крупнее и светлее, с жёлтой чертой слева (cta.css), ключевая фраза (cta.textAccent) —
 *  жёлтым. Текст пре-рендерится целиком; здесь фраза оборачивается в span. Смена языка — заново. */
function accentPhrase(root) {
  const nodes = [...root.querySelectorAll('[data-text-accent]')];
  const apply = (node) => {
    const parts = splitPhrase(t(node.dataset.i18n), t(node.dataset.textAccent));
    if (!parts) return;
    const accent = document.createElement('span');
    accent.className = 'cta__text-accent';
    accent.textContent = parts.accent;
    node.replaceChildren(document.createTextNode(parts.before), accent, document.createTextNode(parts.after));
  };
  nodes.forEach(apply);
  onLangChange(() => nodes.forEach(apply));
}

function silk(root) {
  const video = document.createElement('video');
  video.className = 'cta__silk';
  video.setAttribute('aria-hidden', 'true');
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = 'none';
  video.disablePictureInPicture = true;
  for (const a of ['muted', 'playsinline', 'loop']) video.setAttribute(a, '');
  root.prepend(video);

  const mq = window.matchMedia?.(SILK_MEDIA);
  let file = '';
  let near = false;
  let visible = false;

  const pick = () => {
    const next = silkFile(Boolean(mq?.matches));
    if (next === file) return;
    file = next;
    video.poster = publicUrl(`${file}.jpg`);
    if (video.getAttribute('src')) video.src = publicUrl(`${file}.mp4`);
    sync();
  };

  function sync() {
    if (reduced) return;
    if (near && !video.getAttribute('src')) video.src = publicUrl(`${file}.mp4`);
    if (visible && !document.hidden) video.play?.()?.catch?.(() => {});
    else if (!video.paused) video.pause();
  }

  pick();
  if (reduced) return;
  mq?.addEventListener?.('change', pick);
  document.addEventListener('visibilitychange', sync);
  if (!('IntersectionObserver' in window)) {
    near = visible = true;
    sync();
    return;
  }
  // загрузка — заранее, за полэкрана до блока; проигрывание — только пока блок на экране
  new IntersectionObserver(([e]) => { if (e.isIntersecting) { near = true; sync(); } }, { rootMargin: '50% 0px' }).observe(root);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: 0.02 }).observe(root);
}
