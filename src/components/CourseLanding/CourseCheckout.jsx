import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import SiteHeader from '../shared/SiteHeader/SiteHeader';
import apiClient from '../../apiClient';
import {
  getPromoFromSearch,
  buildPassThroughQuery,
  formatPromoDeadlineNote,
  normalizePromoCode,
} from '../../shared/promoTracking';
import { EMAIL_RE, sanitizePhoneInput, isPhoneValid, toSubmitPhone } from '../../utils/phone';
import { readCheckoutContact, saveCheckoutContact } from '../../shared/checkoutContactStorage';
import { useSaleCountdown, daysLabel } from './courseSale';
import styles from './CourseCheckout.module.css';

// Курс, второй поток; code — продукт из payment_product на бэке.
export const COURSE_PRODUCT = {
  code: 'COURSE_STREAM_2',
  price: '16 900 ₽',
};

const formatKopecks = (kopecks) =>
  `${Math.round(kopecks / 100).toLocaleString('ru-RU')} ₽`;
const LAUNCH = '10 ноября 2026';
const SUPPORT_TG = 'https://t.me/AnyFormsBot';

const CourseCheckout = () => {
  const location = useLocation();
  // Обратные ссылки на лендинг сохраняют promo/utm из текущего URL.
  const backToCourse = `/course${buildPassThroughQuery(location.search)}`;
  const saleLeft = useSaleCountdown();
  // Контакты общие для всех чекаутов: заполнял магазин или гайд — подставятся и здесь.
  const savedContact = useMemo(() => readCheckoutContact() || {}, []);
  const [fullName, setFullName] = useState(savedContact.fullName || '');
  const [phone, setPhone] = useState(savedContact.phone || '');
  const [email, setEmail] = useState(savedContact.email || '');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [touched, setTouched] = useState({ fullName: false, phone: false, email: false });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoChecking, setPromoChecking] = useState(false);

  useEffect(() => {
    saveCheckoutContact({ fullName, phone, email });
  }, [fullName, phone, email]);

  const checkPromo = async (rawCode) => {
    const code = normalizePromoCode(rawCode);
    if (!code) return;
    setPromoChecking(true);
    setPromoError('');
    try {
      const { data } = await apiClient.instance.get('/api/payment/promo-check', {
        params: { code, productCode: COURSE_PRODUCT.code },
      });
      if (data?.valid) {
        setAppliedPromo(data);
        setPromoInput(data.code);
      } else {
        setAppliedPromo(null);
        setPromoError(data?.message || 'Промокод не подошёл.');
      }
    } catch {
      setAppliedPromo(null);
      setPromoError('Не удалось проверить промокод. Попробуйте ещё раз.');
    } finally {
      setPromoChecking(false);
    }
  };

  // Промокод из URL (?promo=...) подставляем и применяем автоматически.
  useEffect(() => {
    const fromUrl = getPromoFromSearch(location.search);
    if (fromUrl) {
      setPromoInput(fromUrl);
      checkPromo(fromUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const preorder = !saleLeft.closed;
  const displayPrice = appliedPromo
    ? formatKopecks(appliedPromo.discountedPriceKopecks)
    : COURSE_PRODUCT.price;
  const oldPrice = appliedPromo && formatKopecks(appliedPromo.priceKopecks);

  const nameValid = fullName.trim().length >= 2;
  const phoneValid = isPhoneValid(phone);
  const emailValid = EMAIL_RE.test(email.trim());
  const canSubmit = nameValid && phoneValid && emailValid && acceptTerms && !submitting;

  const markTouched = (field) => setTouched((prev) => ({ ...prev, [field]: true }));

  const nameError = touched.fullName && !nameValid ? 'Укажите ваше ФИО.' : '';
  const phoneError =
    touched.phone && !phoneValid ? 'Проверьте номер: в нём должно быть от 8 до 15 цифр.' : '';
  const emailError =
    touched.email && !emailValid ? 'Введите корректный адрес, например you@example.com.' : '';

  const handlePhoneChange = (e) => {
    setPhone(sanitizePhoneInput(e.target.value));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ fullName: true, phone: true, email: true });
    if (!nameValid) {
      setError('Укажите ваше ФИО.');
      return;
    }
    if (!phoneValid) {
      setError('Укажите корректный номер телефона.');
      return;
    }
    if (!emailValid) {
      setError('Укажите корректный адрес электронной почты.');
      return;
    }
    if (!acceptTerms) {
      setError('Подтвердите согласие с офертой и политикой конфиденциальности.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { data } = await apiClient.instance.post('/api/payment/purchase', {
        productCode: COURSE_PRODUCT.code,
        fullName: fullName.trim(),
        phone: toSubmitPhone(phone),
        email: email.trim(),
        marketingConsent,
        returnUrl: `${window.location.origin}/course/success`,
        promoCode: appliedPromo ? appliedPromo.code : null,
      });
      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      setError('Произошла ошибка. Попробуйте ещё раз или напишите нам в Telegram @AnyFormsBot — поможем.');
      setSubmitting(false);
    } catch (err) {
      // Показываем только осмысленные сообщения бэкенда (data.message);
      // сырые тексты вроде «Internal Server Error» до покупателя не доходят.
      const apiMessage = err?.response?.data?.message;
      setError(
        typeof apiMessage === 'string' && apiMessage.trim()
          ? apiMessage
          : 'Произошла ошибка. Попробуйте ещё раз или напишите нам в Telegram @AnyFormsBot — поможем.'
      );
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page} id="top">
      <SiteHeader
        logo={{
          href: backToCourse,
          ariaLabel: 'anyforms — к курсу',
          src: '/anyforms-wordmark-white.svg',
          width: 152,
          height: 21,
        }}
        navLinks={[]}
        navAriaLabel="Разделы"
        rightItems={[
          { key: 'course', kind: 'link', to: backToCourse, label: 'К курсу', variant: 'pill' },
        ]}
        mobileMenuId="checkout-mobile-menu"
        mobileTopItems={[
          { key: 'course-m', kind: 'link', to: backToCourse, label: 'К курсу', variant: 'primary' },
        ]}
      />

      <main className={styles.main}>
        <div className={styles.inner}>
          <span className={styles.eyebrow}>Оформление</span>
          <h1 className={styles.title}>Покупка курса</h1>

          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryName}>
                Курс по производству силиконовых форм · второй поток
              </span>
              <span className={styles.summaryPriceCol}>
                {oldPrice && <span className={styles.summaryPriceOld}>{oldPrice}</span>}
                <span className={styles.summaryPrice}>{displayPrice}</span>
              </span>
            </div>
            {preorder ? (
              <>
                <p className={styles.saleTimer}>
                  До старта курса:{' '}
                  <strong>
                    {saleLeft.days} {daysLabel(saleLeft.days)} {saleLeft.hours}:{saleLeft.minutes}:
                    {saleLeft.seconds}
                  </strong>
                </p>
                <p className={styles.summaryNote}>
                  Запуск курса — {LAUNCH}. Доступ откроется в день запуска — ссылку пришлём
                  на указанную почту. После оплаты отправим письмо-подтверждение.
                </p>
              </>
            ) : (
              <p className={styles.summaryNote}>
                Курс стартовал {LAUNCH}. После оплаты пришлём на указанную почту
                письмо-подтверждение и ссылку на материалы курса.
              </p>
            )}
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <label className={styles.label} htmlFor="fullName">
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
              aria-invalid={Boolean(nameError)}
              required
            />
            {nameError && <p className={styles.fieldError}>{nameError}</p>}

            <label className={`${styles.label} ${styles.labelGap}`} htmlFor="phone">
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
              onChange={handlePhoneChange}
              onBlur={() => markTouched('phone')}
              aria-invalid={Boolean(phoneError)}
              required
            />
            {phoneError && <p className={styles.fieldError}>{phoneError}</p>}

            <label className={`${styles.label} ${styles.labelGap}`} htmlFor="email">
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
              }}
              onBlur={() => markTouched('email')}
              aria-invalid={Boolean(emailError)}
              required
            />
            {emailError ? (
              <p className={styles.fieldError}>{emailError}</p>
            ) : (
              <p className={styles.hint}>На этот адрес мы пришлём доступ к курсу.</p>
            )}

            <label className={`${styles.label} ${styles.labelGap}`} htmlFor="promo">
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
                  setAppliedPromo(null);
                  setPromoError('');
                }}
                aria-invalid={Boolean(promoError)}
              />
              <button
                type="button"
                className={styles.promoApplyBtn}
                onClick={() => checkPromo(promoInput)}
                disabled={promoChecking || !promoInput.trim() || Boolean(appliedPromo)}
              >
                {promoChecking ? 'Проверяем…' : appliedPromo ? 'Применён' : 'Применить'}
              </button>
            </div>
            {promoError && <p className={styles.fieldError}>{promoError}</p>}
            {appliedPromo && (
              <p className={styles.promoOk}>
                Промокод {appliedPromo.code} применён: скидка{' '}
                {[
                  appliedPromo.discountPercent ? `${appliedPromo.discountPercent}%` : null,
                  appliedPromo.discountAmountKopecks
                    ? formatKopecks(appliedPromo.discountAmountKopecks)
                    : null,
                ]
                  .filter(Boolean)
                  .join(' + ')}
                {formatPromoDeadlineNote(appliedPromo.validUntil)
                  ? `. Ваша скидка действует ${formatPromoDeadlineNote(appliedPromo.validUntil)}.`
                  : '.'}
              </p>
            )}

            <label className={styles.checkRow}>
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
              />
              <span className={styles.checkText}>
                Хочу получать полезные материалы и предложения на email. Можно отписаться в
                любой момент.
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
                Я принимаю условия{' '}
                <Link to="/course/offer" target="_blank" className={styles.inlineLink}>
                  публичной оферты
                </Link>{' '}
                и{' '}
                <Link to="/course/privacy" target="_blank" className={styles.inlineLink}>
                  политики конфиденциальности
                </Link>
                .
              </span>
            </label>

            {error && <p className={styles.error}>{error}</p>}

            <button type="submit" className={styles.payBtn} disabled={!canSubmit}>
              {submitting ? 'Переходим к оплате…' : `Оплатить ${displayPrice}`}
            </button>

            <p className={styles.support}>
              Возникли вопросы? Напишите нам в Telegram{' '}
              <a
                className={styles.inlineLink}
                href={SUPPORT_TG}
                target="_blank"
                rel="noopener noreferrer"
              >
                @AnyFormsBot
              </a>
            </p>
          </form>

          <p className={styles.backWrap}>
            <Link className={styles.back} to={backToCourse}>
              ← Назад к курсу
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default CourseCheckout;
