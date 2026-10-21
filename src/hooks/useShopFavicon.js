import { useEffect } from 'react';
import { loadShops } from './useShopSupport';

const ICON_SELECTOR = 'link[rel="icon"], link[rel="apple-touch-icon"]';

const applyFavicon = (url) => {
  const links = Array.from(document.head.querySelectorAll(ICON_SELECTOR));
  const saved = links.map((link) => ({
    link,
    href: link.getAttribute('href'),
    type: link.getAttribute('type'),
  }));
  links.forEach((link) => {
    link.setAttribute('href', url);
    link.removeAttribute('type');
  });
  return () => {
    saved.forEach(({ link, href, type }) => {
      link.setAttribute('href', href);
      if (type) link.setAttribute('type', type);
    });
  };
};

export function useShopFavicon(shopSlug) {
  useEffect(() => {
    if (!shopSlug) return undefined;
    let cancelled = false;
    let restore = null;
    loadShops()
      .then((shops) => {
        const url = shops.find((s) => s.slug === shopSlug)?.faviconUrl;
        if (!cancelled && url) restore = applyFavicon(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      restore?.();
    };
  }, [shopSlug]);
}
