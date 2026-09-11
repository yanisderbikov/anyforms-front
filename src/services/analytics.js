// Единый аналитический модуль маркетплейса.
//
// Два получателя:
// 1. window.dataLayer — его читают GTM → GA4 и e-commerce Яндекс.Метрики
//    (в index.html включён ecommerce:"dataLayer"). Компоненты вызывают только
//    track*-функции отсюда и не пишут в dataLayer напрямую.
// 2. JS-цели Яндекс.Метрики (reachGoal) — воронка по шагам с параметрами:
//    магазин, товар, что заполнено в чекауте и т.п. Идентификаторы целей и
//    их параметры перечислены в docs/analytics-setup.md — цели с такими же
//    идентификаторами должны быть созданы в интерфейсе Метрики.
//
// К каждому событию (и в dataLayer, и в Метрику) добавляются:
//   shop           — витрина, на которой находится покупатель (см. setAnalyticsShop);
//   in_app_browser — встроенный браузер соцсети (instagram, vk, …) или none.
// Отдельно они же отправляются как параметры визита Метрики (ym 'params'),
// чтобы по ним можно было строить сегменты и сравнивать конверсию.
//
// Отправка аналитики управляется так (по убыванию приоритета):
// 1. VITE_ANALYTICS_ENABLED=false — жёстко выключить всё: GTM (включая VITE_GTM_ID),
//    вызовы Метрики (hit/params/reachGoal) и Top.Mail.Ru;
// 2. VITE_ANALYTICS_ENABLED=true — принудительно включить (например, на стенде);
// 3. иначе автоматика по домену: GTM грузится только на anyforms.ru/www.anyforms.ru.
// Локальные запуски (pnpm dev/start, предпросмотр прод-сборки) и dev-стенды
// (поддомены, gh-pages) аналитику НЕ шлют — события копятся в dataLayer,
// но контейнер не подключается и наружу ничего не уходит. Счётчик Метрики
// (window.ym) инициализируется в index.html тоже только на прод-домене, поэтому
// вне прода reachGoal/hit — no-op.
// Для отладки задайте ТЕСТОВЫЙ контейнер в VITE_GTM_ID — он грузится и вне прода.

const YM_COUNTER_ID = 106593235;
// Top.Mail.Ru: счётчик из index.html, ему тоже сообщаем о SPA-переходах.
const TMR_COUNTER_ID = '3747979';

// Боевой контейнер GTM захардкожен: ID публичный, настраивать env на CI не нужно.
const PROD_GTM_ID = 'GTM-MBTTRF2N';
const CURRENCY = 'RUB';

// Витрина по умолчанию — как DEFAULT_SHOP_SLUG в CartContext (не импортируем,
// чтобы модуль аналитики не зависел от React-контекста).
const DEFAULT_SHOP = 'anyforms';
const CART_SHOP_STORAGE_KEY = 'anyforms_cart_shop';
const SHOP_RESERVED_SEGMENTS = new Set(['product', 'cart', 'checkout', 'success', 'offer']);

const CHECKOUT_SNAPSHOT_KEY = 'anyforms_checkout_snapshot';
const PURCHASE_SENT_PREFIX = 'ga4_purchase_sent_';

const isBrowser = () => typeof window !== 'undefined';

// Прод-домены — как в index.html (__ANYFORMS_PROD_HOST): ровно anyforms.ru и www,
// поддомены (dev-стенды) продом не считаются.
const isProdHost = () =>
  isBrowser() && /^(www\.)?anyforms\.ru$/.test(window.location.hostname);

// Жёсткий выключатель: VITE_ANALYTICS_ENABLED=false глушит всё, включая вызовы
// Метрики и Top.Mail.Ru (их счётчики index.html на прод-домене создаёт всегда,
// поэтому проверять флаг нужно перед каждым вызовом, а не только при загрузке GTM).
const analyticsHardOff = () => import.meta.env.VITE_ANALYTICS_ENABLED === 'false';

const analyticsEnabled = () => {
  if (analyticsHardOff()) return false;
  if (import.meta.env.VITE_ANALYTICS_ENABLED === 'true') return true;
  return isProdHost();
};

