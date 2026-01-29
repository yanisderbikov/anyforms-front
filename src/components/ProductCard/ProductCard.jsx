import React, { useState } from 'react';
import styles from './ProductCard.module.css';

const ProductCard = ({ item }) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const photos = item.photos?.length ? item.photos : [];
  const currentPhoto = photos[currentPhotoIndex];

  const goToPrev = (e) => {
    e.preventDefault();
    setCurrentPhotoIndex((i) => (i === 0 ? photos.length - 1 : i - 1));
  };

  const goToNext = (e) => {
    e.preventDefault();
    setCurrentPhotoIndex((i) => (i === photos.length - 1 ? 0 : i + 1));
  };

  const formatPrice = (value) => `${value.toLocaleString('ru-RU')} ₽`;

  return (
    <article className={styles.card}>
      <div className={styles.photoWrap}>
        {currentPhoto ? (
          <img
            className={styles.photo}
            src={encodeURI(currentPhoto)}
            alt={item.name}
          />
        ) : null}
        {photos.length > 1 && (
          <>
            <button
              type="button"
              className={`${styles.photoNav} ${styles.photoNavPrev}`}
              onClick={goToPrev}
              aria-label="Предыдущее фото"
            />
            <button
              type="button"
              className={`${styles.photoNav} ${styles.photoNavNext}`}
              onClick={goToNext}
              aria-label="Следующее фото"
            />
            <div className={styles.dots}>
              {photos.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`${styles.dot} ${i === currentPhotoIndex ? styles.dotActive : ''}`}
                  onClick={() => setCurrentPhotoIndex(i)}
                  aria-label={`Фото ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
        {item.discountPercent > 0 && (
          <span className={styles.discountBadge}>−{item.discountPercent}%</span>
        )}
      </div>
      <div className={styles.body}>
        <h2 className={styles.name}>{item.name}</h2>
        {item.description && (
          <p className={styles.description}>{item.description}</p>
        )}
        <div className={styles.prices}>
          <span className={styles.price}>{formatPrice(item.price)}</span>
          {item.crossedPrice != null && item.crossedPrice > item.price && (
            <span className={styles.crossedPrice}>{formatPrice(item.crossedPrice)}</span>
          )}
        </div>
        {item.tgLink && (
          <a
            href={item.tgLink}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.tgLink}
          >
            Подробнее
          </a>
        )}
      </div>
    </article>
  );
};

export default ProductCard;
