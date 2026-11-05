import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowIcon, CopyIcon } from '../Marketplace/successIcons';
import { discountLabel, fillTemplate, formatValidUntil } from './promoPopupText';
import styles from './CoursePromoAfterPurchase.module.css';

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
    'Одноразовый',
    promo.phoneTail ? `только для номера …${promo.phoneTail}` : 'только для телефона и почты из этого заказа',
    until ? `действует по ${until}` : null,
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
    <div className={styles.frame}>
      <section className={styles.gift} aria-label="Скидка на курс">
        <div className={styles.offer}>
          <p className={styles.eyebrow}>Подарок к заказу</p>
          <span className={styles.amount}>−{discountLabel(template)}</span>
          <h2 className={styles.title}>{fillTemplate(promo.title, template)}</h2>
          {promo.description && <p className={styles.text}>{fillTemplate(promo.description, template)}</p>}
        </div>
        <div className={styles.actions}>
          <div className={styles.codeBox}>
            <span className={styles.code}>{promo.code}</span>
            <button type="button" className={styles.copy} onClick={copyCode}>
              <CopyIcon />
              {copied ? 'скопировано' : 'скопировать код'}
            </button>
          </div>
          <Link className={styles.open} to={path} {...openProps}>
            {promo.buttonText || 'Открыть курс со скидкой'}
            <ArrowIcon />
          </Link>
          <p className={styles.note}>{note}. По кнопке скидка применится сама.</p>
        </div>
      </section>
    </div>
  );
};

export default CoursePromoAfterPurchase;
