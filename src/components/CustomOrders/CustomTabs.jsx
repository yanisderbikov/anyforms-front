import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './CustomTabs.module.css';

// Сегмент-переключатель: Заказы (наполнение) | Трекер (все позиции).
const CustomTabs = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isTracker = pathname.startsWith('/orders/custom/tracker');
  return (
    <div className={styles.tabs}>
      <button className={`${styles.tab} ${!isTracker ? styles.active : ''}`} onClick={() => navigate('/orders/custom')}>
        заказы
      </button>
      <button className={`${styles.tab} ${isTracker ? styles.active : ''}`} onClick={() => navigate('/orders/custom/tracker')}>
        трекер
      </button>
    </div>
  );
};

export default CustomTabs;
