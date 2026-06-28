import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './CustomTabs.module.css';

// Сегмент-переключатель: Заказы (наполнение) | Трекер (все позиции).
const CustomTabs = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isCreate = pathname.startsWith('/orders/custom/create');
  const isShip = pathname.startsWith('/orders/custom/ship');
  const isWork = !isCreate && !isShip;
  return (
    <div className={styles.tabs}>
      <button className={`${styles.tab} ${isWork ? styles.active : ''}`} onClick={() => navigate('/orders/custom')}>
        в работе
      </button>
      <button className={`${styles.tab} ${isCreate ? styles.active : ''}`} onClick={() => navigate('/orders/custom/create')}>
        создать
      </button>
      <button className={`${styles.tab} ${isShip ? styles.active : ''}`} onClick={() => navigate('/orders/custom/ship')}>
        к отправке
      </button>
    </div>
  );
};

export default CustomTabs;
