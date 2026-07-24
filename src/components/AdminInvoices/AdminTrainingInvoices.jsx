import React from 'react';
import TrainingInvoices from './TrainingInvoices';
import styles from './AdminInvoices.module.css';

const AdminTrainingInvoices = () => (
  <div className={styles.wrap}>
    <h1 className={styles.title}>Счета на обучение</h1>
    <TrainingInvoices />
  </div>
);

export default AdminTrainingInvoices;
