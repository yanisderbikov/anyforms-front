import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import LandingHeader from '../shared/LandingHeader/LandingHeader';
import apiClient from '../../apiClient';
import styles from '../GuideLanding/GuideCheckout.module.css';

const PRODUCT_CODE = 'COURSE';
const PRICE = '8 700 ₽';
const LAUNCH = '10 июля 2026';
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
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [touched, setTouched] = useState({ fullName: false, phone: false, email: false });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
        productCode: PRODUCT_CODE,
        fullName: fullName.trim(),
        phone: `+${normalizePhoneDigits(phone)}`,
        email: email.trim(),
        marketingConsent,
        returnUrl: `${window.location.origin}/course/success`,
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
          href: '/course',
          ariaLabel: 'anyforms — к курсу',
          src: '/anyforms-wordmark-white.svg',
          width: 152,
          height: 21,
        }}
        navLinks={[]}
        navAriaLabel="Разделы"
        rightItems={[
          { key: 'course', kind: 'link', to: '/course', label: 'К курсу', variant: 'pill' },
        ]}
        mobileMenuId="checkout-mobile-menu"
        mobileTopItems={[
          { key: 'course-m', kind: 'link', to: '/course', label: 'К курсу', variant: 'primary' },
        ]}
      />

      <main className={styles.main}>
        <div className={styles.inner}>
          <span className={styles.eyebrow}>Оформление</span>
          <h1 className={styles.title}>Предзаказ курса</h1>

          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryName}>
                Курс по производству силиконовых форм
              </span>
              <span className={styles.summaryPrice}>{PRICE}</span>
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
              {submitting ? 'Переходим к оплате…' : `Оплатить ${PRICE}`}
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
            <Link className={styles.back} to="/course">
              ← Назад к курсу
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default CourseCheckout;
