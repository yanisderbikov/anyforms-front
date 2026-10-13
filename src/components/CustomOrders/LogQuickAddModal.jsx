import React, { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import ProductionLog from './ProductionLog';
import styles from './LogQuickAddModal.module.css';

// Быстрая запись в лог производства прямо с карточки: история + сразу открытое поле.
const LogQuickAddModal = ({ item, onClose }) => {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Закрыть">×</button>
        <span className={styles.title}>{item.productName || 'без названия'}</span>
        <ProductionLog
          item={item}
          startAdding
          onAdded={() => {
            toast.success('Записано');
            onClose();
          }}
        />
      </div>
    </div>
  );
};

export default LogQuickAddModal;
