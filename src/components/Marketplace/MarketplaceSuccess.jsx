import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import styles from './checkout.module.css';

const MarketplaceSuccess = () => {
  const { clear } = useCart();

  // Оплата прошла — очищаем корзину.
  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <div className={styles.page} id="top">
      <div className={styles.inner}>
        <div className={styles.centered}>
          <div className={styles.successIcon}>✓</div>
          <h1 className={styles.centeredTitle}>Заказ оформлен</h1>
          <p className={styles.centeredText}>
            Спасибо за заказ! Мы отправили письмо с предварительным чеком и составом заказа на вашу почту.
            Соберём заказ и передадим его в выбранный пункт выдачи СДЭК — трек-номер пришлём отдельно.
          </p>
          <Link className={styles.primaryLink} to="/shop">
            <span>Вернуться в магазин</span>
            <span className={styles.ctaArrow} aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceSuccess;
