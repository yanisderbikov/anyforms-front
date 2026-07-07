// Утилиты валидации/форматирования для чекаута (общие для лендингов и маркетплейса).

// Простой, но строгий формат email.
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Приводим ввод к российскому номеру (11 цифр, начинается с 7).
export const normalizePhoneDigits = (value) => {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  if (digits && !digits.startsWith('7')) digits = `7${digits}`;
  return digits.slice(0, 11);
};

// Форматируем как +7 (999) 123-45-67, не оставляя «висящих» разделителей в конце.
export const formatRuPhone = (value) => {
  const digits = normalizePhoneDigits(value);
  if (!digits) return '';
  const rest = digits.slice(1); // 10 цифр после кода страны
  let out = '+7';
  if (rest.length > 0) out += ` (${rest.slice(0, 3)}`;
  if (rest.length >= 3) out += `) ${rest.slice(3, 6)}`;
  if (rest.length >= 6) out += `-${rest.slice(6, 8)}`;
  if (rest.length >= 8) out += `-${rest.slice(8, 10)}`;
  return out.replace(/[\s()-]+$/, '');
};

export const isPhoneValid = (value) => normalizePhoneDigits(value).length === 11;

// Телефон в формате +7XXXXXXXXXX для отправки на бэкенд.
export const toE164 = (value) => {
  const digits = normalizePhoneDigits(value);
  return digits ? `+${digits}` : '';
};
