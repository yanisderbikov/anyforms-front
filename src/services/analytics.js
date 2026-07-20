// Единый аналитический модуль маркетплейса.
//
// Все события уходят в window.dataLayer (его читают GTM → GA4 и Яндекс.Метрика,
// у которой в index.html включён ecommerce:"dataLayer"). Компоненты вызывают
// только track*-функции отсюда и не пишут в dataLayer напрямую.
//
// GTM подключается динамически и только при наличии VITE_GTM_ID — без него
// события просто копятся в dataLayer и приложение работает как раньше.

const YM_COUNTER_ID = 106593235;

// Боевой контейнер GTM захардкожен: ID публичный, настраивать env на CI не нужно.
// В dev-сборке GTM по умолчанию выключен, чтобы локальные клики не летели в
// боевую статистику; для отладки укажите тестовый контейнер в VITE_GTM_ID
// (.env.dev / .env.development).
const PROD_GTM_ID = 'GTM-MBTTRF2N';
const GTM_ID = import.meta.env.VITE_GTM_ID || (import.meta.env.PROD ? PROD_GTM_ID : '');
const CURRENCY = 'RUB';

// Метка окружения уходит с каждым событием: даже если тестовый и боевой
// контейнеры GTM когда-нибудь укажут на одну GA4 property, события можно
// разделить фильтром по environment. Переопределяется через VITE_ANALYTICS_ENV.
const ANALYTICS_ENV =
  import.meta.env.VITE_ANALYTICS_ENV || (import.meta.env.PROD ? 'production' : 'development');

const CHECKOUT_SNAPSHOT_KEY = 'anyforms_checkout_snapshot';
const PURCHASE_SENT_PREFIX = 'ga4_purchase_sent_';

const isBrowser = () => typeof window !== 'undefined';

const callYm = (...args) => {
  if (!isBrowser() || typeof window.ym !== 'function') return;
  window.ym(YM_COUNTER_ID, ...args);
};

// Цена может прийти строкой рублей ("1 190", "1190,50") — приводим к числу.
const toPrice = (value) => {
  if (typeof value === 'number') return value;
  const cleaned = String(value ?? '').replace(/[^\d.,]/g, '').replace(',', '.');
  return Number(cleaned) || 0;
};

export function initAnalytics() {
  if (!isBrowser() || !GTM_ID) return;
  if (document.getElementById('gtm-loader')) return;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

  const script = document.createElement('script');
  script.id = 'gtm-loader';
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`;
  document.head.appendChild(script);
}

export function pushAnalyticsEvent(event, payload = {}) {
  if (!isBrowser()) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, environment: ANALYTICS_ENV, ...payload });
  if (import.meta.env.DEV) {
    console.debug('[analytics]', event, payload);
  }
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
// корзины из CartContext ({id, price, quantity}).
function buildItem(product, { quantity, index, listName } = {}) {
  const item = { item_id: String(product.id) };
  if (product.name) item.item_name = String(product.name);
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
}

// ---------------------------------------------------------------------------
// Страница товара
// ---------------------------------------------------------------------------

export function trackViewItem(product) {
  if (!product) return;

  // Существующая цель Метрики — счётчик открытий карточки товара.
  callYm('reachGoal', 'product_open', {
    product_id: String(product.id),
    product_name: product.name,
  });

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
}

export function trackViewCart(cartItems) {
  const items = buildCartItems(cartItems);
  pushEcommerceEvent('view_cart', {
    currency: CURRENCY,
    value: cartValue(cartItems),
    items,
  });
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

export function trackBeginCheckout(cartItems) {
  pushEcommerceEvent('begin_checkout', {
    currency: CURRENCY,
    value: cartValue(cartItems),
    items: buildCartItems(cartItems),
  });
}

export function trackAddPaymentInfo(cartItems, paymentType) {
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
}

export function trackPaymentFailed(paymentType, errorCode) {
  pushAnalyticsEvent('payment_failed', {
    payment_type: paymentType,
    ...(errorCode != null ? { error_code: String(errorCode) } : {}),
  });
}

export function trackPaymentCancelled(paymentType) {
  pushAnalyticsEvent('payment_cancelled', { payment_type: paymentType });
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

  pushEcommerceEvent('purchase', {
    transaction_id: String(order.id),
    currency: CURRENCY,
    value: toPrice(order.value),
    items: (order.items ?? []).map((item) =>
      buildItem(item, { quantity: Number(item.quantity) || 1 })
    ),
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

export function saveCheckoutSnapshot(cartItems) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(
      CHECKOUT_SNAPSHOT_KEY,
      JSON.stringify({
        value: cartValue(cartItems),
        items: cartItems.map((i) => ({
          id: String(i.id),
          name: i.name ?? '',
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
