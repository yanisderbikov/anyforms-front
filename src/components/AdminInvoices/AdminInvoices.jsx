import React from 'react';
import ManualInvoice from './ManualInvoice';
import styles from './AdminInvoices.module.css';

const AdminInvoices = () => (
  <div className={styles.wrap}>
    <h1 className={styles.title}>Выставить счёт</h1>
    <ManualInvoice />
  </div>
);

export default AdminInvoices;
