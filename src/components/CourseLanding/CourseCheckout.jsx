import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import LandingHeader from '../shared/LandingHeader/LandingHeader';
import apiClient from '../../apiClient';
import {
  getPromoFromSearch,
  buildPassThroughQuery,
  formatPromoDeadline,
  normalizePromoCode,
} from '../../shared/promoTracking';
import { EMAIL_RE, sanitizePhoneInput, isPhoneValid, toSubmitPhone } from '../../utils/phone';
import { readCheckoutContact, saveCheckoutContact } from '../../shared/checkoutContactStorage';
import styles from './CourseCheckout.module.css';

// Тарифы курса; code — продукт из payment_product на бэке.
export const COURSE_PLANS = {
  self: {
    code: 'COURSE',
    label: 'Самостоятельное изучение',
    price: '14 900 ₽',
    note: 'Записи курса и все материалы — навсегда',
  },
  personal: {
    code: 'COURSE_PERSONAL',
    label: 'Личное ведение',
    price: '69 000 ₽',
    note: 'Записи + ведение в течение месяца: разбор ошибок и обратная связь',
  },
};

const formatKopecks = (kopecks) =>
  `${Math.round(kopecks / 100).toLocaleString('ru-RU')} ₽`;
const LAUNCH = '1 сентября 2026';
const SUPPORT_TG = 'https://t.me/AnyFormsBot';

const CourseCheckout = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  // Обратные ссылки на лендинг сохраняют promo/utm из текущего URL.
  const backToCourse = `/course${buildPassThroughQuery(location.search)}`;
  const [plan, setPlan] = useState(
    searchParams.get('plan') === 'personal' ? 'personal' : 'self'
  );
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
  // Промокод проверяем сразу для обоих тарифов: {self: data, personal: data}.
  const [appliedPromos, setAppliedPromos] = useState({});
  const [promoError, setPromoError] = useState('');
  const [promoChecking, setPromoChecking] = useState(false);

  const appliedPromo = appliedPromos[plan] || null;

  useEffect(() => {
    saveCheckoutContact({ fullName, phone, email });
  }, [fullName, phone, email]);

  const checkPromo = async (rawCode) => {
    const code = normalizePromoCode(rawCode);
    if (!code) return;
    setPromoChecking(true);
    setPromoError('');
    try {
      const entries = await Promise.all(
        Object.entries(COURSE_PLANS).map(async ([key, p]) => {
          try {
            const { data } = await apiClient.instance.get('/api/payment/promo-check', {
              params: { code, productCode: p.code },
            });
            return [key, data];
          } catch {
            return [key, undefined];
          }
        })
      );
      const valid = Object.fromEntries(
        entries.filter(([, data]) => data?.valid)
      );
      if (Object.keys(valid).length > 0) {
        setAppliedPromos(valid);
        setPromoInput((valid[plan] || Object.values(valid)[0]).code);
      } else {
        setAppliedPromos({});
        const allFailed = entries.every(([, data]) => data === undefined);
        const activeData = entries.find(([key]) => key === plan)?.[1];
        setPromoError(
          allFailed
            ? 'Не удалось проверить промокод. Попробуйте ещё раз.'
            : activeData?.message || 'Промокод не подошёл.'
        );
      }
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

  // Скидки для обоих тарифов уже загружены — при смене тарифа перепроверять не нужно.
  const selectPlan = (planKey) => {
    if (planKey === plan) return;
    setPlan(planKey);
  };

  const activePlan = COURSE_PLANS[plan];
  const displayPrice = appliedPromo
    ? formatKopecks(appliedPromo.discountedPriceKopecks)
    : activePlan.price;

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
        productCode: activePlan.code,
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
      <LandingHeader
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
          <h1 className={styles.title}>Предзаказ курса</h1>

          <div className={styles.planPicker} role="radiogroup" aria-label="Тариф курса">
            {Object.entries(COURSE_PLANS).map(([key, p]) => {
              const planPromo = appliedPromos[key];
              return (
                <button
                  type="button"
                  key={key}
                  role="radio"
                  aria-checked={plan === key}
                  className={`${styles.planCard} ${plan === key ? styles.planCardActive : ''}`}
                  onClick={() => selectPlan(key)}
                >
                  <span className={styles.planName}>{p.label}</span>
                  {planPromo ? (
                    <span className={styles.planPriceRow}>
                      <span className={styles.planPriceOld}>
                        {formatKopecks(planPromo.priceKopecks)}
                      </span>
                      <span className={styles.planPrice}>
                        {formatKopecks(planPromo.discountedPriceKopecks)}
                      </span>
                    </span>
                  ) : (
                    <span className={styles.planPrice}>{p.price}</span>
                  )}
                  <span className={styles.planNote}>{p.note}</span>
                </button>
              );
            })}
          </div>

          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryName}>
                Курс по производству силиконовых форм · {activePlan.label}
              </span>
              <span className={styles.summaryPriceCol}>
                {appliedPromo && (
                  <span className={styles.summaryPriceOld}>
                    {formatKopecks(appliedPromo.priceKopecks)}
                  </span>
                )}
                <span className={styles.summaryPrice}>{displayPrice}</span>
              </span>
            </div>
            <p className={styles.summaryNote}>
              Это предзаказ. Доступ к курсу откроется {LAUNCH} — ссылку пришлём на
              указанную почту. Сразу после оплаты отправим письмо-подтверждение.
            </p>
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
                  setAppliedPromos({});
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
                Промокод {appliedPromo.code} применён: скидка {appliedPromo.discountPercent}%
                {formatPromoDeadline(appliedPromo.validUntil)
                  ? `. Ваша скидка действует до ${formatPromoDeadline(appliedPromo.validUntil)}.`
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
