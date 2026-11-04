import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { fillTemplate, formatValidUntil } from './promoPopupText';
import styles from './PostPurchasePromo.module.css';
import courseStyles from './CoursePromoAfterPurchase.module.css';

export const COURSE_LANDING_PATH = '/course';

export const buildCoursePromoPath = (code) =>
  `${COURSE_LANDING_PATH}?promo=${encodeURIComponent(code)}`;

const CoursePromoAfterPurchase = ({ promo, onCopy, onOpen, preview = false }) => {
  const [copied, setCopied] = useState(false);
  if (!promo?.code) return null;

  const template = {
    ...promo,
    discountPercent: 0,
    discountAmountKopecks: promo.discountKopecks,
    codeValidUntil: promo.validUntil,
  };
  const path = buildCoursePromoPath(promo.code);
  const until = formatValidUntil(promo.validUntil);
  const note = [
    'Код одноразовый',
    promo.phoneTail
      ? `только для номера телефона из этого заказа (…${promo.phoneTail})`
      : 'только для телефона и почты из этого заказа',
    until ? `действует по ${until} включительно` : null,
  ]
    .filter(Boolean)
    .join(', ');

  const copyCode = async () => {
    onCopy?.(promo.code);
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const openProps = preview
    ? { onClick: (e) => e.preventDefault() }
    : { onClick: () => onOpen?.(promo.code) };

  return (
    <section className={styles.card} aria-label="Скидка на курс">
      <p className={styles.eyebrow}>Бонус к покупке</p>
      <h2 className={styles.title}>{fillTemplate(promo.title, template)}</h2>
      {promo.description && <p className={styles.text}>{fillTemplate(promo.description, template)}</p>}
      <button type="button" className={styles.codeBox} onClick={copyCode} aria-label="Скопировать промокод">
        <span className={styles.code}>{promo.code}</span>
        <span className={styles.copy}>{copied ? 'скопировано' : 'скопировать'}</span>
      </button>
      <Link className={courseStyles.open} to={path} {...openProps}>
        {promo.buttonText || 'Открыть курс со скидкой'}
      </Link>
      <p className={styles.note}>{note}. По кнопке скидка применится сама.</p>
    </section>
  );
};

export default CoursePromoAfterPurchase;
