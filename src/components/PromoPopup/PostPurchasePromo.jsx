import React, { useState } from 'react';
import { fillTemplate, formatValidUntil, minOrderLabel } from './promoPopupText';
import styles from './PostPurchasePromo.module.css';

const PostPurchasePromo = ({ promo, onCopy }) => {
  const [copied, setCopied] = useState(false);
  if (!promo?.code) return null;

  const template = { ...promo, codeValidUntil: promo.validUntil };
  const until = formatValidUntil(promo.validUntil);
  const note = [
    'Код одноразовый',
    until ? `действует по ${until} включительно` : null,
    promo.minOrderKopecks ? `для заказов от ${minOrderLabel(promo.minOrderKopecks)}` : null,
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

  return (
    <section className={styles.card} aria-label="Промокод на следующий заказ">
      <p className={styles.eyebrow}>Промокод на следующий заказ</p>
      <h2 className={styles.title}>{fillTemplate(promo.title, template)}</h2>
      {promo.description && <p className={styles.text}>{fillTemplate(promo.description, template)}</p>}
      <button type="button" className={styles.codeBox} onClick={copyCode} aria-label="Скопировать промокод">
        <span className={styles.code}>{promo.code}</span>
        <span className={styles.copy}>{copied ? 'скопировано' : promo.buttonText || 'скопировать'}</span>
      </button>
      <p className={styles.note}>{note}. Введите его в поле «Промокод» при следующем оформлении заказа.</p>
    </section>
  );
};

export default PostPurchasePromo;
