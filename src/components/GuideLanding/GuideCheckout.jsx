import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import LandingHeader from '../shared/LandingHeader/LandingHeader';
import apiClient from '../../apiClient';
import { EMAIL_RE, sanitizePhoneInput, isPhoneValid, toSubmitPhone } from '../../utils/phone';
import { readCheckoutContact, saveCheckoutContact } from '../../shared/checkoutContactStorage';
import styles from './GuideCheckout.module.css';

const PRODUCT_CODE = 'GUIDE';
const PRICE = '1490 ₽';
const SUPPORT_TG = 'https://t.me/AnyFormsBot';

const GuideCheckout = () => {
  // Контакты общие для всех чекаутов: заполнял магазин или курс — подставятся и здесь.
  const savedContact = useMemo(() => readCheckoutContact() || {}, []);

  const [fullName, setFullName] = useState(savedContact.fullName || '');
  const [phone, setPhone] = useState(savedContact.phone || '');
  const [email, setEmail] = useState(savedContact.email || '');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [touched, setTouched] = useState({ fullName: false, phone: false, email: false });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    saveCheckoutContact({ fullName, phone, email });
  }, [fullName, phone, email]);

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
        productCode: PRODUCT_CODE,
        fullName: fullName.trim(),
        phone: toSubmitPhone(phone),
        email: email.trim(),
        marketingConsent,
        returnUrl: `${window.location.origin}/guide/success`,
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
          href: '/guide',
          ariaLabel: 'anyforms — к гайду',
          src: '/anyforms-wordmark-white.svg',
          width: 152,
          height: 21,
        }}
        navLinks={[]}
        navAriaLabel="Разделы"
        rightItems={[
          { key: 'guide', kind: 'link', to: '/guide', label: 'К гайду', variant: 'pill' },
        ]}
        mobileMenuId="checkout-mobile-menu"
        mobileTopItems={[
          { key: 'guide-m', kind: 'link', to: '/guide', label: 'К гайду', variant: 'primary' },
        ]}
      />

      <main className={styles.main}>
        <div className={styles.inner}>
          <span className={styles.eyebrow}>Оформление</span>
          <h1 className={styles.title}>Оплата гайда</h1>

          <div className={styles.summary}>
            <div className={styles.summaryRow}>
              <span className={styles.summaryName}>
                Гайд «Как продавать сложный продукт через короткие видео»
              </span>
              <span className={styles.summaryPrice}>{PRICE}</span>
            </div>
            <p className={styles.summaryNote}>
              Доступ придёт на указанную почту сразу после оплаты.
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
              <p className={styles.hint}>На этот адрес мы пришлём гайд.</p>
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
                <Link to="/guide/offer" target="_blank" className={styles.inlineLink}>
                  публичной оферты
                </Link>{' '}
                и{' '}
                <Link to="/guide/privacy" target="_blank" className={styles.inlineLink}>
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
            <Link className={styles.back} to="/guide">
              ← Назад к гайду
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
};

export default GuideCheckout;
