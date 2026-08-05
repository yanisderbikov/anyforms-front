import apiClient from "../apiClient";

const MOCK_ITEMS = [
  {
    id: 'heart',
    name: 'Сердечко',
    description: 'Мягкое сердце ручной работы — идеальный подарок для близких.',
    photos: [
      'https://storage.yandexcloud.net/anyforms/shop/heart/1.jpeg',
      'https://storage.yandexcloud.net/anyforms/shop/heart/2.jpeg',
      'https://storage.yandexcloud.net/anyforms/shop/heart/3.jpeg',
      'https://storage.yandexcloud.net/anyforms/shop/heart/4.jpeg',
      'https://storage.yandexcloud.net/anyforms/shop/heart/5.jpeg',
      'https://storage.yandexcloud.net/anyforms/shop/heart/6.jpeg',
      'https://storage.yandexcloud.net/anyforms/shop/heart/7.jpeg',
    ],
    price: 890,
    crossedPrice: 1190,
    discountPercent: 26,
    tgLink: 'https://t.me/anyforms_shop/161',
  },
  {
    id: 'pillow',
    name: 'Подушка',
    description: 'Уютная декоративная подушка для интерьера.',
    photos: [
      'https://storage.yandexcloud.net/anyforms/shop/pillow/1.jpeg',
      'https://storage.yandexcloud.net/anyforms/shop/pillow/2.jpeg',
    ],
    price: 1190,
    tgLink: 'https://t.me/anyforms_shop/124',
  },
  {
    id: 'xmastree',
    name: 'Новогодняя ёлка',
    description: 'Мини-ёлка для праздничного настроения.',
    photos: [
      'https://storage.yandexcloud.net/anyforms/shop/xmastree/1.jpeg',
      'https://storage.yandexcloud.net/anyforms/shop/xmastree/2.jpeg',
      'https://storage.yandexcloud.net/anyforms/shop/xmastree/3.jpeg',
    ],
    price: 1250,
    tgLink: 'https://t.me/anyforms_shop/116',
  },
  {
    id: 'pepper',
    name: 'Перец',
    description: 'Перец для десертов.',
    photos: [
      'https://storage.yandexcloud.net/anyforms/shop/pepper/1.jpeg',
      'https://storage.yandexcloud.net/anyforms/shop/pepper/2.jpeg',
      'https://storage.yandexcloud.net/anyforms/shop/pepper/3.jpeg',
      'https://storage.yandexcloud.net/anyforms/shop/pepper/4.jpeg',
    ],
    price: 1490,
    tgLink: 'https://t.me/anyforms_shop/68',
  },
];

function mapProductToItem(product) {
  const firstVariant = product.variants?.[0];
  const price = firstVariant?.price ?? 0;
  const photos = product.mainImageUrl ? [product.mainImageUrl] : [];
  return {
    id: String(product.id ?? ''),
    name: product.name ?? '',
    description: product.description ?? '',
    photos,
    price,
    crossedPrice: null,
    discountPercent: 0,
    tgLink: 'https://t.me/anyforms',
  };
}

/**
 * Получить товары витрины. Без shopSlug — витрина anyforms (/shop),
 * со slug — товары, продающиеся в этом магазине (/shop/{slug}).
 * Товар может продаваться в нескольких магазинах сразу (поле shops) и иметь
 * варианты (размер/объём) со своими ценами (поле variants).
 * При ошибке возвращает мок-данные.
 * @param {string} [shopSlug]
 * @returns {Promise<Array<{id: string, name: string, description: string, photos: string[], price: number, crossedPrice: number|null, discountPercent: number, tgLink: string, shops: Array<{slug: string, name: string}>, variants: Array<{id: string, label: string, price: string}>}>>}
 */
export async function getItems(shopSlug) {
  try {
    const res = await apiClient.instance.get('/api/product', {
      params: shopSlug ? { shop: shopSlug } : undefined,
    });
    return Array.isArray(res.data) ? res.data : [];
  } catch (err) {
    console.error('getItems:', err);
    return MOCK_ITEMS;
  }
}

/**
 * Магазины витрины: anyforms и партнёрские (у каждого своя страница /shop/{slug}).
 * @returns {Promise<Array<{id: string, slug: string, name: string, active: boolean, supportTelegram: string}>>}
 */
export async function getShops() {
  const res = await apiClient.instance.get('/api/shop');
  return Array.isArray(res.data) ? res.data : [];
}
