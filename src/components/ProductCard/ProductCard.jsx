import React from 'react';
import LikeButton from '../shared/LikeButton/LikeButton';
import styles from './ProductCard.module.css';

const ProductCard = ({ item, index = null, onSelect }) => {
  const photos = item.photos?.length ? item.photos : [];
  const firstPhoto = photos[0];

  const formatPrice = (value) => `${Number(value ?? 0).toLocaleString('ru-RU')} ₽`;

  // Товар с вариантами (размерами) — в карточке показываем цену «от минимальной».
  const variantPrices = (item.variants ?? [])
    .map((v) => Number(v.price))
    .filter((n) => Number.isFinite(n) && n > 0);
  const minVariantPrice = variantPrices.length ? Math.min(...variantPrices) : null;

  const hasCrossedPrice = minVariantPrice == null
    && item.crossedPrice != null && Number(item.crossedPrice) > Number(item.price);

  const isOnSale = item.discountPercent > 0 || hasCrossedPrice;

  const handleClick = (e) => {
    e.preventDefault();
    onSelect?.(item, index);
  };

  return (
    <article
      className={`${styles.card} ${isOnSale ? styles.cardSale : ''}`}
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
          />
        ) : null}
        {item.discountPercent > 0 && (
          <span className={styles.discountBadge}>−{item.discountPercent}%</span>
        )}
        {item.preorder && <span className={styles.preorderBadge}>Предзаказ</span>}
      </div>
      <div className={styles.body}>
        <h2 className={styles.name}>{item.name}</h2>
        {item.description && (
          <p className={styles.description}>{item.description}</p>
        )}
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
