import React, { useEffect, useRef, useState } from 'react';
import { CUSTOM_STATUSES, CUSTOM_STATUS_LABELS, CUSTOM_STATUS_STYLE } from '../../services/customProducts';
import styles from './StatusFilter.module.css';

// Плашка-фильтр по статусу под поиском. value=null → показываем все.
// Цвет плашки совпадает с цветом статуса. Клик открывает выбор другого статуса
// либо «показать все» (сброс фильтра).
const StatusFilter = ({ value, onChange }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const pick = (val) => {
    onChange(val);
    setOpen(false);
  };

  const triggerStyle = value ? CUSTOM_STATUS_STYLE[value] : undefined;

  return (
    <div className={styles.root} ref={rootRef}>
      <button
        type="button"
        className={`${styles.pill} ${value ? '' : styles.pillAll}`}
        style={triggerStyle}
        onClick={() => setOpen((v) => !v)}
      >
        <span className={styles.pillLabel}>{value ? CUSTOM_STATUS_LABELS[value] || value : 'все статусы'}</span>
        <span className={styles.caret}>▾</span>
      </button>

      {open && (
        <div className={styles.popover}>
          {CUSTOM_STATUSES.map((s) => (
            <button
              type="button"
              key={s.value}
              className={`${styles.option} ${s.value === value ? styles.active : ''}`}
              onClick={() => pick(s.value)}
            >
              <span className={styles.dot} style={{ background: CUSTOM_STATUS_STYLE[s.value]?.color }} />
              {s.label}
            </button>
          ))}
          {value && (
            <button type="button" className={`${styles.option} ${styles.reset}`} onClick={() => pick(null)}>
              показать все
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default StatusFilter;
