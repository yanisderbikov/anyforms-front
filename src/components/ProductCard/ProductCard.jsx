import React from 'react';
import LikeButton from '../shared/LikeButton/LikeButton';
import styles from './ProductCard.module.css';

// В каталоге у карточки только название и цена — описание живёт на странице
// товара. boutique — подача для витрин с темой: крупное фото 3:4 без рамки.
const ProductCard = ({ item, index = null, onSelect, boutique = false }) => {
  const photos = item.photos?.length ? item.photos : [];
  const firstPhoto = photos[0];
  // Вторая фотография (порядок задаётся в админке) проявляется при наведении на карточку.
  const hoverPhoto = photos[1];

  const formatPrice = (value) => `${Number(value ?? 0).toLocaleString('ru-RU')} ₽`;

  // Товар с вариантами (размерами) — в карточке показываем цену «от минимальной».
  const variantPrices = (item.variants ?? [])
    .map((v) => Number(v.price))
    .filter((n) => Number.isFinite(n) && n > 0);
  const minVariantPrice = variantPrices.length ? Math.min(...variantPrices) : null;

  const hasCrossedPrice = minVariantPrice == null
    && item.crossedPrice != null && Number(item.crossedPrice) > Number(item.price);

  const handleClick = (e) => {
    e.preventDefault();
    onSelect?.(item, index);
  };

  return (
    <article
      className={boutique ? `${styles.card} ${styles.boutique}` : styles.card}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick(e)}
    >
      <div className={styles.photoWrap}>
        <LikeButton productId={item.id} product={item} placement="catalog" index={index} overlay />
        {firstPhoto ? (
          <img
            className={styles.photo}
            src={firstPhoto}
            alt={item.name}
            loading={index != null && index >= 4 ? 'lazy' : undefined}
            decoding="async"
          />
        ) : null}
        {firstPhoto && hoverPhoto ? (
          <img
            className={styles.photoHover}
            src={hoverPhoto}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
          />
        ) : null}
        {item.discountPercent > 0 && (
          <span className={styles.discountBadge}>−{item.discountPercent}%</span>
        )}
        {item.preorder && <span className={styles.preorderBadge}>Предзаказ</span>}
      </div>
      <div className={styles.body}>
        <h2 className={styles.name}>{item.name}</h2>
        <div className={styles.prices}>
          <span className={styles.price}>
            {minVariantPrice != null ? `от ${formatPrice(minVariantPrice)}` : formatPrice(item.price)}
          </span>
          {hasCrossedPrice && (
            <span className={styles.crossedPrice}>{formatPrice(item.crossedPrice)}</span>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
