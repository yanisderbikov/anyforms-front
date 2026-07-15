import React, { useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import {
  trackPurchase,
  readCheckoutSnapshot,
  clearCheckoutSnapshot,
} from '../../services/analytics';
import styles from './checkout.module.css';

const MarketplaceSuccess = () => {
  const { clear } = useCart();
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order');

  // Оплата прошла: отправляем purchase (состав заказа — из снапшота,
  // сохранённого перед редиректом на оплату) и очищаем корзину.
  // trackPurchase сам защищён от повторной отправки по transaction_id,
  // так что обновление страницы успеха покупку не задвоит.
  useEffect(() => {
    const snapshot = readCheckoutSnapshot();
    const transactionId = orderNumber || snapshot?.fallbackId;
    if (snapshot && transactionId) {
      const sent = trackPurchase({
        id: transactionId,
        value: snapshot.value,
        items: snapshot.items,
      });
      if (sent) clearCheckoutSnapshot();
    }
    clear();
  }, [clear, orderNumber]);

  return (
    <div className={styles.page} id="top">
      <div className={styles.inner}>
        <div className={styles.centered}>
          <div className={styles.successIcon}>✓</div>
          <h1 className={styles.centeredTitle}>
            {orderNumber ? `Заказ #${orderNumber} оформлен` : 'Заказ оформлен'}
          </h1>
          <p className={styles.centeredText}>
            Спасибо за заказ! Мы отправили письмо с предварительным чеком и составом заказа на вашу почту.
            Соберём заказ и передадим его в выбранный пункт выдачи СДЭК — трек-номер пришлём отдельно.
            {orderNumber && (
              <>
                {' '}
                Если понадобится помощь — напишите в поддержку и укажите номер заказа{' '}
                <strong>#{orderNumber}</strong>.
              </>
            )}
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
