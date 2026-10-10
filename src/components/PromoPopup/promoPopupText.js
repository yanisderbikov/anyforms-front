const pluralDays = (n) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня';
  return 'дней';
};

const formatRub = (kopecks) =>
  `${Math.round(kopecks / 100).toLocaleString('ru-RU').replace(/ /g, ' ')} ₽`;

export const discountLabel = ({ discountPercent, discountAmountKopecks } = {}) =>
  [
    discountPercent ? `${discountPercent}%` : null,
    discountAmountKopecks ? formatRub(discountAmountKopecks) : null,
  ]
    .filter(Boolean)
    .join(' + ');

export const daysLabel = (days) => (days ? `${days} ${pluralDays(days)}` : '');

export const minOrderLabel = (kopecks) => (kopecks ? formatRub(kopecks) : '');

export const fillTemplate = (text, popup) =>
  String(text ?? '')
    .replaceAll('{discount}', discountLabel(popup))
    .replaceAll('{days}', daysLabel(popup?.codeTtlDays))
    .replaceAll('{minOrder}', minOrderLabel(popup?.minOrderKopecks))
    .replaceAll('{code}', popup?.code || '')
    .replaceAll('{until}', formatValidUntil(popup?.codeValidUntil));

export const formatValidUntil = (iso) => {
  if (!iso) return '';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  return new Date(t - 1000).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Moscow',
  });
};

export const conditionsLine = (popup) =>
  [
    popup?.firstOrderOnly ? 'на первый заказ' : null,
    popup?.minOrderKopecks ? `от ${minOrderLabel(popup.minOrderKopecks)}` : null,
    popup?.codeTtlDays ? `код действует ${daysLabel(popup.codeTtlDays)}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

export const publicConditionsLine = (popup) =>
  [
    popup?.codeValidUntil ? `действует по ${formatValidUntil(popup.codeValidUntil)} включительно` : null,
    popup?.firstOrderOnly ? 'на первый заказ' : null,
    popup?.minOrderKopecks ? `для заказов от ${minOrderLabel(popup.minOrderKopecks)}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

const pluralShows = (n) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'показа';
  return 'показов';
};

export const frequencyLabel = ({ repeatAfterHours, maxShows } = {}) => {
  const hours = repeatAfterHours ?? 24;
  let repeat;
  if (hours === 0) repeat = 'каждый визит';
  else if (hours === 24) repeat = 'раз в сутки';
  else if (hours % 24 === 0) repeat = `раз в ${daysLabel(hours / 24)}`;
  else repeat = `раз в ${hours} ч`;
  return maxShows ? `${repeat}, до ${maxShows} ${pluralShows(maxShows)}` : repeat;
};
