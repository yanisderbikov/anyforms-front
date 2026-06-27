import React from 'react';
import { CUSTOM_STATUS_LABELS, CUSTOM_STATUS_STYLE, isImageFile, fileExt } from '../../services/customProducts';
import styles from './CustomItemCard.module.css';

const CustomItemCard = ({ item, onOpen, hideStatus }) => {
  const files = item.files || [];
  const first = files[0];

  // createdAt может прийти ISO-строкой, epoch-секундами или мс — приводим к мс.
  const createdMs = (() => {
    const v = item.createdAt;
    if (v == null) return null;
    if (typeof v === 'number') return v < 1e12 ? v * 1000 : v;
    const t = Date.parse(v);
    return Number.isNaN(t) ? null : t;
  })();
  // Подсветка по возрасту: ~4 недели на исполнение. 3 нед → жёлтый, 4 нед → красный.
  const weeksOld = createdMs != null ? (Date.now() - createdMs) / (7 * 24 * 3600 * 1000) : 0;
  const ageClass = weeksOld >= 4 ? styles.ageDanger : weeksOld >= 3 ? styles.ageWarn : '';

  return (
    <div className={`${styles.card} ${ageClass}`} onClick={onOpen}>
      <div className={styles.preview}>
        {first ? (
          isImageFile(first) ? (
            <>
              <img className={styles.previewBlur} src={first.url} alt="" aria-hidden="true" />
              <img className={styles.previewImg} src={first.url} alt="" loading="lazy" decoding="async" />
            </>
          ) : (
            <div className={styles.fileBox}>
              <span className={styles.fileExt}>{fileExt(first)}</span>
            </div>
          )
        ) : (
          <div className={styles.noPhoto}>нет файлов</div>
        )}

      </div>

      <div className={styles.body}>
        <span className={styles.name} title={item.productName}>{item.productName || 'без названия'}</span>
        {item.clientName && <span className={styles.client}>{item.clientName}</span>}
        <div className={styles.metaRow}>
          {!hideStatus && item.status && (
            <span className={styles.status} style={CUSTOM_STATUS_STYLE[item.status]}>
              {CUSTOM_STATUS_LABELS[item.status] || item.status}
            </span>
          )}
          <span className={styles.qty}>{item.quantity} шт</span>
        </div>
      </div>
    </div>
  );
};

export default CustomItemCard;
