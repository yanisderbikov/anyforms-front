import { useSyncExternalStore } from 'react';

export const PREVIEW_DRAFT = 'anyforms-shop-preview:draft';
export const PREVIEW_READY = 'anyforms-shop-preview:ready';
export const PREVIEW_EDIT = 'anyforms-shop-preview:edit';
export const PREVIEW_FOCUS = 'anyforms-shop-preview:focus';

export const PREVIEW_NEW_SLUG = 'new-shop-preview';

const inFrame = typeof window !== 'undefined' && window.parent !== window;

export const isShopPreview =
  inFrame && new URLSearchParams(window.location.search).get('preview') === '1';

let draft = null;
const listeners = new Set();

const notifyParent = (message) => {
  if (isShopPreview) window.parent.postMessage(message, window.location.origin);
};

if (isShopPreview) {
  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin || event.source !== window.parent) return;
    if (event.data?.type !== PREVIEW_DRAFT) return;
    draft = event.data.shop ?? null;
    listeners.forEach((listener) => listener());
  });
  notifyParent({ type: PREVIEW_READY });
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getDraft = () => draft;

export function useShopPreviewDraft() {
  return useSyncExternalStore(subscribe, getDraft, () => null);
}

export const sendPreviewEdit = (field, value) => notifyParent({ type: PREVIEW_EDIT, field, value });

export const sendPreviewFocus = (field) => notifyParent({ type: PREVIEW_FOCUS, field });
