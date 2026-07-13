import { useCallback, useSyncExternalStore } from 'react';

const STORAGE_KEY = 'anyforms_likes';
const listeners = new Set();
let cached = null;

const readRaw = () => {
  if (cached === null) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) ?? '[]';
      cached = Array.isArray(JSON.parse(raw)) ? raw : '[]';
    } catch {
      cached = '[]';
    }
  }
  return cached;
};

const writeRaw = (ids) => {
  cached = JSON.stringify(ids);
  try {
    localStorage.setItem(STORAGE_KEY, cached);
  } catch {
    /* localStorage недоступен — лайки живут в памяти до перезагрузки */
  }
  listeners.forEach((listener) => listener());
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useLikes() {
  const raw = useSyncExternalStore(subscribe, readRaw);
  const ids = JSON.parse(raw);

  const isLiked = useCallback(
    (productId) => productId != null && ids.includes(String(productId)),
    [raw]
  );

  const toggleLike = useCallback((productId) => {
    if (productId == null) return;
    const id = String(productId);
    const current = JSON.parse(readRaw());
    writeRaw(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  }, []);

  return { ids, isLiked, toggleLike, count: ids.length };
}
