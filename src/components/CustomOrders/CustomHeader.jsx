import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CustomHeader.module.css';

// Чёрная фиксированная шапка под-заказов: лого по центру + «← розница».
const CustomHeader = () => {
  const navigate = useNavigate();
  return (
    <>
      <div className={styles.headerSafeArea} aria-hidden="true" />
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button className={styles.retail} onClick={() => navigate('/orders/without-tracker')}>
            ← розница
          </button>
          <span className={styles.logoLink} onClick={() => navigate('/orders/custom')} role="button" aria-label="AnyForms">
            <img className={styles.logo} src="/anyforms_logo_new_white.svg" alt="AnyForms" width={180} height={41} decoding="async" />
          </span>
        </div>
      </header>
    </>
  );
};

export default CustomHeader;
