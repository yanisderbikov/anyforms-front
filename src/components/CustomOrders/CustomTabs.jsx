import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './CustomTabs.module.css';

// Сегмент-переключатель: Заказы (наполнение) | Трекер (все позиции).
const CustomTabs = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isCreate = pathname.startsWith('/orders/custom/create');
  return (
    <div className={styles.tabs}>
      <button className={`${styles.tab} ${!isCreate ? styles.active : ''}`} onClick={() => navigate('/orders/custom')}>
        в работе
      </button>
      <button className={`${styles.tab} ${isCreate ? styles.active : ''}`} onClick={() => navigate('/orders/custom/create')}>
        создать
      </button>
    </div>
  );
};

export default CustomTabs;
