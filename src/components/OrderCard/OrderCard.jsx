import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { syncOrder } from '../../services/api';
import styles from './OrderCard.module.css';

const OrderCard = ({ order, onAddTracker }) => {
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const result = await syncOrder(order.leadId);
      if (result.success) {
        toast.success(
          `Заказ синхронизирован. Товаров: ${result.itemsCount || order.items.length}`
        );
      } else {
        toast.error(result.error || 'Ошибка при синхронизации');
      }
    } catch (error) {
      toast.error('Ошибка при синхронизации заказа');
      console.error('Error syncing order:', error);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h3 className={styles.leadId}>Сделка #{order.leadId}</h3>
      </div>
      
      <div className={styles.cardBody}>
        <div className={styles.contactInfo}>
          <div className={styles.contactItem}>
            <span className={styles.label}>Контакт:</span>
            <span className={styles.value}>{order.contactName}</span>
          </div>
          <div className={styles.contactItem}>
            <span className={styles.label}>Телефон:</span>
            <span className={styles.value}>{order.contactPhone}</span>
          </div>
        </div>

        <div className={styles.itemsSection}>
          <h4 className={styles.itemsTitle}>Товары:</h4>
          <ul className={styles.itemsList}>
            {order.items.map((item, index) => (
              <li key={index} className={styles.item}>
                <span className={styles.itemName}>{item.productName}</span>
                <span className={styles.itemQuantity}>× {item.quantity}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <button
          onClick={onAddTracker}
          className={styles.addTrackerButton}
        >
          Добавить трекер
        </button>
        <button
          onClick={handleSync}
          disabled={syncing}
          className={styles.syncButton}
        >
          {syncing ? 'Синхронизация...' : 'Синхронизировать'}
        </button>
      </div>
    </div>
  );
};

export default OrderCard;



