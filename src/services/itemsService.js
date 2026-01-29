
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
    crossedPrice: 1200,
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
 * Получить список товаров через api.gen (apiClient.api.getProducts).
 * При ошибке или пустом ответе возвращает мок-данные.
 * @returns {Promise<Array<{id: string, name: string, description: string, photos: string[], price: number, crossedPrice: number|null, discountPercent: number, tgLink: string}>>}
 */
export async function getItems() {
  try {
    return MOCK_ITEMS;
  } catch (err) {
    console.error('getItems:', err);
    return MOCK_ITEMS;
  }
}
