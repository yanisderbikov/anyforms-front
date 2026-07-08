// Промокод и UTM-метки живут в URL: лендинг читает их из своей ссылки и
// пробрасывает дальше на чекаут query-параметрами. Никаких хранилищ.

export const getPromoFromSearch = (search) => {
  const promo = new URLSearchParams(search).get('promo');
  return promo ? promo.trim().toUpperCase() : '';
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
  ['promo', 'utm_source', 'utm_medium'].forEach((key) => {
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
