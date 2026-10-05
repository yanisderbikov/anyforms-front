import React, { useEffect, useId, useRef, useState } from 'react';
import { LEGAL_LINKS } from '../../shared/seller';
import { EMAIL_RE, sanitizePhoneInput, isPhoneValid, toSubmitPhone } from '../../utils/phone';
import {
  conditionsLine,
  discountLabel,
  fillTemplate,
  formatValidUntil,
  minOrderLabel,
  publicConditionsLine,
} from './promoPopupText';
import styles from './PromoPopup.module.css';

const PREVIEW_RESULT = {
  code: 'SHOP-7KX2M',
  repeated: false,
};

const PREVIEW_UNIQUE_RESULT = {
  code: 'ONE-7KX2M',
  repeated: false,
};

const previewValidUntil = (days) => new Date(Date.now() + (days || 14) * 86400000).toISOString();

const PromoPopup = ({
  popup,
  mode = 'live',
  previewState = 'form',
  previewError = 'Скидка действует только на первый заказ, а у вас уже есть заказы в нашем магазине.',
  onSubmit,
  onClose,
  onCopy,
  onTakeCode,
  issued,
}) => {
  const isPreview = mode === 'preview';
  const isPublicCode = popup?.popupType === 'PUBLIC_CODE';
  const isUniqueCode = popup?.popupType === 'UNIQUE_CODE';
  const titleId = useId();
  const cardRef = useRef(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [consentPd, setConsentPd] = useState(false);
  const [consentAds, setConsentAds] = useState(false);
  const [website, setWebsite] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [taken, setTaken] = useState(false);

  useEffect(() => {
    if (isPreview) return undefined;
    cardRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [isPreview, onClose]);

  const phoneValid = isPhoneValid(phone);
  const emailValid = EMAIL_RE.test(email.trim());
  const canSubmit = phoneValid && emailValid && consentPd && consentAds && !submitting;

  const shownResult = isPreview
    ? previewState === 'success'
      ? { ...PREVIEW_RESULT, validUntil: previewValidUntil(popup?.codeTtlDays) }
      : null
    : result;
  const shownError = isPreview ? (previewState === 'error' ? previewError : '') : error;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (isPreview || !canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const data = await onSubmit({
        phone: toSubmitPhone(phone),
        email: email.trim(),
        consentPersonalData: consentPd,
        consentAdvertising: consentAds,
        website,
      });
      setResult(data);
    } catch (err) {
      setError(err?.message || 'Не удалось получить промокод. Попробуйте ещё раз.');
    } finally {
      setSubmitting(false);
    }
  };

  const uniqueResult = isPreview
    ? { ...PREVIEW_UNIQUE_RESULT, validUntil: previewValidUntil(popup?.codeTtlDays) }
    : issued;

  const copyCode = async (code) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      onCopy?.(code);
    } catch {
      setCopied(false);
    }
  };

  const handleTakeCode = async () => {
    const code = popup?.code;
    if (!code) return;
    setTaken(true);
    if (!taken) onTakeCode?.(code);
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const successNote = (data) => {
    let intro;
    if (isUniqueCode) {
      intro = data.repeated ? 'Этот код уже выдан вашему устройству.' : 'Код одноразовый — его можно применить к одному заказу.';
    } else {
      intro = data.repeated ? 'Этот код мы уже выдавали вам раньше.' : 'Мы отправили код на вашу почту.';
    }
    const until = formatValidUntil(data.validUntil);
    return [intro, until ? `Действует по ${until} включительно.` : '', 'При оформлении заказа он подставится сам.']
      .filter(Boolean)
      .join(' ');
  };

  const discount = discountLabel(popup);
  const publicConditions = publicConditionsLine(popup);
  const conditions = conditionsLine(popup);
  const uniqueConditions = [
    popup?.firstOrderOnly ? 'на первый заказ' : null,
    popup?.minOrderKopecks ? `для заказов от ${minOrderLabel(popup.minOrderKopecks)}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
  const phoneError = touched && !phoneValid ? 'Проверьте номер телефона.' : '';
  const emailError = touched && !emailValid ? 'Проверьте адрес почты.' : '';
  const consentError = touched && (!consentPd || !consentAds) ? 'Отметьте оба согласия, чтобы получить скидку.' : '';

  return (
    <div className={isPreview ? styles.frame : styles.overlay}>
      <div className={styles.stage}>
        <div className={styles.backdrop} onClick={isPreview ? undefined : onClose} aria-hidden="true" />
        <div
          ref={cardRef}
          className={styles.card}
          role="dialog"
          aria-modal={isPreview ? undefined : 'true'}
          aria-labelledby={titleId}
          tabIndex={-1}
        >
          <button type="button" className={styles.close} onClick={onClose} aria-label="Закрыть">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          {discount && <div className={styles.badge}>−{discount}</div>}

          {isPublicCode ? (
            <div className={styles.body}>
              <h2 id={titleId} className={styles.title}>
                {fillTemplate(popup?.title, popup)}
              </h2>
              {popup?.description && <p className={styles.text}>{fillTemplate(popup.description, popup)}</p>}
              <button type="button" className={styles.codeBox} onClick={handleTakeCode} aria-label="Скопировать промокод">
                <span className={styles.code}>{popup?.code || 'PROMO'}</span>
                <span className={styles.codeHint}>
                  {taken
                    ? copied
                      ? 'скопировано · подставится при оформлении заказа'
                      : 'подставится при оформлении заказа'
                    : 'нажмите, чтобы скопировать'}
                </span>
              </button>
              {publicConditions && <p className={styles.note}>Промокод {publicConditions}.</p>}
              <button type="button" className={styles.submit} onClick={taken ? onClose : handleTakeCode}>
                {taken ? 'Продолжить покупки' : popup?.buttonText}
              </button>
            </div>
          ) : isUniqueCode ? (
            <div className={styles.body}>
              <h2 id={titleId} className={styles.title}>
                {fillTemplate(popup?.title, popup)}
              </h2>
              {popup?.description && <p className={styles.text}>{fillTemplate(popup.description, popup)}</p>}
              {uniqueResult && (
                <>
                  <button
                    type="button"
                    className={styles.codeBox}
                    onClick={() => copyCode(uniqueResult.code)}
                    aria-label="Скопировать промокод"
                  >
                    <span className={styles.code}>{uniqueResult.code}</span>
                    <span className={styles.codeHint}>{copied ? 'скопировано' : 'нажмите, чтобы скопировать'}</span>
                  </button>
                  <p className={styles.note}>{successNote(uniqueResult)}</p>
                </>
              )}
              <button type="button" className={styles.submit} onClick={onClose}>
                {popup?.buttonText || 'Продолжить покупки'}
              </button>
              {uniqueConditions && <p className={styles.fine}>Скидка {uniqueConditions}</p>}
            </div>
          ) : shownResult ? (
            <div className={styles.body}>
              <h2 id={titleId} className={styles.title}>
                {fillTemplate(popup?.successTitle, popup)}
              </h2>
              {popup?.successText && <p className={styles.text}>{fillTemplate(popup.successText, popup)}</p>}
              <button
                type="button"
                className={styles.codeBox}
                onClick={() => copyCode(shownResult.code)}
                aria-label="Скопировать промокод"
              >
                <span className={styles.code}>{shownResult.code}</span>
                <span className={styles.codeHint}>{copied ? 'скопировано' : 'нажмите, чтобы скопировать'}</span>
              </button>
              <p className={styles.note}>{successNote(shownResult)}</p>
              <button type="button" className={styles.submit} onClick={onClose}>
                Продолжить покупки
              </button>
            </div>
          ) : (
            <form className={styles.body} onSubmit={handleSubmit} noValidate>
              <h2 id={titleId} className={styles.title}>
                {fillTemplate(popup?.title, popup)}
              </h2>
              {popup?.description && <p className={styles.text}>{fillTemplate(popup.description, popup)}</p>}

              <div className={styles.fields}>
                <input
                  className={`${styles.input} ${phoneError ? styles.inputError : ''}`}
                  type="tel"
                  name="phone"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="Телефон"
                  aria-label="Телефон"
                  value={phone}
                  onChange={(e) => setPhone(sanitizePhoneInput(e.target.value))}
                />
                <input
                  className={`${styles.input} ${emailError ? styles.inputError : ''}`}
                  type="email"
                  name="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="Почта"
                  aria-label="Почта"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <input
                  className={styles.trap}
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>

              <label className={styles.check}>
                <input type="checkbox" checked={consentPd} onChange={(e) => setConsentPd(e.target.checked)} />
                <span>
                  Даю{' '}
                  <a href={LEGAL_LINKS.consent} target="_blank" rel="noopener noreferrer">
                    согласие на обработку персональных данных
                  </a>{' '}
                  в соответствии с{' '}
                  <a href={LEGAL_LINKS.privacy} target="_blank" rel="noopener noreferrer">
                    политикой
                  </a>
                </span>
              </label>
              <label className={styles.check}>
                <input type="checkbox" checked={consentAds} onChange={(e) => setConsentAds(e.target.checked)} />
                <span>
                  Даю{' '}
                  <a href={LEGAL_LINKS.adConsent} target="_blank" rel="noopener noreferrer">
                    согласие на получение рекламы
                  </a>{' '}
                  по почте, SMS и в мессенджерах
                </span>
              </label>

              {(phoneError || emailError || consentError || shownError) && (
                <p className={styles.error} role="alert">
                  {shownError || phoneError || emailError || consentError}
                </p>
              )}

              <button type="submit" className={styles.submit} disabled={submitting}>
                {submitting ? 'Получаем код…' : popup?.buttonText}
              </button>
              {conditions && <p className={styles.fine}>Скидка {conditions}</p>}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromoPopup;
