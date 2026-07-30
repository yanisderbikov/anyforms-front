import styles from './shopThemes.module.css';

/**
 * Оформление партнёрских витрин /shop/{slug}. Магазин без темы получает
 * стандартный вид anyforms (только бейдж с названием).
 *
 * className — класс с CSS-переменными темы (вешается на корень страницы);
 * pageBackground — фон body (App.jsx), тот же цвет, что --shop-page-bg;
 * tagline — заголовок витрины под шапкой;
 * headerLogo — логотип в центре шапки вместо названия магазина
 * (src + натуральные пропорции для width/height).
 */
export const SHOP_THEMES = {
  af_pastry: {
    className: styles.afPastry,
    pageBackground: '#f4eee3',
    tagline: 'Магазин молдов Анны Феликовой',
    headerLogo: {
      src: '/af_pastry_logo.png',
      width: 1054,
      height: 579,
    },
  },
};
