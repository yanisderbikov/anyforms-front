// Общие контактные данные чекаутов (магазин, гайд, курс): заполнил в одном —
// подставятся во всех остальных. Хранятся отдельным ключом localStorage,
// специфика конкретного чекаута (ПВЗ, промокод, чекбоксы) сюда не попадает.
const CONTACT_KEY = 'anyforms_checkout_contact';

// Черновик чекаута магазина: до появления общего ключа контакты жили в нём,
// читаем его как запасной источник для старых покупателей.
const LEGACY_MARKETPLACE_FORM_KEY = 'anyforms_checkout_form';

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function readCheckoutContact() {
  const contact = readJson(CONTACT_KEY);
  if (contact) return contact;

  const legacyForm = readJson(LEGACY_MARKETPLACE_FORM_KEY);
  if (!legacyForm) return null;
  const { fullName = '', phone = '', email = '' } = legacyForm;
  if (!fullName && !phone && !email) return null;
  return { fullName, phone, email };
}

export function saveCheckoutContact({ fullName = '', phone = '', email = '' }) {
  try {
    localStorage.setItem(CONTACT_KEY, JSON.stringify({ fullName, phone, email }));
  } catch {
    /* localStorage недоступен (приватный режим) — просто не сохраняем */
  }
}
