export const COLOR_FIELDS = ['headerColor', 'accentColor', 'backgroundColor'];

export const BRANDING_FIELDS = [
  'tagline',
  'description',
  'logoUrl',
  'logoMarkUrl',
  'faviconUrl',
  'heroImageUrl',
  'heroImageAlt',
  'heroVideoUrl',
  ...COLOR_FIELDS,
];

export const emptyShopForm = {
  slug: '',
  name: '',
  supportTelegram: '',
  amoContactValue: '',
  ...Object.fromEntries(BRANDING_FIELDS.map((f) => [f, ''])),
};

export const shopPayload = (src) => ({
  name: src.name.trim(),
  supportTelegram: src.supportTelegram?.trim() || null,
  amoContactValue: src.amoContactValue?.trim() || null,
  ...Object.fromEntries(BRANDING_FIELDS.map((f) => [f, src[f]?.trim() || null])),
});

export const formFromShop = (shop) => ({
  slug: shop.slug,
  name: shop.name || '',
  supportTelegram: shop.supportTelegram || '',
  amoContactValue: shop.amoContactValue || '',
  ...Object.fromEntries(BRANDING_FIELDS.map((f) => [f, shop[f] || ''])),
});

export const apiError = (err, fallback) => err?.response?.data?.message || err?.message || fallback;
