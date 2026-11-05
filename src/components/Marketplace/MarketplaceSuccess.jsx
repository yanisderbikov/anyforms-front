import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import apiClient from '../../apiClient';
import { useCart, DEFAULT_SHOP_SLUG } from '../../context/CartContext';
import { useShopSupport } from '../../hooks/useShopSupport';
import {
  trackPurchase,
  trackPaymentFailed,
  trackPaymentReturn,
  trackPromoAfterPurchase,
  trackCoursePromoAfterPurchase,
  readCheckoutSnapshot,
  clearCheckoutSnapshot,
} from '../../services/analytics';
import { clearCheckoutFormPromo } from './checkoutFormStorage';
import { useShopTheme } from './shopThemes';
import { getDeviceId } from '../../shared/deviceId';
import PostPurchasePromo from '../PromoPopup/PostPurchasePromo';
import CoursePromoAfterPurchase from '../PromoPopup/CoursePromoAfterPurchase';
import { ArrowIcon, CheckIcon, ChevronIcon, CrossIcon } from './successIcons';
import styles from './MarketplaceSuccess.module.css';

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

const pluralItems = (n) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'товар';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'товара';
  return 'товаров';
};

const MarketplaceSuccess = () => {
  const { clear, shopSlug } = useCart();
  // Витрина, с которой был оформлен заказ: clear() чистит только товары,
  // поэтому после оплаты возвращаем покупателя в его магазин.
  const shopBase = shopSlug && shopSlug !== DEFAULT_SHOP_SLUG ? `/shop/${shopSlug}` : '/shop';
  // Поддержка ведёт в бот магазина, в котором оформлен заказ.
  const { handle: supportTg, link: supportTgLink } = useShopSupport(shopSlug);
  // Страница результата оплаты — в теме магазина заказа; anyforms — без изменений.
  const theme = useShopTheme(shopSlug);
  const pageClass = theme?.className ? `${styles.page} ${theme.className}` : styles.page;
  const [searchParams] = useSearchParams();
  const orderNumber = searchParams.get('order')?.toUpperCase() || null;
  const isFail = searchParams.get('status') === 'fail';
  const [order, setOrder] = useState(null);
  const [afterPromo, setAfterPromo] = useState(null);
  const [coursePromo, setCoursePromo] = useState(null);

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
        promo: snapshot.promo,
        traffic: snapshot.traffic,
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
          trackPromoAfterPurchase('shown', data, { repeated: Boolean(data.repeated) });
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

  useEffect(() => {
    if (!orderNumber || isFail) return undefined;
    let cancelled = false;
    let attempts = 0;
    let timer = null;
    const load = () => {
      apiClient.instance
        .post('/api/public/promo-popup/course-after-purchase', { orderNumber, deviceId: getDeviceId() })
        .then(({ status, data }) => {
          if (cancelled) return;
          if (status === 202) {
            attempts += 1;
            if (attempts < AFTER_PURCHASE_MAX_ATTEMPTS) timer = window.setTimeout(load, AFTER_PURCHASE_RETRY_MS);
            return;
          }
          if (status !== 200 || !data?.code) return;
          setCoursePromo(data);
          trackCoursePromoAfterPurchase('shown', data);
        })
        .catch(() => {});
    };
    load();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [orderNumber, isFail]);

  const handlePromoCopy = () => {
    if (!afterPromo) return;
    trackPromoAfterPurchase('copied', afterPromo);
  };

  const deliveryAddress = [order?.pvzCity, order?.pvzStreet].filter(Boolean).join(', ');
  const deliveryLabel = order?.deliveryMethod === 'PICKUP' ? 'Самовывоз' : 'СДЭК';
  const totalFormatted = order?.totalRub ? formatRub(order.totalRub) : null;
  const itemsCount = (order?.items || []).reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <div className={pageClass} style={theme?.style} id="top">
      <div className={styles.sheet}>
        <div className={styles.head}>
          <div className={isFail ? `${styles.icon} ${styles.iconFail}` : styles.icon}>
            {isFail ? <CrossIcon /> : <CheckIcon />}
          </div>
          <h1 className={styles.title}>
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
          <p className={styles.text}>
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
              'Спасибо за заказ! Чек и состав заказа отправили на почту.'
            )}
          </p>
        </div>

        {!isFail && (
          <ol className={styles.steps}>
            <li className={styles.step}>
              <span className={`${styles.stepLine} ${styles.stepLineDone}`} />
              <span className={`${styles.stepDot} ${styles.stepDotDone}`}>
                <CheckIcon />
              </span>
              <span className={styles.stepTitle}>Чек отправлен</span>
              <span className={styles.stepSub}>Письмо уже на почте</span>
            </li>
            <li className={styles.step}>
              <span className={styles.stepLine} />
              <span className={styles.stepDot}>2</span>
              <span className={styles.stepTitle}>Передадим в СДЭК</span>
              <span className={styles.stepSub}>{deliveryAddress || 'В выбранный пункт выдачи'}</span>
            </li>
            <li className={styles.step}>
              <span className={styles.stepDot}>3</span>
              <span className={styles.stepTitle}>
                <span className={styles.stepTitleWide}>Пришлём трек-номер</span>
                <span className={styles.stepTitleShort}>Пришлём трек</span>
              </span>
              <span className={styles.stepSub}>Отдельным сообщением</span>
            </li>
          </ol>
        )}

        {!isFail && coursePromo && (
          <CoursePromoAfterPurchase
            promo={coursePromo}
            onCopy={() => trackCoursePromoAfterPurchase('copied', coursePromo)}
            onOpen={() => trackCoursePromoAfterPurchase('opened', coursePromo)}
          />
        )}

        {!isFail && afterPromo && <PostPurchasePromo promo={afterPromo} onCopy={handlePromoCopy} />}

        {order?.items?.length > 0 && (
          <details className={styles.receipt} open>
            <summary className={styles.receiptSummary}>
              <span className={styles.receiptTitle}>
                Состав заказа · {itemsCount} {pluralItems(itemsCount)}
              </span>
              <span className={styles.receiptTotal}>
                {totalFormatted}
                <span className={styles.receiptChevron}>
                  <ChevronIcon />
                </span>
              </span>
            </summary>
            <div className={styles.receiptBody}>
              {order.items.map((item, idx) => (
                <div key={idx} className={styles.receiptRow}>
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  {item.amountRub && <span className={styles.receiptPrice}>{formatRub(item.amountRub)}</span>}
                </div>
              ))}
              {deliveryAddress && (
                <p className={isFail ? styles.receiptDelivery : `${styles.receiptDelivery} ${styles.mobileOnly}`}>
                  {deliveryLabel}: {deliveryAddress}
                </p>
              )}
            </div>
          </details>
        )}

        <Link className={styles.back} to={isFail ? '/shop/checkout' : shopBase}>
          {isFail ? 'попробовать ещё раз' : 'вернуться в магазин'}
          <ArrowIcon />
        </Link>

        <p className={styles.support}>
          Если понадобится помощь — напишите в поддержку в Telegram:{' '}
          <a className={styles.supportLink} href={supportTgLink} target="_blank" rel="noopener noreferrer">
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
  );
};

export default MarketplaceSuccess;
