import React, { useState } from 'react';
import { discountLabel, fillTemplate, formatValidUntil, minOrderLabel } from './promoPopupText';
import styles from './PostPurchasePromo.module.css';

const PostPurchasePromo = ({ promo, onCopy }) => {
  const [copied, setCopied] = useState(false);
  if (!promo?.code) return null;

  const template = { ...promo, codeValidUntil: promo.validUntil };
  const discount = discountLabel(promo);
  const until = formatValidUntil(promo.validUntil);
  const conditions = [
    promo.minOrderKopecks ? `для заказов от ${minOrderLabel(promo.minOrderKopecks)}` : null,
    'работает только с телефоном или почтой из этого заказа',
  ]
    .filter(Boolean)
    .join(' · ');

  const copyCode = async () => {
    onCopy?.(promo.code);
    try {
      await navigator.clipboard.writeText(promo.code);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className={styles.card} aria-label="Промокод на следующий заказ">
      <p className={styles.eyebrow}>Промокод на следующий заказ</p>
      {discount && <div className={styles.badge}>−{discount}</div>}
      <h2 className={styles.title}>{fillTemplate(promo.title, template)}</h2>
      {promo.description && <p className={styles.text}>{fillTemplate(promo.description, template)}</p>}
      <button type="button" className={styles.codeBox} onClick={copyCode} aria-label="Скопировать промокод">
        <span className={styles.code}>{promo.code}</span>
        <span className={styles.codeHint}>{copied ? 'скопировано' : 'нажмите, чтобы скопировать'}</span>
      </button>
      <p className={styles.note}>
        Код одноразовый{until ? ` и действует по ${until} включительно` : ''}. Введите его в поле «Промокод» при
        следующем оформлении заказа.
      </p>
      <button type="button" className={styles.button} onClick={copyCode}>
        {copied ? 'Скопировано' : promo.buttonText || 'Скопировать промокод'}
      </button>
      <p className={styles.fine}>Скидка {conditions}</p>
    </section>
  );
};

export default PostPurchasePromo;
