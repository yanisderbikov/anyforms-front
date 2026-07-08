import React, { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import LandingHeader from '../shared/LandingHeader/LandingHeader';
import apiClient from '../../apiClient';
import {
  getPromoFromSearch,
  buildPassThroughQuery,
  formatPromoDeadline,
} from '../../shared/promoTracking';
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

// Простой, но строгий формат email.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Приводим ввод к российскому номеру и форматируем: +7 (999) 123-45-67.
const normalizePhoneDigits = (value) => {
  let digits = value.replace(/\D/g, '');
  if (digits.startsWith('8')) digits = `7${digits.slice(1)}`;
  if (digits && !digits.startsWith('7')) digits = `7${digits}`;
  return digits.slice(0, 11);
};

const formatRuPhone = (value) => {
  const digits = normalizePhoneDigits(value);
  if (!digits) return '';
  const rest = digits.slice(1); // 10 цифр после кода страны
  let out = '+7';
  if (rest.length > 0) out += ` (${rest.slice(0, 3)}`;
  if (rest.length >= 3) out += `) ${rest.slice(3, 6)}`;
  if (rest.length >= 6) out += `-${rest.slice(6, 8)}`;
  if (rest.length >= 8) out += `-${rest.slice(8, 10)}`;
  // Убираем «висящие» разделители в конце, иначе их нельзя стереть бэкспейсом.
  return out.replace(/[\s()-]+$/, '');
};

const isPhoneValid = (value) => normalizePhoneDigits(value).length === 11;

const CourseCheckout = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  // Обратные ссылки на лендинг сохраняют promo/utm из текущего URL.
  const backToCourse = `/course${buildPassThroughQuery(location.search)}`;
  const [plan, setPlan] = useState(
    searchParams.get('plan') === 'personal' ? 'personal' : 'self'
  );
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [touched, setTouched] = useState({ fullName: false, phone: false, email: false });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  const [promoChecking, setPromoChecking] = useState(false);

  const checkPromo = async (rawCode, planKey = plan) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;
    setPromoChecking(true);
    setPromoError('');
    try {
      const { data } = await apiClient.instance.get('/api/payment/promo-check', {
        params: { code, productCode: COURSE_PLANS[planKey].code },
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

  // Цена со скидкой зависит от тарифа — при его смене перепроверяем применённый код.
  const selectPlan = (planKey) => {
    if (planKey === plan) return;
    setPlan(planKey);
    if (appliedPromo) {
      checkPromo(appliedPromo.code, planKey);
    }
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
    touched.phone && !phoneValid ? 'Введите корректный номер: +7 (999) 123-45-67.' : '';
  const emailError =
    touched.email && !emailValid ? 'Введите корректный адрес, например you@example.com.' : '';

  const handlePhoneChange = (e) => {
    setPhone(formatRuPhone(e.target.value));
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
        phone: `+${normalizePhoneDigits(phone)}`,
        email: email.trim(),
        marketingConsent,
        returnUrl: `${window.location.origin}/course/success`,
        promoCode: appliedPromo ? appliedPromo.code : null,
      });
      if (data?.paymentUrl) {
        window.location.href = data.paymentUrl;
        return;
      }
      setError('Не удалось создать платёж. Попробуйте ещё раз.');
      setSubmitting(false);
    } catch (err) {
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
            {Object.entries(COURSE_PLANS).map(([key, p]) => (
              <button
                type="button"
                key={key}
                role="radio"
                aria-checked={plan === key}
                className={`${styles.planCard} ${plan === key ? styles.planCardActive : ''}`}
                onClick={() => selectPlan(key)}
              >
                <span className={styles.planName}>{p.label}</span>
                <span className={styles.planPrice}>{p.price}</span>
                <span className={styles.planNote}>{p.note}</span>
              </button>
            ))}
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
              placeholder="+7 (999) 123-45-67"
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
