import { useEffect, useMemo, useState } from 'react';
import { loadShops } from '../../hooks/useShopSupport';
import { useShopPreviewDraft } from './shopPreview';
import styles from './shopThemes.module.css';

/**
 * Оформление партнёрских витрин /shop/{slug}: только палитра и типографика.
 * Контент витрины (заголовок, описание, логотип, фото/видео) — настройки
 * магазина в админке, приходят из /api/shop. Магазин без темы получает
 * стандартный вид anyforms.
 *
 * className — класс с CSS-переменными темы (вешается на корень страницы);
 * pageBackground — фон body (App.jsx), тот же цвет, что --shop-page-bg.
 */
export const SHOP_THEMES = {
  di_gips: {
    className: styles.diGips,
    pageBackground: '#faf3e6',
  },
  lunasvecha: {
    className: styles.lunasvecha,
    pageBackground: '#f4f1ea',
  },
  af_pastry: {
    className: styles.afPastry,
    pageBackground: '#f4eee3',
  },
};

export const DEFAULT_SHOP_COLORS = {
  headerColor: '#1f1f1f',
  accentColor: '#1f1f1f',
  backgroundColor: '#f5f3ef',
};

const HEX = /^#[0-9a-f]{6}$/i;

const toRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

const toHex = (rgb) => `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;

const mix = (a, b, weightOfB) => {
  const ra = toRgb(a);
  const rb = toRgb(b);
  return toHex(ra.map((c, i) => c + (rb[i] - c) * weightOfB));
};

const alpha = (hex, value) => `rgba(${toRgb(hex).join(', ')}, ${value})`;

const luminance = (hex) => {
  const [r, g, b] = toRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const readableOn = (color, light) => {
  const dark = mix(color, '#000000', 0.72);
  return contrast(color, light) >= contrast(color, dark) ? light : dark;
};

export const hasShopColors = (shop) =>
  Boolean(shop && [shop.headerColor, shop.accentColor, shop.backgroundColor].some((c) => HEX.test(c || '')));

export function buildColorTheme(shop) {
  if (!hasShopColors(shop)) return null;
  const pick = (field) => (HEX.test(shop[field] || '') ? shop[field] : DEFAULT_SHOP_COLORS[field]);
  const header = pick('headerColor');
  const accent = pick('accentColor');
  const bg = pick('backgroundColor');
  const lightBg = luminance(bg) > 0.4;
  const text = lightBg ? mix('#2b2b2b', accent, 0.25) : mix('#f5f5f5', accent, 0.1);
  const lightInk = lightBg ? bg : '#ffffff';
  const accentFg = readableOn(accent, lightInk);
  const accentHover = luminance(accent) > 0.5 ? mix(accent, '#000000', 0.12) : mix(accent, '#000000', 0.18);
  const style = {
    '--shop-header-bg': header,
    '--shop-header-tint': alpha(header, 0.82),
    '--shop-header-fg': readableOn(header, '#ffffff'),
    '--shop-page-bg': bg,
    '--shop-accent': accent,
    '--shop-accent-hover': accentHover,
    '--shop-btn-hover-fg': accentFg,
    '--shop-badge-bg': accent,
    '--shop-added-bg': accent,
    '--shop-added-bg-hover': accentHover,
    '--shop-note-bg': mix(bg, accent, 0.08),
    '--shop-note-border': mix(bg, accent, 0.25),
    '--shop-note-fg': accent,
    '--shop-note-text': text,
    '--shop-text': text,
    '--shop-photo-bg': mix(bg, text, 0.06),
    '--shop-footer-bg': bg,
    '--shop-footer-border': alpha(accent, 0.2),
    '--shop-footer-heading': alpha(text, 0.72),
    '--shop-footer-text': alpha(text, 0.58),
    '--shop-footer-link': alpha(text, 0.7),
    '--shop-footer-link-border': alpha(text, 0.28),
    '--shop-footer-link-hover': accent,
    '--shop-footer-muted': alpha(text, 0.42),
    '--shop-heading': lightBg ? accent : text,
    '--shop-title-transform': 'none',
    '--shop-cta-bg': accent,
    '--shop-cta-fg': accentFg,
    '--shop-cta-hover-bg': accentHover,
    '--shop-cta-hover-fg': accentFg,
  };
  if (contrast(accent, bg) < 3) style['--shop-page-accent'] = text;
  return { style, pageBackground: bg };
}

export function useShopTheme(shopSlug) {
  const draft = useShopPreviewDraft();
  const [shop, setShop] = useState(null);

  useEffect(() => {
    setShop(null);
    if (!shopSlug) return undefined;
    let cancelled = false;
    loadShops()
      .then((shops) => {
        if (!cancelled) setShop(shops.find((s) => s.slug === shopSlug) ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [shopSlug]);

  const source = draft ?? shop;
  return useMemo(() => {
    if (!shopSlug) return null;
    const codeTheme = SHOP_THEMES[shopSlug] ?? null;
    const colorTheme = buildColorTheme(source);
    if (!codeTheme && !colorTheme) return null;
    return {
      className: codeTheme?.className,
      style: colorTheme?.style,
      pageBackground: colorTheme?.pageBackground ?? codeTheme?.pageBackground,
    };
  }, [shopSlug, source]);
}
