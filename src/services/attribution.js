// Источник трафика: откуда пришёл покупатель.
//
// При каждой загрузке приложения определяем «касание» — источник этого визита —
// и запоминаем два касания на устройстве:
//   first — самое первое (откуда человек вообще узнал о магазине);
//   last  — последнее непрямое: прямой заход и запуск Mini App без метки не
//           перетирают рекламу или пост, с которых человек пришёл неделю назад
//           (модель last non-direct click).
// Касание уходит параметрами визита в Метрику, first — параметрами посетителя,
// а first/last — в цели оформления и покупки (см. analytics.js).
//
// Как определяется источник, по убыванию приоритета:
// 1. Telegram Mini App со start-параметром (t.me/AnyFormsBot/shop?startapp=ad-af41):
//    Telegram кладёт его в ?tgWebAppStartParam= и в start_param внутри #tgWebAppData.
//    Формат метки — «источник-кампания[-объявление]», см. parseStartParam.
// 2. utm_source / utm_medium / utm_campaign / utm_content / utm_term.
// 3. Клик-идентификаторы рекламных систем: yclid, gclid, fbclid, vkclid.
// 4. Telegram Mini App без метки — кнопка меню бота, ссылка без startapp.
// 5. Реферер: поисковики — organic, соцсети — social, остальные сайты — referral.
// 6. Встроенный браузер соцсети без реферера (Instagram и т.п.) — social.
// 7. Иначе прямой заход: source (direct), medium (none).

const FIRST_TOUCH_KEY = 'anyforms_first_touch';
const LAST_TOUCH_KEY = 'anyforms_last_touch';
const FIRST_TOUCH_TTL_MS = 365 * 24 * 60 * 60 * 1000;
// Окно атрибуции: реклама, после которой человек думал до месяца, ещё считается.
const LAST_TOUCH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const DIRECT_SOURCE = '(direct)';
export const DIRECT_MEDIUM = '(none)';

// Префиксы start-параметра Telegram: startapp=ad-af41 → telegram_ads / cpc / af41.
// Неизвестный префикс становится источником как есть: startapp=dinara-reels →
// dinara / startapp / reels.
const START_PARAM_SOURCES = {
  ad: { source: 'telegram_ads', medium: 'cpc' },
  post: { source: 'telegram', medium: 'channel_post' },
  bot: { source: 'telegram', medium: 'bot' },
  chat: { source: 'telegram', medium: 'chat' },
  blog: { source: 'blogger', medium: 'referral' },
};

const CLICK_ID_SOURCES = [
  ['yclid', 'yandex', 'cpc'],
  ['gclid', 'google', 'cpc'],
  ['vkclid', 'vk', 'cpc'],
];

const SEARCH_HOSTS = [
  [/(^|\.)yandex\.[a-z.]+$|(^|\.)ya\.ru$/, 'yandex'],
  [/(^|\.)google\.[a-z.]+$/, 'google'],
  [/(^|\.)bing\.com$/, 'bing'],
  [/(^|\.)go\.mail\.ru$/, 'mail.ru'],
  [/(^|\.)duckduckgo\.com$/, 'duckduckgo'],
];

const SOCIAL_HOSTS = [
  [/(^|\.)instagram\.com$/, 'instagram'],
  [/(^|\.)(facebook\.com|fb\.com|fb\.me)$/, 'facebook'],
  [/(^|\.)(vk\.com|vk\.ru|vk\.me)$/, 'vk'],
  [/(^|\.)(t\.me|telegram\.org|telegram\.me|web\.telegram\.org)$/, 'telegram'],
  [/(^|\.)(youtube\.com|youtu\.be)$/, 'youtube'],
  [/(^|\.)pinterest\.[a-z.]+$|(^|\.)pin\.it$/, 'pinterest'],
  [/(^|\.)tiktok\.com$/, 'tiktok'],
  [/(^|\.)threads\.(net|com)$/, 'threads'],
  [/(^|\.)(ok\.ru|odnoklassniki\.ru)$/, 'ok'],
  [/(^|\.)dzen\.ru$/, 'dzen'],
];

