import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../apiClient';
import { useCart } from '../../context/CartContext';
import { isMarketplaceCheckoutEnabled } from '../../config/features';
import { EMAIL_RE, sanitizePhoneInput, isPhoneValid, toSubmitPhone } from '../../utils/phone';
import { normalizePromoCode } from '../../shared/promoTracking';
import {
  trackAddPaymentInfo,
  trackPaymentFailed,
  saveCheckoutSnapshot,
} from '../../services/analytics';
import PvzSelect from './PvzSelect';
import { readCheckoutForm, saveCheckoutForm } from './checkoutFormStorage';
import styles from './checkout.module.css';

// Единственный способ оплаты — онлайн через платёжную страницу Т-Банка.
const PAYMENT_TYPE = 'online';

const formatPrice = (value) => `${value.toLocaleString('ru-RU')} ₽`;

const MarketplaceCheckout = () => {
  const { items, total, count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  // Черновик формы: возвращение с других страниц (и после оплаты) не заставляет
  // вводить всё заново.
  const savedForm = useMemo(() => readCheckoutForm() || {}, []);

  const [fullName, setFullName] = useState(savedForm.fullName || '');
  const [phone, setPhone] = useState(savedForm.phone || '');
  const [email, setEmail] = useState(savedForm.email || '');
  const [pvz, setPvz] = useState(savedForm.pvz || null);
  const [marketingConsent, setMarketingConsent] = useState(Boolean(savedForm.marketingConsent));
  const [acceptTerms, setAcceptTerms] = useState(Boolean(savedForm.acceptTerms));
  const [touched, setTouched] = useState({ fullName: false, phone: false, email: false });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [promoInput, setPromoInput] = useState(savedForm.promoInput || '');
  const [appliedPromo, setAppliedPromo] = useState(savedForm.appliedPromo || null);
  const [promoError, setPromoError] = useState('');
  const [promoChecking, setPromoChecking] = useState(false);

  useEffect(() => {
    saveCheckoutForm({
      fullName,
      phone,
      email,
      pvz,
      marketingConsent,
      acceptTerms,
      promoInput,
      appliedPromo,
    });
  }, [fullName, phone, email, pvz, marketingConsent, acceptTerms, promoInput, appliedPromo]);

  const nameValid = fullName.trim().length >= 2;
  const phoneValid = isPhoneValid(phone);
  const emailValid = EMAIL_RE.test(email.trim());
  const pvzValid = Boolean(pvz?.pvzCode);
  const canSubmit =
    items.length > 0 && nameValid && phoneValid && emailValid && pvzValid && acceptTerms && !submitting;

  const markTouched = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  // Скидка считается как на сервере: с каждой единицы товара, с округлением до копейки.
  const discountedTotal = appliedPromo
    ? items.reduce(
        (sum, i) =>
          sum +
          (Math.round((i.price * 100 * (100 - appliedPromo.discountPercent)) / 100) / 100) * i.quantity,
        0
      )
    : total;

  // Промокод закреплён за контактами: сменили почту или телефон — проверяем заново.
  const resetPromo = () => {
    setAppliedPromo(null);
    setPromoError('');
  };

  const checkPromo = async () => {
    const code = normalizePromoCode(promoInput);
    if (!code) return;
    if (!EMAIL_RE.test(email.trim()) || !isPhoneValid(phone)) {
      setTouched((prev) => ({ ...prev, phone: true, email: true }));
      setPromoError('Сначала укажите телефон и почту — промокод проверяется по ним.');
      return;
    }
    setPromoChecking(true);
    setPromoError('');
    try {
      const { data } = await apiClient.instance.get('/api/payment/cart-promo-check', {
        params: { code, email: email.trim(), phone: toSubmitPhone(phone) },
      });
      if (data?.valid) {
        setAppliedPromo(data);
        setPromoInput(data.code);
      } else {
        setAppliedPromo(null);
        setPromoError(data?.message || 'Промокод не подошёл.');
      }
    } catch {
      setPromoError('Не удалось проверить промокод. Попробуйте ещё раз.');
    } finally {
      setPromoChecking(false);
    }
  };

  const nameError = touched.fullName && !nameValid ? 'Укажите ваше ФИО.' : '';
  const phoneError = touched.phone && !phoneValid ? 'Проверьте номер: в нём должно быть от 8 до 15 цифр.' : '';
  const emailError = touched.email && !emailValid ? 'Введите корректный адрес, например you@example.com.' : '';

  // Фича-флаг: без ?tbpayment=true в URL чекаут недоступен — уводим в корзину.
  if (!isMarketplaceCheckoutEnabled(location.search)) {
    return <Navigate to="/shop/cart" replace />;
  }

  if (items.length === 0) {
    return (
      <div className={styles.page} id="top">
        <div className={styles.inner}>
          <div className={styles.centered}>
            <p className={styles.centeredText}>Корзина пуста — оформлять нечего.</p>
            <Link className={styles.primaryLink} to="/shop">
              <span>Перейти к товарам</span>
              <span className={styles.ctaArrow} aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ fullName: true, phone: true, email: true });
    if (!nameValid) return setError('Укажите ваше ФИО.');
    if (!phoneValid) return setError('Укажите корректный номер телефона.');
    if (!emailValid) return setError('Укажите корректный адрес электронной почты.');
    if (!pvzValid) return setError('Выберите пункт выдачи СДЭК.');
    if (!acceptTerms) return setError('Подтвердите согласие с условиями.');

    setError('');
    setSubmitting(true);
    try {
      const { data } = await apiClient.instance.post('/api/payment/cart-purchase', {
        items: items.map((i) => ({ productId: i.id, quantity: i.quantity })),
        fullName: fullName.trim(),
        phone: toSubmitPhone(phone),
        email: email.trim(),
        pvzCode: pvz.pvzCode,
        pvzCity: pvz.pvzCity,
        pvzStreet: pvz.pvzStreet,
        marketingConsent,
        promoCode: appliedPromo ? appliedPromo.code : null,
        returnUrl: `${window.location.origin}/shop/success`,
      });
      if (data?.paymentUrl) {
        // Платёж создан: фиксируем выбор оплаты и сохраняем состав корзины,
        // чтобы после возврата с платёжной страницы отправить purchase.
        trackAddPaymentInfo(items, PAYMENT_TYPE);
        saveCheckoutSnapshot(items);
        window.location.href = data.paymentUrl;
        return;
      }
      trackPaymentFailed(PAYMENT_TYPE, 'no_payment_url');
      setError('Не удалось создать платёж. Попробуйте ещё раз.');
      setSubmitting(false);
    } catch (err) {
      trackPaymentFailed(PAYMENT_TYPE, err?.response?.status ?? 'network_error');
      const apiMessage = err?.response?.data?.message || err?.response?.data?.error;
      setError(
        typeof apiMessage === 'string'
          ? apiMessage
          : 'Не удалось создать платёж. Попробуйте ещё раз или напишите нам в Telegram.'
      );
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page} id="top">
      <div className={styles.inner}>
        <div className={styles.topBar}>
          <Link className={styles.back} to={`/shop/cart${location.search}`}>
            ← В корзину
          </Link>
        </div>
        <span className={styles.eyebrow}>Оформление</span>
        <h1 className={styles.title}>Оформление заказа</h1>

        <div className={styles.summary}>
          <div className={styles.orderItems}>
            {items.map((item) => (
              <div key={item.id} className={styles.orderItem}>
                {item.photo ? (
                  <img className={styles.orderThumb} src={item.photo} alt={item.name} />
                ) : (
                  <div className={styles.orderThumb} />
                )}
                <div className={styles.orderItemInfo}>
                  <p className={styles.orderItemName}>{item.name}</p>
                  {item.description && <p className={styles.orderItemDesc}>{item.description}</p>}
                  <p className={styles.orderItemMeta}>
                    {formatPrice(item.price)} × {item.quantity}
                  </p>
                </div>
                <span className={styles.orderItemPrice}>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <hr className={styles.summaryDivider} />
          <div className={styles.summaryRow}>
            <span>Доставка СДЭК</span>
            <span>на ПВЗ при получении</span>
          </div>
          {appliedPromo && (
            <div className={styles.summaryRow}>
              <span>Промокод {appliedPromo.code}</span>
              <span>−{appliedPromo.discountPercent}%</span>
            </div>
          )}
          <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
            <span>К оплате сейчас ({count})</span>
            <span>
              {appliedPromo && <span className={styles.oldTotal}>{formatPrice(total)}</span>}
              {formatPrice(discountedTotal)}
            </span>
          </div>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <label className={`${styles.label} ${styles.labelFirst}`} htmlFor="fullName">
            ФИО <span className={styles.req}>*</span>
          </label>
          <input
            id="fullName"
            className={`${styles.input} ${nameError ? styles.inputError : ''}`}
            type="text"
            autoComplete="name"
            placeholder="Иванов Иван Иванович"
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              setError('');
            }}
            onBlur={() => markTouched('fullName')}
            required
          />
          {nameError && <p className={styles.fieldError}>{nameError}</p>}

          <label className={styles.label} htmlFor="phone">
            Телефон <span className={styles.req}>*</span>
          </label>
          <input
            id="phone"
            className={`${styles.input} ${phoneError ? styles.inputError : ''}`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+7 999 123-45-67"
            value={phone}
            onChange={(e) => {
              setPhone(sanitizePhoneInput(e.target.value));
              setError('');
              resetPromo();
            }}
            onBlur={() => markTouched('phone')}
            required
          />
          {phoneError && <p className={styles.fieldError}>{phoneError}</p>}

          <label className={styles.label} htmlFor="email">
            Электронная почта <span className={styles.req}>*</span>
          </label>
          <input
            id="email"
            className={`${styles.input} ${emailError ? styles.inputError : ''}`}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
              resetPromo();
            }}
            onBlur={() => markTouched('email')}
            required
          />
          {emailError ? (
            <p className={styles.fieldError}>{emailError}</p>
          ) : (
            <p className={styles.hint}>На этот адрес пришлём чек и подтверждение заказа.</p>
          )}

          <label className={styles.label} htmlFor="promo">
            Промокод
          </label>
          <div className={styles.promoRow}>
            <input
              id="promo"
              className={`${styles.input} ${promoError ? styles.inputError : ''}`}
              type="text"
              autoComplete="off"
              placeholder="Введите промокод, если есть"
              value={promoInput}
              onChange={(e) => {
                setPromoInput(e.target.value);
                resetPromo();
              }}
              aria-invalid={Boolean(promoError)}
            />
            <button
              type="button"
              className={styles.promoApplyBtn}
              onClick={checkPromo}
              disabled={promoChecking || !promoInput.trim() || Boolean(appliedPromo)}
            >
              {promoChecking ? 'Проверяем…' : appliedPromo ? 'Применён' : 'Применить'}
            </button>
          </div>
          {promoError && <p className={styles.fieldError}>{promoError}</p>}
          {appliedPromo && (
            <p className={styles.promoOk}>
              Промокод {appliedPromo.code} применён: скидка {appliedPromo.discountPercent}%.
            </p>
          )}

          <label className={styles.label}>
            Пункт выдачи СДЭК <span className={styles.req}>*</span>
          </label>
          <PvzSelect
            selected={pvz}
            onSelect={(p) => {
              setPvz(p);
              setError('');
            }}
            onClear={() => setPvz(null)}
            invalid={!pvzValid}
          />

          <label className={styles.checkRow}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
            />
            <span className={styles.checkText}>
              Хочу получать полезные материалы и предложения на email. Можно отписаться в любой момент.
            </span>
          </label>

          <label className={styles.checkRow}>
            <input
              type="checkbox"
              className={styles.checkbox}
              checked={acceptTerms}
              onChange={(e) => {
                setAcceptTerms(e.target.checked);
                setError('');
              }}
              required
            />
            <span className={styles.checkText}>
              Я согласен с условиями продажи и{' '}
              <Link to="/chief/privacy" target="_blank" className={styles.inlineLink}>
                политикой конфиденциальности
              </Link>
              .
            </span>
          </label>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.payBtn} disabled={!canSubmit}>
            <span>{submitting ? 'Переходим к оплате…' : `Оплатить ${formatPrice(discountedTotal)}`}</span>
            <span className={styles.ctaArrow} aria-hidden="true">→</span>
          </button>

          <p className={styles.support}>
            Возникли вопросы? Напишите нам в Telegram{' '}
            <a className={styles.inlineLink} href="https://t.me/AnyFormsBot" target="_blank" rel="noopener noreferrer">
              @AnyFormsBot
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default MarketplaceCheckout;
