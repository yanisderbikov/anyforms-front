// Фича-флаги фронтенда.

export const TB_PAYMENT_PARAM = 'tbpayment';

let tbPaymentActive = true;

export const syncTbPaymentFlag = (search) => {
  try {
    const value = new URLSearchParams(search).get(TB_PAYMENT_PARAM);
    if (value === 'true') tbPaymentActive = true;
    if (value === 'false') tbPaymentActive = false;
  } catch {
    // некорректный search игнорируем, состояние не меняем
  }
  return tbPaymentActive;
};

export const isMarketplaceCheckoutEnabled = (search) => syncTbPaymentFlag(search);

// Куда ведём заказ, пока чекаут выключен.
export const MARKETPLACE_ORDER_TG_LINK = 'https://t.me/AnyFormsBot';
