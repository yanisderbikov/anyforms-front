const STATE_KEY = 'anyforms_promo_popup';
const ELAPSED_KEY = 'anyforms_promo_popup_elapsed';
const SESSION_SHOWN_KEY = 'anyforms_promo_popup_shown';
const HOUR_MS = 60 * 60 * 1000;

const browserStorage = (name) => {
  try {
    return typeof window === 'undefined' ? null : window[name];
  } catch {
    return null;
  }
};

const readJson = (storage, key) => {
  try {
    const raw = storage?.getItem(key);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const writeJson = (storage, key, value) => {
  try {
    storage?.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
};

const defaults = (options = {}) => ({
  local: options.local ?? browserStorage('localStorage'),
  session: options.session ?? browserStorage('sessionStorage'),
  now: options.now ?? Date.now(),
});

export const readPopupState = (id, options) => readJson(defaults(options).local, STATE_KEY)[id] || {};

export const writePopupState = (id, patch, options) => {
  const { local } = defaults(options);
  const all = readJson(local, STATE_KEY);
  writeJson(local, STATE_KEY, { ...all, [id]: { ...all[id], ...patch } });
};

export const isPopupSuppressed = (popup, options = {}) => {
  const { local, session, now } = defaults(options);
  const state = readPopupState(popup.id, { local });
  if (state.claimedAt || state.takenAt) return true;
  if (popup.popupType === 'PUBLIC_CODE' && popup.code && options.savedPromoCode === popup.code) return true;
  if (readJson(session, SESSION_SHOWN_KEY)[popup.id]) return true;
  if (popup.maxShows && (state.shows || 0) >= popup.maxShows) return true;
  const hours = popup.repeatAfterHours ?? 24;
  return Boolean(state.lastShownAt && hours > 0 && now - state.lastShownAt < hours * HOUR_MS);
};

export const recordPopupShown = (popup, options) => {
  const { local, session, now } = defaults(options);
  const state = readPopupState(popup.id, { local });
  writePopupState(popup.id, { shows: (state.shows || 0) + 1, lastShownAt: now }, { local });
  writeJson(session, SESSION_SHOWN_KEY, { ...readJson(session, SESSION_SHOWN_KEY), [popup.id]: true });
};

export const readElapsed = (id, options) => Number(readJson(defaults(options).session, ELAPSED_KEY)[id]) || 0;

export const writeElapsed = (id, ms, options) => {
  const { session } = defaults(options);
  writeJson(session, ELAPSED_KEY, { ...readJson(session, ELAPSED_KEY), [id]: ms });
};
