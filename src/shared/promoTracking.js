// Промокод и UTM-метки живут в URL: лендинг читает их из своей ссылки и
// пробрасывает дальше на чекаут query-параметрами. Никаких хранилищ.

// Символы cp1252 из диапазона байтов 0x80–0x9F: при mojibake (UTF-8 прочитан
// как Windows-1252) они всплывают в строке вместо «сырых» байтов продолжения.
const CP1252_BYTE_BY_CHAR = {
  '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84,
  '…': 0x85, '†': 0x86, '‡': 0x87, 'ˆ': 0x88,
  '‰': 0x89, 'Š': 0x8a, '‹': 0x8b, 'Œ': 0x8c,
  'Ž': 0x8e, '‘': 0x91, '’': 0x92, '“': 0x93,
  '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97,
  '˜': 0x98, '™': 0x99, 'š': 0x9a, '›': 0x9b,
  'œ': 0x9c, 'ž': 0x9e, 'Ÿ': 0x9f,
};

// Признак mojibake: Â Ã Ð Ñ — так выглядят lead-байты UTF-8 (C2/C3/D0/D1),
// прочитанные как Latin-1/cp1252.
const MOJIBAKE_HINT = /[ÂÃÐÑ]/;

// Пытается прочитать строку как «байты, ошибочно показанные в Latin-1/cp1252»
// и декодировать их обратно как UTF-8. null — строка не похожа на mojibake.
const tryRepairMojibake = (value) => {
  const bytes = [];
  for (const ch of value) {
    const code = ch.codePointAt(0);
    if (code <= 0xff) {
      bytes.push(code);
    } else if (CP1252_BYTE_BY_CHAR[ch] !== undefined) {
      bytes.push(CP1252_BYTE_BY_CHAR[ch]);
    } else {
      return null;
    }
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bytes));
  } catch {
    return null;
  }
};

// Чинит промокод после любой «фигни» по дороге: зеро-виды/NBSP, mojibake
// (в т.ч. двойной), юникод-нормализация, затем trim + верхний регистр.
export const normalizePromoCode = (raw) => {
  if (!raw) return '';
  let value = String(raw)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ');
  for (let i = 0; i < 3 && MOJIBAKE_HINT.test(value); i += 1) {
    const repaired = tryRepairMojibake(value);
    if (!repaired || repaired === value) break;
    value = repaired;
  }
  return value.normalize('NFC').trim().toUpperCase();
};

export const getPromoFromSearch = (search) => {
  const promo = new URLSearchParams(search).get('promo');
  return promo ? normalizePromoCode(promo) : '';
};

// Query-строка для перехода дальше по сайту: сохраняет promo/utm из текущего
// URL и добавляет свои параметры (например, plan). Возвращает строку вида
// "?plan=self&promo=ГАЙД" или пустую строку, если параметров нет.
export const buildPassThroughQuery = (search, extra = {}) => {
  const current = new URLSearchParams(search);
  const next = new URLSearchParams();
  Object.entries(extra).forEach(([key, value]) => {
    if (value) next.set(key, value);
  });
  const promo = getPromoFromSearch(search);
  if (promo) next.set('promo', promo);
  ['utm_source', 'utm_medium'].forEach((key) => {
    const value = current.get(key);
    if (value && value.trim()) next.set(key, value.trim());
  });
  const qs = next.toString();
  return qs ? `?${qs}` : '';
};

// «30 июля» — последний день действия кода. validUntil с бэка — исключительная
// граница (первый момент, когда код уже не работает), поэтому минус миллисекунда.
export const formatPromoDeadline = (validUntil) => {
  if (!validUntil) return null;
  // Бэк отдаёт ISO-строку; число на всякий случай трактуем как секунды эпохи.
  const source = typeof validUntil === 'number' ? validUntil * 1000 : validUntil;
  const lastDay = new Date(new Date(source).getTime() - 1);
  if (Number.isNaN(lastDay.getTime())) return null;
  return lastDay.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
};
