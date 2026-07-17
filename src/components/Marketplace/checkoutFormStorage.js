// Черновик формы чекаута маркетплейса: переживает уход со страницы и оплату,
// чтобы покупателю не пришлось вводить контакты и ПВЗ заново.
const CHECKOUT_FORM_KEY = 'anyforms_checkout_form';

export function readCheckoutForm() {
  try {
    const raw = localStorage.getItem(CHECKOUT_FORM_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function saveCheckoutForm(form) {
  try {
    localStorage.setItem(CHECKOUT_FORM_KEY, JSON.stringify(form));
  } catch {
    /* localStorage недоступен (приватный режим) — просто не сохраняем */
  }
}

// После успешной оплаты контакты оставляем, а промокод затираем:
// он одноразовый на клиента, повторное применение всё равно отклонит бек.
export function clearCheckoutFormPromo() {
  const form = readCheckoutForm();
  if (!form) return;
  const { promoInput, appliedPromo, ...rest } = form;
  saveCheckoutForm(rest);
}
