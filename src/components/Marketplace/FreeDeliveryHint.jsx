import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './checkout.module.css';

const formatPrice = (value) => `${value.toLocaleString('ru-RU')}\u00A0₽`;

const PROGRESS_COLORS = [
  [0, [17, 17, 17]],
  [50, [242, 183, 5]],
  [80, [155, 197, 61]],
  [100, [29, 122, 61]],
];

export const progressColor = (percent) => {
  const p = Math.min(100, Math.max(0, percent));
  const upper = PROGRESS_COLORS.findIndex(([stop]) => stop >= p);
  if (upper <= 0) return `rgb(${PROGRESS_COLORS[0][1].join(', ')})`;
  const [fromStop, from] = PROGRESS_COLORS[upper - 1];
  const [toStop, to] = PROGRESS_COLORS[upper];
  const t = (p - fromStop) / (toStop - fromStop);
  return `rgb(${from.map((c, i) => Math.round(c + (to[i] - c) * t)).join(', ')})`;
};

const FreeDeliveryHint = ({ freeDelivery, amountRub, amountBeforeDiscountRub, shopLink }) => {
  const lastPendingRef = useRef(null);

  if (!freeDelivery.enabled) return null;

  const free = freeDelivery.qualifies(amountRub);
  if (!free || !lastPendingRef.current) {
    lastPendingRef.current = {
      remaining: freeDelivery.remainingRub(amountRub),
      afterDiscount: amountBeforeDiscountRub != null && freeDelivery.qualifies(amountBeforeDiscountRub),
    };
  }
  const { remaining, afterDiscount } = lastPendingRef.current;
  const progress = free
    ? 100
    : Math.min(100, Math.max(0, Math.floor((amountRub / freeDelivery.thresholdRub) * 100)));

  return (
    <div className={`${styles.swap} ${styles.freeDelivery}`}>
      <div className={`${styles.swapLayer} ${free ? styles.swapHidden : ''}`} aria-hidden={free}>
        <div className={styles.freeDeliveryHead}>
          <p className={styles.freeDeliveryText}>
            Ещё {formatPrice(remaining)} — и доставка будет бесплатной
            <span className={styles.freeDeliveryThreshold}>
              {' '}(от{'\u00A0'}{formatPrice(freeDelivery.thresholdRub)}{afterDiscount ? ' после скидки' : ''})
            </span>
          </p>
          {shopLink && (
            <Link className={styles.freeDeliveryLink} to={shopLink} aria-label="Добавить товары">
              <span className={styles.freeDeliveryLinkLong}>Добавить товары</span>
              <span className={styles.freeDeliveryLinkShort}>К товарам</span>
              {'\u00A0→'}
            </Link>
          )}
        </div>
        <div
          className={styles.freeDeliveryBar}
          role="progressbar"
          aria-label="Сумма до бесплатной доставки"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
        >
          <div
            className={styles.freeDeliveryFill}
            style={{ width: `${progress}%`, backgroundColor: progressColor(progress) }}
          />
        </div>
      </div>
      <div
        className={`${styles.swapLayer} ${styles.freeDeliveryOk} ${free ? '' : styles.swapHidden}`}
        aria-hidden={!free}
      >
        <span className={styles.freeDeliveryCheck} aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6.2 5 8.6l4.5-5.1"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        Доставка для вас бесплатная — её оплачиваем мы
      </div>
    </div>
  );
};

export const DeliverySummaryValue = ({ free }) => (
  <span className={`${styles.swap} ${styles.swapEnd}`}>
    <span className={`${styles.swapLayer} ${free ? styles.swapHidden : ''}`} aria-hidden={free}>
      на ПВЗ при получении
    </span>
    <span
      className={`${styles.swapLayer} ${styles.deliveryQuoteFree} ${free ? '' : styles.swapHidden}`}
      aria-hidden={!free}
    >
      бесплатно
    </span>
  </span>
);

export default FreeDeliveryHint;