// Метка окружения уходит с каждым событием: даже если тестовый и боевой
// контейнеры GTM когда-нибудь укажут на одну GA4 property, события можно
// разделить фильтром по environment. Переопределяется через VITE_ANALYTICS_ENV.
const analyticsEnv = () =>
  import.meta.env.VITE_ANALYTICS_ENV || (isProdHost() ? 'production' : 'development');

// Все вызовы Метрики (hit, params, reachGoal) идут через этот хелпер и
// уважают жёсткий выключатель.
const callYm = (...args) => {
  if (!isBrowser() || analyticsHardOff() || typeof window.ym !== 'function') return;
  window.ym(YM_COUNTER_ID, ...args);
};

// Цена может прийти строкой рублей ("1 190", "1190,50") — приводим к числу.
const toPrice = (value) => {
  if (typeof value === 'number') return value;
  const cleaned = String(value ?? '').replace(/[^\d.,]/g, '').replace(',', '.');
  return Number(cleaned) || 0;
};

// ---------------------------------------------------------------------------
// Контекст: магазин и встроенный браузер
// ---------------------------------------------------------------------------

// Встроенный браузер соцсети по user agent. Почти весь трафик магазина идёт из
// Instagram, а его in-app браузер по-своему обращается с формами и редиректом
// в платёжку — конверсию нужно уметь сравнить с обычным браузером.
export function detectInAppBrowser(ua = isBrowser() ? navigator.userAgent : '') {
  if (!ua) return 'unknown';
  if (/Instagram/i.test(ua)) return 'instagram';
  if (/Barcelona/i.test(ua)) return 'threads';
  if (/FBAN|FBAV|FB_IAB/i.test(ua)) return 'facebook';
  if (/VKAndroidApp|VKiOSApp|vkclient/i.test(ua)) return 'vk';
  if (/BytedanceWebview|musical_ly|TikTok/i.test(ua)) return 'tiktok';
  if (/Telegram/i.test(ua)) return 'telegram';
  // Безымянные WebView: Android помечает их «; wv)», у iOS нет токена Safari.
  if (/; wv\)/.test(ua)) return 'webview';
  if (/iPhone|iPad|iPod/.test(ua) && !/Safari/.test(ua)) return 'webview';
  return 'none';
}

let inAppBrowserCache = null;
const inAppBrowser = () => {
  if (inAppBrowserCache === null) inAppBrowserCache = detectInAppBrowser();
  return inAppBrowserCache;
};

