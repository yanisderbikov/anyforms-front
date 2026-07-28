import React from 'react';
import YookassaReceipts from './YookassaReceipts';
import styles from './AdminInvoices.module.css';

const AdminYookassaReceipts = () => (
  <div className={`${styles.wrap} ${styles.wrapStack}`}>
    <h1 className={styles.title}>Чеки Юра</h1>
    <YookassaReceipts />
  </div>
);

export default AdminYookassaReceipts;
