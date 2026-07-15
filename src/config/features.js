// Фича-флаги фронтенда.

// Онлайн-оплата корзины маркетплейса. Включается параметром ?tbpayment=true в URL,
// выключается через ?tbpayment=false или полной перезагрузкой страницы без параметра.
// Пока флаг активен, TbPaymentKeeper в App.jsx удерживает параметр в URL при
// навигации по /shop/*, чтобы он не терялся на переходах между страницами.
export const TB_PAYMENT_PARAM = 'tbpayment';

let tbPaymentActive = false;

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
