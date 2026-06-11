// Отправка событий в Яндекс.Метрику.
// Счётчик подключён глобально в index.html, ecommerce включён через dataLayer.
const YM_COUNTER_ID = 106593235;

const callYm = (...args) => {
  if (typeof window === 'undefined' || typeof window.ym !== 'function') return;
  window.ym(YM_COUNTER_ID, ...args);
};

// Фиксируем открытие карточки товара.
// 1) Цель `product_open` — простой счётчик открытий (создаётся в интерфейсе Метрики).
// 2) Ecommerce `detail` — попадает в отчёт «Просмотры товаров» с разбивкой по товарам.
export const trackProductOpen = (item) => {
  if (!item || typeof window === 'undefined') return;

  const productId = String(item.id ?? item.name);

  callYm('reachGoal', 'product_open', {
    product_id: productId,
    product_name: item.name,
  });

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    ecommerce: {
      detail: {
        products: [
          {
            id: productId,
            name: item.name,
            price: item.price,
          },
        ],
      },
    },
  });
};
