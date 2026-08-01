import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'anyforms_cart';
// Витрина, с которой набрана корзина: с неё же уходит заказ (и ей засчитывается продажа).
const SHOP_STORAGE_KEY = 'anyforms_cart_shop';
export const DEFAULT_SHOP_SLUG = 'anyforms';
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

const readShopStorage = () => {
  try {
    return localStorage.getItem(SHOP_STORAGE_KEY) || DEFAULT_SHOP_SLUG;
  } catch {
    return DEFAULT_SHOP_SLUG;
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

// Вариант товара (размер/объём) — отдельная позиция корзины со своей ценой.
const toCartItem = (product, quantity, variant = null) => ({
  id: String(product.id),
  variantId: variant?.id ?? null,
  variantLabel: variant?.label ?? null,
  name: product.name ?? '',
  description: product.description ?? '',
  price: parsePrice(variant ? variant.price : product.price),
  photo: product.photos?.[0] ?? null,
  preorder: Boolean(product.preorder),
  quantity,
});

// Ключ позиции: товар + вариант (один товар в разных размерах — разные строки корзины).
const sameLine = (item, id, variantId = null) =>
  item.id === String(id) && (item.variantId ?? null) === (variantId ?? null);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(readStorage);
  const [shopSlug, setShopSlug] = useState(readShopStorage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* localStorage недоступен — молча пропускаем */
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(SHOP_STORAGE_KEY, shopSlug);
    } catch {
      /* localStorage недоступен — молча пропускаем */
    }
  }, [shopSlug]);

  /**
   * Добавить товар в корзину с витрины shop. Заказ = одна витрина: если в корзине уже
   * есть товары с другой витрины, добавление не выполняется и возвращается false —
   * вызывающий код спрашивает пользователя и при согласии вызывает replaceCartShop.
   */
  const add = useCallback((product, quantity = 1, shop = DEFAULT_SHOP_SLUG, variant = null) => {
    if (!isPurchasable(product)) return false;
    const targetShop = shop || DEFAULT_SHOP_SLUG;
    if (items.length > 0 && shopSlug !== targetShop) return false;
    if (items.length === 0) setShopSlug(targetShop);
    setItems((prev) => {
      const existing = prev.find((i) => sameLine(i, product.id, variant?.id));
      if (existing) {
        return prev.map((i) => (sameLine(i, product.id, variant?.id) ? { ...i, quantity: i.quantity + quantity } : i));
      }
      return [...prev, toCartItem(product, quantity, variant)];
    });
    return true;
  }, [items, shopSlug]);

  const setQty = useCallback((id, quantity, variantId = null) => {
    setItems((prev) => {
      const q = Math.max(0, Math.floor(Number(quantity) || 0));
      if (q === 0) return prev.filter((i) => !sameLine(i, id, variantId));
      return prev.map((i) => (sameLine(i, id, variantId) ? { ...i, quantity: q } : i));
    });
  }, []);

  const remove = useCallback((id, variantId = null) => {
    setItems((prev) => prev.filter((i) => !sameLine(i, id, variantId)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  /**
   * Переключить корзину на другую витрину: старые товары удаляются (заказ = одна витрина).
   * Если передан товар, он сразу кладётся в новую корзину.
   */
  const replaceCartShop = useCallback((shop, product = null, quantity = 1, variant = null) => {
    setShopSlug(shop || DEFAULT_SHOP_SLUG);
    setItems(isPurchasable(product) ? [toCartItem(product, quantity, variant)] : []);
  }, []);

  const count = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const total = useMemo(() => items.reduce((sum, i) => sum + i.price * i.quantity, 0), [items]);

  const value = useMemo(
    () => ({ items, add, setQty, remove, clear, count, total, shopSlug, replaceCartShop }),
    [items, add, setQty, remove, clear, count, total, shopSlug, replaceCartShop]
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
