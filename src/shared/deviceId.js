const STORAGE_KEY = 'anyforms_device_id';
const COOKIE_NAME = 'af_device_id';
const COOKIE_MAX_AGE_SECONDS = 400 * 24 * 60 * 60;
const VALID_ID = /^[A-Za-z0-9-]{16,64}$/;

let cachedId = '';

const readStorage = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

const writeStorage = (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    return;
  }
};

const readCookie = () => {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
    return match ? decodeURIComponent(match[1]) : '';
  } catch {
    return '';
  }
};

const writeCookie = (value) => {
  try {
    const secure = window.location.protocol === 'https:' ? '; secure' : '';
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; max-age=${COOKIE_MAX_AGE_SECONDS}; path=/; samesite=lax${secure}`;
  } catch {
    return;
  }
};

const randomId = () => {
  const cryptoApi = typeof crypto !== 'undefined' ? crypto : null;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();
  const bytes = new Uint8Array(16);
  if (cryptoApi?.getRandomValues) cryptoApi.getRandomValues(bytes);
  else bytes.forEach((_, i) => { bytes[i] = Math.floor(Math.random() * 256); });
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const getDeviceId = () => {
  if (typeof window === 'undefined') return '';
  if (cachedId) return cachedId;
  const fromStorage = readStorage();
  const fromCookie = readCookie();
  const id = [fromStorage, fromCookie].find((value) => VALID_ID.test(value)) || randomId();
  if (fromStorage !== id) writeStorage(id);
  if (fromCookie !== id) writeCookie(id);
  cachedId = id;
  return id;
};
