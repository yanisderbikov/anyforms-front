import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../../apiClient';
import { useCart } from '../../context/CartContext';
import {
  trackPurchase,
  trackPaymentFailed,
  readCheckoutSnapshot,
  clearCheckoutSnapshot,
} from '../../services/analytics';
import { clearCheckoutFormPromo } from './checkoutFormStorage';
import styles from './checkout.module.css';

const PAYMENT_TYPE = 'online';
const TG_SUPPORT_LINK = 'https://t.me/AnyFormsBot';

const formatRub = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return `${num.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽`;
};

const MarketplaceSuccess = () => {
  const { clear } = useCart();
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order');
  const isFail = searchParams.get('status') === 'fail';
  const [order, setOrder] = useState(null);

  // Успех: отправляем purchase (состав заказа — из снапшота, сохранённого перед
  // редиректом на оплату) и очищаем корзину. trackPurchase сам защищён от
  // повторной отправки по transaction_id, так что обновление страницы покупку
  // не задвоит. При неуспешной оплате корзину и снапшот не трогаем — покупатель
  // может вернуться на чекаут и оплатить ещё раз.
  useEffect(() => {
    if (isFail) {
      trackPaymentFailed(PAYMENT_TYPE, 'provider_redirect_fail');
      return;
    }
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
    // Контакты и ПВЗ пригодятся для следующего заказа, а промокод — одноразовый.
    clearCheckoutFormPromo();
    clear();
  }, [clear, orderNumber, isFail]);

  // Чек заказа: состав, суммы и ПВЗ по публичному номеру.
  useEffect(() => {
    if (!orderNumber) return undefined;
    let cancelled = false;
    apiClient.instance
      .get(`/api/public/orders/${encodeURIComponent(orderNumber)}`)
      .then(({ data }) => {
        if (!cancelled) setOrder(data);
      })
      .catch(() => {
        // Чек — вспомогательный блок: если не загрузился, просто не показываем.
      });
    return () => {
      cancelled = true;
    };
  }, [orderNumber]);

  const deliveryAddress = [order?.pvzCity, order?.pvzStreet].filter(Boolean).join(', ');
  const deliveryLabel = order?.deliveryMethod === 'PICKUP' ? 'Самовывоз' : 'Пункт выдачи СДЭК';
  const totalFormatted = order?.totalRub ? formatRub(order.totalRub) : null;

  return (
    <div className={styles.page} id="top">
      <div className={styles.inner}>
        <div className={styles.centered}>
          <div className={isFail ? styles.failIcon : styles.successIcon}>{isFail ? '✕' : '✓'}</div>
          <h1 className={styles.centeredTitle}>
            {isFail
              ? 'Оплата не прошла'
              : orderNumber
                ? `Заказ #${orderNumber} оформлен`
                : 'Заказ оформлен'}
          </h1>
          <p className={styles.centeredText}>
            {isFail ? (
              <>
                Платёж не прошёл, деньги не списаны — заказ не оформлен.
                Товары остались в корзине, можно попробовать оплатить ещё раз.
                {orderNumber && (
                  <>
                    {' '}
                    Если деньги всё же списались — напишите в поддержку и укажите номер заказа{' '}
                    <strong>#{orderNumber}</strong>.
                  </>
                )}
              </>
            ) : (
              <>
                Спасибо за заказ! Мы отправили письмо с предварительным чеком и составом заказа на вашу почту.
                Соберём заказ и передадим его в выбранный пункт выдачи СДЭК — трек-номер пришлём отдельно.
              </>
            )}
          </p>

          {order?.items?.length > 0 && (
            <div className={styles.receipt}>
              <p className={styles.receiptTitle}>
                Состав заказа{orderNumber ? ` #${orderNumber}` : ''}
              </p>
              {order.items.map((item, idx) => (
                <div key={idx} className={styles.receiptRow}>
                  <span className={styles.receiptName}>
                    {item.name} <span className={styles.receiptQty}>× {item.quantity}</span>
                  </span>
                  {item.amountRub && (
                    <span className={styles.receiptPrice}>{formatRub(item.amountRub)}</span>
                  )}
                </div>
              ))}
              {totalFormatted && (
                <div className={`${styles.receiptRow} ${styles.receiptTotal}`}>
                  <span>Итого</span>
                  <span>{totalFormatted}</span>
                </div>
              )}
              {deliveryAddress && (
                <p className={styles.receiptDelivery}>
                  {deliveryLabel}: {deliveryAddress}
                </p>
              )}
            </div>
          )}

          <Link className={styles.primaryLink} to={isFail ? '/shop/checkout' : '/shop'}>
            <span>{isFail ? 'Попробовать ещё раз' : 'Вернуться в магазин'}</span>
            <span className={styles.ctaArrow} aria-hidden="true">→</span>
          </Link>

          <p className={styles.support}>
            Если понадобится помощь — напишите в поддержку в Telegram:{' '}
            <a
              className={styles.inlineLink}
              href={TG_SUPPORT_LINK}
              target="_blank"
              rel="noopener noreferrer"
            >
              @AnyFormsBot
            </a>
            {orderNumber && (
              <>
                {' '}
                и укажите номер заказа <strong>#{orderNumber}</strong>
              </>
            )}
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceSuccess;