// Витрина из пути: /shop → anyforms, /shop/<slug> и /shop/<slug>/product/… → slug.
// Для служебных страниц (/shop/cart, /shop/checkout, /shop/success) витрина
// определяется по корзине, а не по пути.
const shopFromPath = (pathname) => {
  const match = String(pathname || '').match(/^\/shop(?:\/([^/?#]+))?(?:\/|$)/);
  if (!match) return null;
  const segment = match[1];
  if (!segment) return DEFAULT_SHOP;
  if (SHOP_RESERVED_SEGMENTS.has(segment)) return null;
  return segment;
};

const shopFromCartStorage = () => {
  try {
    return localStorage.getItem(CART_SHOP_STORAGE_KEY) || null;
  } catch {
    return null;
  }
};

let currentShop = null;
let lastShopParamSent = null;

// Вызывается из App при смене маршрута: на витрине и карточке товара — slug из
// пути, на страницах корзины/чекаута/успеха — витрина, с которой набрана корзина.
// Новый магазин сразу уходит параметром визита в Метрику.
export function setAnalyticsShop(slug) {
  currentShop = slug || null;
  if (currentShop && currentShop !== lastShopParamSent) {
    lastShopParamSent = currentShop;
    callYm('params', { shop: currentShop });
  }
}

const resolveShop = () => {
  if (!isBrowser()) return DEFAULT_SHOP;
  const pathname = window.location.pathname;
  const pathShop =
    shopFromPath(pathname) ||
    (/^\/shop\/product(?:\/|$)/.test(pathname) ? DEFAULT_SHOP : null);
  if (pathShop) return pathShop;
  if (pathname.startsWith('/shop/')) return shopFromCartStorage() || currentShop || DEFAULT_SHOP;
  return currentShop || DEFAULT_SHOP;
};

// Параметры визита Метрики, общие для всех событий сессии.
function sendVisitContext() {
  callYm('params', { in_app_browser: inAppBrowser() });
}

export function initAnalytics() {
  if (!isBrowser() || analyticsHardOff()) return;
  sendVisitContext();
  const gtmId = import.meta.env.VITE_GTM_ID || (analyticsEnabled() ? PROD_GTM_ID : '');
  if (!gtmId) return;
  if (document.getElementById('gtm-loader')) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

  const script = document.createElement('script');
  script.id = 'gtm-loader';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(gtmId)}`;
  document.head.appendChild(script);
}

// ---------------------------------------------------------------------------
// Просмотры страниц в SPA
// ---------------------------------------------------------------------------

// Метрика и Top.Mail.Ru сами видят только первую загрузку; переходы внутри
// SPA (витрина → товар → корзина → чекаут) нужно отправлять вручную, иначе
// воронка по URL, страницы выхода и Вебвизор по страницам не работают.
// GA4 SPA-переходы ловит сама (enhanced measurement, history change).
let lastHitUrl = null;

export function trackPageView(url, { initial = false, title } = {}) {
  if (!isBrowser() || !url || url === lastHitUrl) return;
  const previousUrl = lastHitUrl;
  lastHitUrl = url;
  // Первую страницу счётчики уже посчитали при инициализации — только запоминаем.
  if (initial) return;
  callYm('hit', url, {
    title: title ?? document.title,
    referer: previousUrl ?? document.referrer,
  });
  if (!analyticsHardOff() && Array.isArray(window._tmr)) {
    window._tmr.push({ id: TMR_COUNTER_ID, type: 'pageView', start: Date.now(), url });
  }
}

// ---------------------------------------------------------------------------
// Низкоуровневая отправка
// ---------------------------------------------------------------------------

export function pushAnalyticsEvent(event, payload = {}) {
  if (!isBrowser()) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event,
    environment: analyticsEnv(),
    shop: resolveShop(),
    in_app_browser: inAppBrowser(),
    ...payload,
  });
  if (import.meta.env.DEV) {
    console.debug('[analytics]', event, payload);
  }
}

// JS-цель Метрики с параметрами. Значения — строки и числа: так они читаются
// в отчёте «Параметры визитов» и годятся для сегментов.
function reachGoal(goal, params = {}) {
  callYm('reachGoal', goal, {
    shop: resolveShop(),
    in_app_browser: inAppBrowser(),
    ...params,
  });
  if (import.meta.env.DEV) {
    console.debug('[metrika goal]', goal, params);
  }
}

export function trackMetrikaGoal(goal, params = {}) {
  callYm('reachGoal', goal, params);
}

// Общий helper для стандартных e-commerce событий: перед событием сбрасываем
// предыдущий объект ecommerce, чтобы старые items не «протекали» в новое событие.
function pushEcommerceEvent(event, ecommerce, extra = {}) {
  if (!isBrowser()) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null });
  pushAnalyticsEvent(event, { ...extra, ecommerce });
}

// product — товар каталога/страницы товара ({id, price, ...}) или позиция
// корзины из CartContext ({id, price, quantity, variantLabel}).
// Вариант товара уходит в item_variant и добавляется к имени («Лилит 20 см»).
const displayName = (product) =>
  product.variantLabel
    ? `${product.name ?? ''} ${product.variantLabel}`.trim()
    : String(product.name ?? '');

function buildItem(product, { quantity, index, listName } = {}) {
  const item = { item_id: String(product.id) };
  if (product.name) item.item_name = displayName(product);
  if (product.variantLabel) item.item_variant = String(product.variantLabel);
  const price = toPrice(product.price);
  if (price > 0) item.price = price;
  if (quantity != null) item.quantity = quantity;
  if (index != null) item.index = index;
  if (listName) item.item_list_name = listName;
  return item;
}

const buildCartItems = (cartItems) =>
  cartItems.map((cartItem) =>
    buildItem(cartItem, { quantity: Number(cartItem.quantity) || 0, listName: 'cart' })
  );

const cartValue = (cartItems) =>
  cartItems.reduce((sum, i) => sum + toPrice(i.price) * (Number(i.quantity) || 0), 0);

// Параметры цели Метрики про один товар.
const productParams = (product) => ({
  product_id: String(product.id),
  product_name: displayName(product),
  ...(product.variantLabel ? { variant: String(product.variantLabel) } : {}),
  price: toPrice(product.price),
});

// Параметры цели Метрики про состав корзины: products — дерево «название → штук»,
// product_ids — список id строкой (для фильтров и выгрузок).
const cartParams = (cartItems) => ({
  items_count: cartItems.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0),
  value: cartValue(cartItems),
  product_ids: cartItems.map((i) => String(i.id)).join(','),
  products: cartItems.reduce((acc, i) => {
    const key = displayName(i) || String(i.id);
    acc[key] = (acc[key] || 0) + (Number(i.quantity) || 0);
    return acc;
  }, {}),
});

const yesNo = (value) => (value ? 'yes' : 'no');

// ---------------------------------------------------------------------------
// Каталог
// ---------------------------------------------------------------------------

export function trackViewItemList(products, listName = 'catalog') {
  if (!Array.isArray(products) || products.length === 0) return;
  pushEcommerceEvent('view_item_list', {
    item_list_name: listName,
    items: products.map((product, index) => buildItem(product, { index, listName })),
  });
}

export function trackSelectItem(product, index, listName = 'catalog') {
  if (!product) return;
  pushEcommerceEvent('select_item', {
    item_list_name: listName,
    items: [buildItem(product, { index, listName })],
  });
  reachGoal('select_item', {
    ...productParams(product),
    ...(index != null ? { index } : {}),
    list: listName,
  });
}

// ---------------------------------------------------------------------------
// Страница товара
// ---------------------------------------------------------------------------

export function trackViewItem(product) {
  if (!product) return;

  // Существующая цель Метрики — счётчик открытий карточки товара.
  reachGoal('product_open', productParams(product));

  pushEcommerceEvent('view_item', {
    currency: CURRENCY,
    value: toPrice(product.price),
    items: [buildItem(product, { quantity: 1, listName: 'product_page' })],
  });
}

// ---------------------------------------------------------------------------
// Лайки (wishlist)
// ---------------------------------------------------------------------------

export function trackAddToWishlist(product, { placement, index } = {}) {
  if (!product) return;
  pushEcommerceEvent(
    'add_to_wishlist',
    {
      currency: CURRENCY,
      value: toPrice(product.price),
      items: [buildItem(product, { quantity: 1, index, listName: placement })],
    },
    {
      item_id: String(product.id),
      ...(product.name ? { item_name: String(product.name) } : {}),
      ...(placement ? { placement } : {}),
    }
  );
  reachGoal('add_to_wishlist', {
    ...productParams(product),
    ...(placement ? { placement } : {}),
  });
}

export function trackRemoveFromWishlist(product, { placement, index } = {}) {
  if (!product) return;
  pushEcommerceEvent(
    'remove_from_wishlist',
    {
      items: [buildItem(product, { quantity: 1, index, listName: placement })],
    },
    {
      item_id: String(product.id),
      ...(product.name ? { item_name: String(product.name) } : {}),
      ...(placement ? { placement } : {}),
    }
  );
  reachGoal('remove_from_wishlist', {
    ...productParams(product),
    ...(placement ? { placement } : {}),
  });
}

// ---------------------------------------------------------------------------
// Корзина
// ---------------------------------------------------------------------------

// quantity — сколько единиц добавлено именно этим действием (разница, не итог).
export function trackAddToCart(product, { quantity = 1, placement, index } = {}) {
  if (!product) return;
  pushEcommerceEvent(
    'add_to_cart',
    {
      currency: CURRENCY,
      value: toPrice(product.price) * quantity,
      items: [buildItem(product, { quantity, index, listName: placement })],
    },
    {
      item_id: String(product.id),
      ...(product.name ? { item_name: String(product.name) } : {}),
      ...(placement ? { placement } : {}),
    }
  );
  reachGoal('add_to_cart', {
    ...productParams(product),
    quantity,
    ...(placement ? { placement } : {}),
  });
}

// quantity — сколько единиц удалено этим действием.
// removalType: 'quantity_decrease' | 'full_remove'.
export function trackRemoveFromCart(product, { quantity = 1, placement = 'cart', removalType } = {}) {
  if (!product) return;
  pushEcommerceEvent(
    'remove_from_cart',
    {
      currency: CURRENCY,
      value: toPrice(product.price) * quantity,
      items: [buildItem(product, { quantity, listName: placement })],
    },
    { placement, ...(removalType ? { removal_type: removalType } : {}) }
  );
  reachGoal('remove_from_cart', {
    ...productParams(product),
    quantity,
    placement,
    ...(removalType ? { removal_type: removalType } : {}),
  });
}

export function trackViewCart(cartItems) {
  const items = buildCartItems(cartItems);
  pushEcommerceEvent('view_cart', {
    currency: CURRENCY,
    value: cartValue(cartItems),
    items,
  });
  reachGoal('view_cart', cartParams(cartItems));
}

// Техническое событие про изменение количества; стандартные add_to_cart /
// remove_from_cart с дельтой отправляются отдельно.
export function trackChangeCartQuantity(productId, previousQuantity, newQuantity) {
  pushAnalyticsEvent('change_cart_quantity', {
    item_id: String(productId),
    previous_quantity: previousQuantity,
    new_quantity: newQuantity,
    quantity_delta: newQuantity - previousQuantity,
  });
}

// ---------------------------------------------------------------------------
// Оформление и оплата
// ---------------------------------------------------------------------------

// Кнопка «Оформить заказ» в корзине.
export function trackBeginCheckout(cartItems) {
  pushEcommerceEvent('begin_checkout', {
    currency: CURRENCY,
    value: cartValue(cartItems),
    items: buildCartItems(cartItems),
  });
  reachGoal('begin_checkout', cartParams(cartItems));
}

// Страница чекаута открыта (с непустой корзиной). prefilled_* — подставились ли
// контакты и ПВЗ из прошлого заказа: таким покупателям заполнять почти нечего.
export function trackCheckoutOpen(cartItems, { prefilledContact = false, prefilledPvz = false } = {}) {
  const params = {
    ...cartParams(cartItems),
    prefilled_contact: yesNo(prefilledContact),
    prefilled_pvz: yesNo(prefilledPvz),
  };
  pushAnalyticsEvent('checkout_open', params);
  reachGoal('checkout_open', params);
}

// Покупатель закончил ввод в поле формы (blur с непустым значением).
// field: name | phone | email | promo; valid — прошло ли значение валидацию.
export function trackCheckoutField(field, valid) {
  const params = { field, valid: valid ? 'valid' : 'invalid' };
  pushAnalyticsEvent('checkout_field', params);
  reachGoal('checkout_field', params);
}

// Поиск пункта выдачи СДЭК. outcome: ok | empty | error.
// query — город/улица, не персональные данные; обрезаем на всякий случай.
export function trackPvzSearch(outcome, { query = '', results = 0 } = {}) {
  const params = { outcome, query: String(query).slice(0, 40), results };
  pushAnalyticsEvent('pvz_search', params);
  reachGoal(`pvz_search_${outcome}`, params);
}

export function trackPvzSelected(pvz) {
  const params = { city: String(pvz?.pvzCity ?? '').slice(0, 40) };
  pushAnalyticsEvent('pvz_selected', params);
  reachGoal('pvz_selected', params);
}

// Промокод: applied — применён, rejected — не подошёл (reason — текст бэкенда), error — не проверился.
export function trackPromoCode(outcome, { code = '', reason = '' } = {}) {
  const params = {
    outcome,
    code: String(code).slice(0, 40),
    ...(reason ? { reason: String(reason).slice(0, 80) } : {}),
  };
  pushAnalyticsEvent('promo_code', params);
  reachGoal(`promo_${outcome}`, params);
}

// Нажали «Оплатить» (форма прошла клиентскую валидацию, уходит запрос на создание платежа).
export function trackCheckoutSubmit(cartItems, { promoApplied = false } = {}) {
  const params = { ...cartParams(cartItems), promo_applied: yesNo(promoApplied) };
  pushAnalyticsEvent('checkout_submit', params);
  reachGoal('checkout_submit', params);
}

// Платёж создан, уходим на платёжную страницу.
export function trackAddPaymentInfo(cartItems, paymentType, { promoApplied = false } = {}) {
  pushEcommerceEvent(
    'add_payment_info',
    {
      currency: CURRENCY,
      value: cartValue(cartItems),
      payment_type: paymentType,
      items: buildCartItems(cartItems),
    },
    { payment_type: paymentType }
  );
  reachGoal('payment_created', {
    ...cartParams(cartItems),
    payment_type: paymentType,
    promo_applied: yesNo(promoApplied),
  });
}

export function trackPaymentFailed(paymentType, errorCode) {
  const params = {
    payment_type: paymentType,
    ...(errorCode != null ? { error_code: String(errorCode) } : {}),
  };
  pushAnalyticsEvent('payment_failed', params);
  reachGoal('payment_failed', params);
}

export function trackPaymentCancelled(paymentType) {
  pushAnalyticsEvent('payment_cancelled', { payment_type: paymentType });
  reachGoal('payment_cancelled', { payment_type: paymentType });
}

// Ушёл с чекаута, не дойдя до платёжной страницы: закрыл вкладку, вернулся
// в корзину, перешёл на другую страницу. filled/missing — какие обязательные
// поля были заполнены (валидно) и каких не хватало: name, phone, email, pvz, terms.
export function trackCheckoutAbandon({ filled = [], missing = [], seconds = 0, pvzSearched = false, cartItems = [] } = {}) {
  const params = {
    ...cartParams(cartItems),
    filled: filled.join(',') || 'none',
    missing: missing.join(',') || 'none',
    filled_count: filled.length,
    seconds: Math.round(seconds),
    pvz_searched: yesNo(pvzSearched),
  };
  pushAnalyticsEvent('checkout_abandon', params);
  reachGoal('checkout_abandon', params);
}

// Возврат с платёжной страницы на /shop/success. status: success | fail.
export function trackPaymentReturn(status, orderId) {
  const params = { status, ...(orderId ? { order_id: String(orderId) } : {}) };
  pushAnalyticsEvent('payment_return', params);
  reachGoal(`payment_return_${status}`, params);
}

// ---------------------------------------------------------------------------
// Покупка
// ---------------------------------------------------------------------------

// order: { id, value, items: [{id, price, quantity}] }.
// Возвращает true, если событие отправлено (false — уже отправляли этот заказ).
export function trackPurchase(order) {
  if (!isBrowser() || !order?.id) return false;

  const storageKey = `${PURCHASE_SENT_PREFIX}${order.id}`;
  try {
    if (localStorage.getItem(storageKey)) return false;
  } catch {
    /* localStorage недоступен — защищаемся только в рамках текущей загрузки */
  }

  const items = order.items ?? [];
  pushEcommerceEvent('purchase', {
    transaction_id: String(order.id),
    currency: CURRENCY,
    value: toPrice(order.value),
    items: items.map((item) => buildItem(item, { quantity: Number(item.quantity) || 1 })),
  });
  // Ecommerce-покупку Метрика берёт из dataLayer; JS-цель добавляет к ней
  // магазин, состав и браузер — для воронки по витринам.
  reachGoal('purchase', {
    ...cartParams(items),
    order_id: String(order.id),
    value: toPrice(order.value),
  });

  try {
    localStorage.setItem(storageKey, '1');
  } catch {
    /* см. выше */
  }
  return true;
}

// ---------------------------------------------------------------------------
// Снапшот заказа для атрибуции purchase.
//
// Оплата идёт через редирект на платёжную страницу Т-Банка, и на /shop/success
// состава заказа с сервера нет (только ?order=<номер>). Поэтому перед
// редиректом сохраняем состав корзины, а на странице успеха читаем его.
// localStorage (а не sessionStorage), чтобы пережить возврат в новой вкладке.
// ---------------------------------------------------------------------------

export function saveCheckoutSnapshot(cartItems, value = cartValue(cartItems)) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(
      CHECKOUT_SNAPSHOT_KEY,
      JSON.stringify({
        value: toPrice(value),
        items: cartItems.map((i) => ({
          id: String(i.id),
          name: i.variantLabel ? `${i.name ?? ''} ${i.variantLabel}` : (i.name ?? ''),
          price: toPrice(i.price),
          quantity: Number(i.quantity) || 1,
        })),
        // Запасной стабильный transaction_id на случай, если платёжка вернёт
        // пользователя без ?order= в URL.
        fallbackId: `web-${Date.now()}`,
      })
    );
  } catch {
    /* без снапшота purchase просто не отправится */
  }
}

export function readCheckoutSnapshot() {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(CHECKOUT_SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearCheckoutSnapshot() {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(CHECKOUT_SNAPSHOT_KEY);
  } catch {
    /* ничего страшного */
  }
}
