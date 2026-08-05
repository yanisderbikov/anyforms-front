import { useEffect, useState } from 'react';
import { getShops } from '../services/itemsService';

/** Бот поддержки по умолчанию — anyforms и любые случаи, когда магазин неизвестен. */
export const DEFAULT_SUPPORT_TG = 'AnyFormsBot';

export const tgLink = (handle) => `https://t.me/${handle}`;

// Один запрос списка магазинов на всё приложение; при ошибке — повтор при следующем вызове.
let shopsPromise = null;
const loadShops = () => {
  if (!shopsPromise) {
    shopsPromise = getShops().catch((err) => {
      shopsPromise = null;
      throw err;
    });
  }
  return shopsPromise;
};

/**
 * Телеграм-бот поддержки магазина (username без @ приходит из /api/shop).
 * У партнёрских магазинов свой бот (af_pastry → afPastrySupportBot),
 * без slug или при ошибке загрузки — общий AnyFormsBot.
 * @param {string} [shopSlug]
 * @returns {{handle: string, link: string}}
 */
export function useShopSupport(shopSlug) {
  const [handle, setHandle] = useState(DEFAULT_SUPPORT_TG);

  useEffect(() => {
    if (!shopSlug) {
      setHandle(DEFAULT_SUPPORT_TG);
      return undefined;
    }
    let cancelled = false;
    loadShops()
      .then((shops) => {
        if (cancelled) return;
        const shop = shops.find((s) => s.slug === shopSlug);
        setHandle(shop?.supportTelegram || DEFAULT_SUPPORT_TG);
      })
      .catch(() => {
        if (!cancelled) setHandle(DEFAULT_SUPPORT_TG);
      });
    return () => {
      cancelled = true;
    };
  }, [shopSlug]);

  return { handle, link: tgLink(handle) };
}
