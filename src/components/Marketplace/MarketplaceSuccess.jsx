import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../../apiClient';
import { useCart, DEFAULT_SHOP_SLUG } from '../../context/CartContext';
import { useShopSupport } from '../../hooks/useShopSupport';
import {
  trackPurchase,
  trackPaymentFailed,
  trackPaymentReturn,
  trackMetrikaGoal,
  readCheckoutSnapshot,
  clearCheckoutSnapshot,
} from '../../services/analytics';
import { clearCheckoutFormPromo } from './checkoutFormStorage';
import { SHOP_THEMES } from './shopThemes';
import { getDeviceId } from '../../shared/deviceId';
import PostPurchasePromo from '../PromoPopup/PostPurchasePromo';
import styles from './checkout.module.css';

const PAYMENT_TYPE = 'online';
const PAYMENT_RETURN_SENT_PREFIX = 'anyforms_payment_return_sent_';
const PAYMENT_FAILED_RETURN_SENT_PREFIX = 'anyforms_payment_failed_return_sent_';
// Вебхук об оплате может прийти на пару секунд позже возврата с платёжной
// страницы: пока бэк отвечает 202, переспрашиваем промокод ещё несколько раз.
const AFTER_PURCHASE_RETRY_MS = 3000;
const AFTER_PURCHASE_MAX_ATTEMPTS = 8;

const wasSent = (key) => {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
};

const markSent = (key) => {
  try {
    localStorage.setItem(key, '1');
  } catch {
    // localStorage может быть недоступен — тогда защита остаётся на уровне страницы.
  }
};

const formatRub = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  return `${num.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽`;
};

const MarketplaceSuccess = () => {
  const { clear, shopSlug } = useCart();
  // Витрина, с которой был оформлен заказ: clear() чистит только товары,
  // поэтому после оплаты возвращаем покупателя в его магазин.
  const shopBase = shopSlug && shopSlug !== DEFAULT_SHOP_SLUG ? `/shop/${shopSlug}` : '/shop';
  // Поддержка ведёт в бот магазина, в котором оформлен заказ.
  const { handle: supportTg, link: supportTgLink } = useShopSupport(shopSlug);
  // Страница результата оплаты — в теме магазина заказа; anyforms — без изменений.
  const theme = shopSlug ? SHOP_THEMES[shopSlug] : null;
  const pageClass = theme ? `${styles.page} ${theme.className}` : styles.page;
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order')?.toUpperCase() || null;
  const isFail = searchParams.get('status') === 'fail';
  const [order, setOrder] = useState(null);
  const [afterPromo, setAfterPromo] = useState(null);

  // Успех: отправляем purchase (состав заказа — из снапшота, сохранённого перед
  // редиректом на оплату) и очищаем корзину. trackPurchase сам защищён от
  // повторной отправки по transaction_id, так что обновление страницы покупку
  // не задвоит. При неуспешной оплате корзину и снапшот не трогаем — покупатель
  // может вернуться на чекаут и оплатить ещё раз.
  useEffect(() => {
    const snapshot = readCheckoutSnapshot();
    const transactionId = orderNumber || snapshot?.fallbackId;
    if (!transactionId) {
      const fallbackKey = `${window.location.pathname}${window.location.search}`;
      const returnStorageKey = `${PAYMENT_RETURN_SENT_PREFIX}fail:url:${fallbackKey}`;
      if (isFail && !wasSent(returnStorageKey)) {
        trackPaymentReturn('fail');
        markSent(returnStorageKey);
      }
      const paymentFailedKey = `${PAYMENT_FAILED_RETURN_SENT_PREFIX}url:${fallbackKey}`;
      if (isFail && !wasSent(paymentFailedKey)) {
        trackPaymentFailed(PAYMENT_TYPE, 'provider_redirect_fail');
        markSent(paymentFailedKey);
      }
      return;
    }
    const status = isFail ? 'fail' : 'success';
    const returnStorageKey = `${PAYMENT_RETURN_SENT_PREFIX}${status}:${transactionId}`;
    if (!wasSent(returnStorageKey)) {
      trackPaymentReturn(status, transactionId);
      markSent(returnStorageKey);
    }
    if (isFail) {
      const paymentFailedKey = `${PAYMENT_FAILED_RETURN_SENT_PREFIX}${transactionId}`;
      if (!wasSent(paymentFailedKey)) {
        trackPaymentFailed(PAYMENT_TYPE, 'provider_redirect_fail');
        markSent(paymentFailedKey);
      }
      return;
    }
    if (snapshot) {
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

  // Промокод на следующий заказ: бэк выдаёт его только по оплаченному заказу,
  // один код на заказ, поэтому обновление страницы покажет тот же код.
  useEffect(() => {
    if (!orderNumber || isFail) return undefined;
    let cancelled = false;
    let attempts = 0;
    let timer = null;
    const load = () => {
      apiClient.instance
        .post('/api/public/promo-popup/after-purchase', { orderNumber, deviceId: getDeviceId() })
        .then(({ status, data }) => {
          if (cancelled) return;
          if (status === 202) {
            attempts += 1;
            if (attempts < AFTER_PURCHASE_MAX_ATTEMPTS) timer = window.setTimeout(load, AFTER_PURCHASE_RETRY_MS);
            return;
          }
          if (status !== 200 || !data?.code) return;
          setAfterPromo(data);
          trackMetrikaGoal('promo_after_purchase_shown', { popup: data.popupId, repeated: Boolean(data.repeated) });
        })
        .catch(() => {
          // Промокод — бонус: без него страница успеха работает как раньше.
        });
    };
    load();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [orderNumber, isFail]);

  const handlePromoCopy = () => {
    if (!afterPromo) return;
    trackMetrikaGoal('promo_after_purchase_copied', { popup: afterPromo.popupId });
  };

  const deliveryAddress = [order?.pvzCity, order?.pvzStreet].filter(Boolean).join(', ');
  const deliveryLabel = order?.deliveryMethod === 'PICKUP' ? 'Самовывоз' : 'Пункт выдачи СДЭК';
  const totalFormatted = order?.totalRub ? formatRub(order.totalRub) : null;

  return (
    <div className={pageClass} id="top">
      <div className={styles.inner}>
        <div className={styles.centered}>
          <div className={isFail ? styles.failIcon : styles.successIcon}>{isFail ? '✕' : '✓'}</div>
          <h1 className={styles.centeredTitle}>
            {isFail ? (
              'Оплата не прошла'
            ) : orderNumber ? (
              <>
                Заказ <span className={styles.orderNumber}>#{orderNumber}</span> оформлен
              </>
            ) : (
              'Заказ оформлен'
            )}
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
                    <strong className={styles.orderNumber}>#{orderNumber}</strong>.
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

          {!isFail && afterPromo && <PostPurchasePromo promo={afterPromo} onCopy={handlePromoCopy} />}

          <Link className={styles.primaryLink} to={isFail ? '/shop/checkout' : shopBase}>
            <span>{isFail ? 'Попробовать ещё раз' : 'Вернуться в магазин'}</span>
            <span className={styles.ctaArrow} aria-hidden="true">→</span>
          </Link>

          <p className={styles.support}>
            Если понадобится помощь — напишите в поддержку в Telegram:{' '}
            <a
              className={styles.inlineLink}
              href={supportTgLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              @{supportTg}
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
