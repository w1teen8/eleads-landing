// События в window.dataLayer. GA4 и Meta Pixel вставляются только при непустом ID в src/data/config.json.
// Ровно четыре события: cta_telegram_click {place}, calculator_change {niche, geo, goal, budget},
// calculator_cta_click {niche, geo, goal, budget}, case_open {case}.

let started = false;

function ensureLayer() {
  window.dataLayer = window.dataLayer || [];
  return window.dataLayer;
}

export function track(event, payload = {}) {
  ensureLayer().push({ event, ...payload });
  if (typeof window.gtag === 'function') window.gtag('event', event, payload);
  if (typeof window.fbq === 'function') window.fbq('trackCustom', event, payload);
}

function injectScript(src) {
  const script = document.createElement('script');
  script.async = true;
  script.src = src;
  document.head.append(script);
}

function loadGa4(id) {
  window.gtag = function gtag() {
    // gtag.js читает именно объект arguments
    // eslint-disable-next-line prefer-rest-params
    ensureLayer().push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', id);
  injectScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
}

function loadPixel(id) {
  const fbq = function fbq(...args) {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue.push(args);
  };
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.queue = [];
  window.fbq = fbq;
  window._fbq = fbq;
  injectScript('https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', id);
  fbq('track', 'PageView');
}

/** Место клика: data-place у ссылки или у ближайшего предка. */
function placeOf(link) {
  return link.dataset.place || link.closest('[data-place]')?.dataset.place || 'unknown';
}

/** config — содержимое config.json: { analytics: { ga4Id, metaPixelId } } */
export function initAnalytics(config = {}) {
  ensureLayer();
  if (started) return;
  started = true;

  const { ga4Id = '', metaPixelId = '' } = config.analytics || {};
  if (String(ga4Id).trim()) loadGa4(String(ga4Id).trim());
  if (String(metaPixelId).trim()) loadPixel(String(metaPixelId).trim());

  // Любая ссылка на t.me на странице — cta_telegram_click с местом клика.
  document.addEventListener(
    'click',
    (event) => {
      const link = event.target.closest?.('a[href*="t.me/"]');
      if (link) track('cta_telegram_click', { place: placeOf(link) });
    },
    { capture: true },
  );
}
