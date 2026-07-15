import React from 'react';
import { useLikes } from '../../../hooks/useLikes';
import { trackAddToWishlist, trackRemoveFromWishlist } from '../../../services/analytics';
import styles from './LikeButton.module.css';

// product, placement ('catalog' | 'product_page') и index (позиция в каталоге)
// нужны только для аналитики; без них кнопка работает как раньше.
const LikeButton = ({ productId, product = null, placement = null, index = null, overlay = false, className = '' }) => {
  const { isLiked, toggleLike } = useLikes();
  const liked = isLiked(productId);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const nowLiked = toggleLike(productId);
    if (nowLiked === null) return;
    const analyticsProduct = product ?? { id: productId };
    if (nowLiked) {
      trackAddToWishlist(analyticsProduct, { placement, index: index ?? undefined });
    } else {
      trackRemoveFromWishlist(analyticsProduct, { placement, index: index ?? undefined });
    }
  };

  return (
    <button
      type="button"
      className={`${styles.likeBtn} ${liked ? styles.liked : ''} ${overlay ? styles.overlay : ''} ${className}`.trim()}
      aria-label={liked ? 'Убрать из избранного' : 'В избранное'}
      aria-pressed={liked}
      onClick={handleClick}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={liked ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
      </svg>
    </button>
  );
};

export default LikeButton;
