const UTM_STORAGE_KEY = 'anyforms_utm';

const UTM_PARAM_TO_FIELD = {
  utm_source: 'utmSource',
  utm_medium: 'utmMedium',
  utm_campaign: 'utmCampaign',
  utm_term: 'utmTerm',
  utm_content: 'utmContent',
};

/**
 * Сохраняет UTM-метки из текущего URL в sessionStorage, чтобы они пережили
 * навигацию по SPA до момента отправки формы. Вызывать на маунте лендинга.
 */
export function rememberUtmParams() {
  if (typeof window === 'undefined') return;
  try {
    const params = new URLSearchParams(window.location.search);
    const utm = {};
    Object.entries(UTM_PARAM_TO_FIELD).forEach(([param, field]) => {
      const value = params.get(param);
      if (value) utm[field] = value;
    });
    if (Object.keys(utm).length > 0) {
      if (document.referrer) utm.utmReferrer = document.referrer;
      window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(utm));
    }
  } catch {
    // sessionStorage может быть недоступен (приватный режим) — метки просто не сохранятся
  }
}

/**
 * Возвращает UTM-метки для отправки вместе с заявкой: из текущего URL,
 * а если там пусто — сохранённые ранее в sessionStorage.
 */
export function getUtmParams() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const utm = {};
  Object.entries(UTM_PARAM_TO_FIELD).forEach(([param, field]) => {
    const value = params.get(param);
    if (value) utm[field] = value;
  });
  if (Object.keys(utm).length > 0) {
    if (document.referrer) utm.utmReferrer = document.referrer;
    return utm;
  }
  try {
    const stored = window.sessionStorage.getItem(UTM_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}
