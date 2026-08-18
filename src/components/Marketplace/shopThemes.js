import styles from './shopThemes.module.css';

/**
 * Оформление партнёрских витрин /shop/{slug}. Магазин без темы получает
 * стандартный вид anyforms (только бейдж с названием).
 *
 * className — класс с CSS-переменными темы (вешается на корень страницы);
 * pageBackground — фон body (App.jsx), тот же цвет, что --shop-page-bg;
 * tagline — заголовок витрины под шапкой;
 * description — короткое описание под заголовком (показывается только на
 * десктопе, рядом с видео-приветствием);
 * headerLogo — логотип в центре шапки вместо названия магазина
 * (src + натуральные пропорции для width/height);
 * headerMark — знак бренда слева в шапке, парный к иконкам справа; вместе
 * с headerLogo (словомаркой по центру) даёт «разобранный» логотип, при этом
 * на узких экранах центр прячется и остаётся только знак;
 * heroVideo — квадратный ролик-приветствие над каталогом: webm основной,
 * mp4 (h264) — запасной для старых iPhone (iOS < 17.4 не играет webm);
 * без поддерживаемого формата витрина показывает обычный текстовый заголовок;
 * heroImage — то же место, но статичное фото (src + alt); если заданы и видео,
 * и фото — играет видео, фото остаётся запасным вариантом.
 */
export const SHOP_THEMES = {
  di_gips: {
    className: styles.diGips,
    pageBackground: '#faf3e6',
    tagline: 'Магазин молдов Дианы di_gips',
    description:
      'Диана — автор di_gips: молды, гипсовый декор и свечи ручной работы. Творчество, которое вдохновляет и объединяет',
    heroImage: {
      src: 'https://storage.yandexcloud.net/anyforms/shop/di_gips/di_gips_hero.jpg',
      alt: 'Диана, автор di_gips, со своими изделиями из гипса',
    },
  },
  lunasvecha: {
    className: styles.lunasvecha,
    pageBackground: '#f4f1ea',
    tagline: 'Магазин молдов lunasvecha',
    description:
      'Молды для свечей — подборка lunasvecha: лью свечи с 2020 года и обучаю свечеварению учеников по всему миру',
    // Логотип разобран на две части: знак «луна + лотос» слева, словомарка
    // по центру; на узких экранах словомарка прячется (см. .brandLinkWithMark).
    headerMark: {
      src: '/lunasvecha_mark.svg',
      width: 120,
      height: 120,
    },
    headerLogo: {
      src: '/lunasvecha_wordmark.svg',
      width: 673,
      height: 64,
    },
    heroVideo: {
      webm: 'https://storage.yandexcloud.net/anyforms/shop/lunasvecha/gypsum.webm',
    },
  },
  af_pastry: {
    className: styles.afPastry,
    pageBackground: '#f4eee3',
    tagline: 'Магазин молдов Анны Феликовой',
    description:
      'Профессиональные силиконовые молды для десертов — подборка Анны Феликовой',
    headerLogo: {
      src: '/af_pastry_logo.png',
      width: 1054,
      height: 579,
    },
    heroVideo: {
      webm: 'https://storage.yandexcloud.net/anyforms/shop/af_pastry_landing/af_pastry_1.webm',
    },
  },
};