// Платёжные страницы возвращают покупателя на /shop/success со своим реферером —
// это не источник трафика.
const IGNORED_REFERRER_HOSTS =
  /(^|\.)(anyforms\.ru|tinkoff\.ru|tbank\.ru|yoomoney\.ru|yookassa\.ru|nspk\.ru|sberbank\.ru|cloudpayments\.ru)$/;

// Встроенные браузеры соцсетей (detectInAppBrowser), которые сами по себе говорят об источнике.
const IN_APP_SOCIAL = new Set(['instagram', 'facebook', 'threads', 'vk', 'tiktok', 'telegram']);

const isBrowser = () => typeof window !== 'undefined';

const clip = (value, max = 100) => {
  const str = String(value ?? '').trim();
  return str ? str.slice(0, max) : '';
};

// Telegram допускает в startapp только A-Z a-z 0-9 _ -, до 64 символов.
export function parseStartParam(raw) {
  const value = clip(raw, 64);
  if (!value) return null;
  const [prefix, ...rest] = value.split('-');
  const known = START_PARAM_SOURCES[prefix.toLowerCase()];
  if (known && rest.length > 0) {
    return { ...known, campaign: rest[0], content: rest.slice(1).join('-') };
  }
  if (rest.length > 0) {
    return { source: prefix.toLowerCase(), medium: 'startapp', campaign: rest[0], content: rest.slice(1).join('-') };
  }
  return { source: 'telegram', medium: 'startapp', campaign: value, content: '' };
}

