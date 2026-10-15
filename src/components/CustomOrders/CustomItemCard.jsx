import React from 'react';
import { CUSTOM_STATUS_LABELS, CUSTOM_STATUS_STYLE, isImageFile, fileExt } from '../../services/customProducts';
import styles from './CustomItemCard.module.css';

// Дата может прийти ISO-строкой, epoch-секундами или мс — приводим к мс.
const toMs = (v) => {
  if (v == null) return null;
  if (typeof v === 'number') return v < 1e12 ? v * 1000 : v;
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : t;
};

// Сколько рабочих дней (пн–пт) прошло с даты до сегодня. Сб/вс не считаем.
const businessDaysSince = (ms) => {
  if (ms == null) return 0;
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let count = 0;
  while (d < today) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
};

const daysWord = (n) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'день';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'дня';
  return 'дней';
};

const CustomItemCard = ({ item, onOpen, onAddLog, hideStatus, showModeler }) => {
  const files = item.files || [];
  const first = files[0];

  // Подсветка по «застреванию» статуса: 5 рабочих дней → жёлтый, 7 → красный.
  const statusMs = toMs(item.statusUpdatedAt) ?? toMs(item.createdAt);
  const staleDays = item.status !== 'COMPLETED' ? businessDaysSince(statusMs) : 0;
  const ageClass = staleDays >= 7 ? styles.ageDanger : staleDays >= 5 ? styles.ageWarn : '';

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

        {staleDays >= 5 && (
          <span className={`${styles.staleBadge} ${staleDays >= 7 ? styles.staleBadgeDanger : ''}`}>
            {staleDays} {daysWord(staleDays)} без смены статуса
          </span>
        )}

        {item.nda && <span className={styles.ndaBadge}>NDA</span>}
      </div>

      <div className={styles.body}>
        <div className={styles.headRow}>
          <span className={styles.name} title={item.productName}>{item.productName || 'без названия'}</span>
          <span className={styles.qty}>{item.quantity} шт</span>
        </div>
        {item.clientName && <span className={styles.client}>{item.clientName}</span>}
        {showModeler && (
          <span className={styles.modeler}>
            моделит: {item.modeler || '—'}
          </span>
        )}
        {!hideStatus && item.status && (
          <div className={styles.metaRow}>
            <span className={styles.status} style={CUSTOM_STATUS_STYLE[item.status]}>
              {CUSTOM_STATUS_LABELS[item.status] || item.status}
            </span>
          </div>
        )}
        {onAddLog && item.status === 'IN_PRODUCTION' && (
          <button
            className={styles.logBtn}
            onClick={(e) => {
              e.stopPropagation();
              onAddLog();
            }}
          >
            добавить лог
          </button>
        )}
      </div>
    </div>
  );
};

export default CustomItemCard;
