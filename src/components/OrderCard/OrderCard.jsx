import React from 'react';
import { toast } from 'react-hot-toast';
import styles from './OrderCard.module.css';

const OrderCard = ({ order, onAddTracker }) => {
  const copyToClipboard = (text, message) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast.success(message, {
        position: 'top-right',
        duration: 2000,
      });
    }).catch(() => {
      toast.error('Ошибка при копировании');
    });
  };

  const handleCopyFIO = () => {
    copyToClipboard(order.contactName, 'ФИО скопировано');
  };

  const handleCopyPhone = () => {
    copyToClipboard(order.contactPhone, 'Телефон скопирован');
  };

  const handleCopyCdekPickupPoint = () => {
    copyToClipboard(order.pvzSdek, 'ПВЗ СДЭК скопирован');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
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
            <span className={styles.label}>ФИО:</span>
            <span 
              className={`${styles.value} ${styles.clickable}`}
              onClick={handleCopyFIO}
              title="Нажмите для копирования"
            >
              {order.contactName || '-'}
            </span>
          </div>
          <div className={styles.contactItem}>
            <span className={styles.label}>Телефон:</span>
            <span 
              className={`${styles.value} ${styles.clickable}`}
              onClick={handleCopyPhone}
              title="Нажмите для копирования"
            >
              {order.contactPhone || '-'}
            </span>
          </div>
          {order.pvzSdek && (
            <div className={styles.contactItem}>
              <span className={styles.label}>ПВЗ СДЭК:</span>
              <span 
                className={`${styles.value} ${styles.clickable}`}
                onClick={handleCopyCdekPickupPoint}
                title="Нажмите для копирования"
              >
                {order.pvzSdek}
              </span>
            </div>
          )}
          {order.purchaseDate && (
            <div className={styles.contactItem}>
              <span className={styles.label}>Дата оплаты:</span>
              <span className={styles.value}>
                {formatDate(order.purchaseDate)}
              </span>
            </div>
          )}
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
      </div>
    </div>
  );
};

export default OrderCard;