// Telegram-параметры запуска Mini App: из query (tgWebAppStartParam) и из
// якоря (#tgWebAppData=…start_param%3D…&tgWebAppPlatform=…).
export function readTelegramLaunch(search = '', hash = '') {
  const query = new URLSearchParams(search);
  const hashParams = new URLSearchParams(String(hash).replace(/^#/, ''));
  const initData = hashParams.get('tgWebAppData') || query.get('tgWebAppData');
  const isMiniApp = Boolean(initData) || query.has('tgWebAppStartParam');
  if (!isMiniApp) return null;
  let startParam = query.get('tgWebAppStartParam') || '';
  if (!startParam && initData) {
    startParam = new URLSearchParams(initData).get('start_param') || '';
  }
  return {
    startParam: clip(startParam, 64),
    platform: clip(hashParams.get('tgWebAppPlatform') || query.get('tgWebAppPlatform'), 20),
  };
}

const hostOf = (url) => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
};

const matchHost = (host, table) => table.find(([re]) => re.test(host))?.[1] || null;

// Касание по адресу входа, рефереру и встроенному браузеру. Чистая функция — её
// можно проверить без браузера: classifyTouch({ href, referrer, inAppBrowser }).
export function classifyTouch({ href, referrer = '', inAppBrowser = 'none', now = Date.now() }) {
  const url = new URL(href);
  const query = url.searchParams;
  const base = { landing: clip(url.pathname, 120), at: now };
  const touch = (fields) => ({
    source: '',
    medium: '',
    campaign: '',
    content: '',
    term: '',
    start_param: '',
    referrer: '',
    ...base,
    ...fields,
  });

  const telegram = readTelegramLaunch(url.search, url.hash);
  if (telegram?.startParam) {
    return touch({ ...parseStartParam(telegram.startParam), start_param: telegram.startParam });
  }

  const utmSource = clip(query.get('utm_source'), 64);
  if (utmSource) {
    return touch({
      source: utmSource.toLowerCase(),
      medium: clip(query.get('utm_medium'), 64).toLowerCase() || 'referral',
      campaign: clip(query.get('utm_campaign')),
      content: clip(query.get('utm_content')),
      term: clip(query.get('utm_term')),
    });
  }

  const clickId = CLICK_ID_SOURCES.find(([param]) => query.has(param));
  if (clickId) {
    return touch({ source: clickId[1], medium: clickId[2] });
  }
  // fbclid Meta добавляет и к обычным ссылкам из Instagram/Facebook, не только к рекламе.
  if (query.has('fbclid')) {
    return touch({ source: inAppBrowser === 'instagram' ? 'instagram' : 'facebook', medium: 'social' });
  }

  if (telegram) {
    return touch({ source: 'telegram', medium: 'miniapp' });
  }

  const refHost = hostOf(referrer);
  if (refHost && !IGNORED_REFERRER_HOSTS.test(refHost)) {
    const search = matchHost(refHost, SEARCH_HOSTS);
    if (search) return touch({ source: search, medium: 'organic', referrer: refHost });
    const social = matchHost(refHost, SOCIAL_HOSTS);
    if (social) return touch({ source: social, medium: 'social', referrer: refHost });
    return touch({ source: refHost.replace(/^www\./, ''), medium: 'referral', referrer: refHost });
  }

  if (IN_APP_SOCIAL.has(inAppBrowser)) {
    return touch({ source: inAppBrowser, medium: 'social' });
  }

  return touch({ source: DIRECT_SOURCE, medium: DIRECT_MEDIUM });
}

export const isDirect = (touch) => !touch || touch.source === DIRECT_SOURCE;

// Повторный запуск Mini App без метки (кнопка меню бота, закреп в чате) — по сути
// прямой заход внутри Telegram: он не должен перетирать рекламу, с которой человек
// пришёл впервые. Первым касанием он при этом быть может.
const isWeak = (touch) => isDirect(touch) || (touch.source === 'telegram' && touch.medium === 'miniapp');

const readTouch = (key, ttlMs) => {
  try {
    const touch = JSON.parse(localStorage.getItem(key) || 'null');
    if (!touch || typeof touch !== 'object' || !touch.source) return null;
    return Date.now() - (Number(touch.at) || 0) < ttlMs ? touch : null;
  } catch {
    return null;
  }
};

const writeTouch = (key, touch) => {
  try {
    localStorage.setItem(key, JSON.stringify(touch));
  } catch {
    /* без localStorage атрибуция живёт только в рамках загрузки */
  }
};

let state = { session: null, first: null, last: null };

// Вызывается один раз при загрузке приложения, до того как роутер перепишет URL.
// Возврат с оплаты (/shop/success) источником не считается и касаний не меняет.
export function captureAttribution(inAppBrowser) {
  if (!isBrowser()) return state;
  const isPaymentReturn = window.location.pathname.startsWith('/shop/success');
  const session = isPaymentReturn
    ? null
    : classifyTouch({ href: window.location.href, referrer: document.referrer, inAppBrowser });

  let first = readTouch(FIRST_TOUCH_KEY, FIRST_TOUCH_TTL_MS);
  let last = readTouch(LAST_TOUCH_KEY, LAST_TOUCH_TTL_MS);
  if (session) {
    if (!first) {
      first = session;
      writeTouch(FIRST_TOUCH_KEY, first);
    }
    if (!last || !isWeak(session) || (isDirect(last) && !isDirect(session))) {
      last = session;
      writeTouch(LAST_TOUCH_KEY, last);
    }
  }
  state = { session, first, last };
  return state;
}

export function getAttribution() {
  if (!state.first && !state.last && isBrowser()) {
    state = {
      ...state,
      first: readTouch(FIRST_TOUCH_KEY, FIRST_TOUCH_TTL_MS),
      last: readTouch(LAST_TOUCH_KEY, LAST_TOUCH_TTL_MS),
    };
  }
  return state;
}

// Плоские параметры для целей Метрики и dataLayer: источник заказа (last) и первое касание.
export function attributionParams() {
  const { first, last } = getAttribution();
  return {
    traffic_source: last?.source || 'unknown',
    traffic_medium: last?.medium || 'unknown',
    ...(last?.campaign ? { traffic_campaign: last.campaign } : {}),
    first_source: first?.source || 'unknown',
    first_medium: first?.medium || 'unknown',
    ...(first?.campaign ? { first_campaign: first.campaign } : {}),
  };
}
