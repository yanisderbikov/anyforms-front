// Фича-флаги фронтенда.

// Онлайн-оплата корзины маркетплейса включена только пока в текущем URL есть
// ?tbpayment=true. Без параметра кнопка ведёт на заказ через Telegram-бота.
export const TB_PAYMENT_PARAM = 'tbpayment';

export const isMarketplaceCheckoutEnabled = (search) => {
  try {
    return new URLSearchParams(search).get(TB_PAYMENT_PARAM) === 'true';
  } catch {
    return false;
  }
};

// Куда ведём заказ, пока чекаут выключен.
export const MARKETPLACE_ORDER_TG_LINK = 'https://t.me/AnyFormsBot';
