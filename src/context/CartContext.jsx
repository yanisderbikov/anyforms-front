import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'anyforms_cart';
const CartContext = createContext(null);

const readStorage = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// Товар считаем «реальным» (можно оформить и оплатить), только если у него UUID-идентификатор
// из каталога бэкенда. Мок-данные (id вроде 'heart') оплатить нельзя — их в корзину не кладём.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isPurchasable = (item) => Boolean(item && UUID_RE.test(String(item.id)));

// Цена в каталоге — строка рублей ("890", "1 190", "1190,50"). Приводим к числу.
const parsePrice = (value) => {
  if (typeof value === 'number') return value;
  const cleaned = String(value ?? '').replace(/[^\d.,]/g, '').replace(',', '.');
  return Number(cleaned) || 0;
};

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(readStorage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* localStorage недоступен — молча пропускаем */
    }
  }, [items]);

  const add = useCallback((product, quantity = 1) => {
    if (!isPurchasable(product)) return;
    setItems((prev) => {
      const id = String(product.id);
      const existing = prev.find((i) => i.id === id);
      if (existing) {
        return prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [
        ...prev,
        {
          id,
          name: product.name ?? '',
          description: product.description ?? '',
          price: parsePrice(product.price),
          photo: product.photos?.[0] ?? null,
          quantity,
        },
      ];
    });
  }, []);

  const setQty = useCallback((id, quantity) => {
    setItems((prev) => {
      const q = Math.max(0, Math.floor(Number(quantity) || 0));
      if (q === 0) return prev.filter((i) => i.id !== String(id));
      return prev.map((i) => (i.id === String(id) ? { ...i, quantity: q } : i));
    });
  }, []);

  const remove = useCallback((id) => {
    setItems((prev) => prev.filter((i) => i.id !== String(id)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const total = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);

  const value = useMemo(
    () => ({ items, add, setQty, remove, clear, count, total }),
    [items, add, setQty, remove, clear, count, total]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart должен использоваться внутри <CartProvider>');
  }
  return ctx;
};
