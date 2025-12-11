import React from 'react';
import { toast } from 'react-hot-toast';
import styles from './OrderCard.module.css';

const OrderCard = ({ order, onAddTracker, onAddComment, onSync }) => {
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

  const handleLeadClick = () => {
    if (order.leadId) {
      const url = `https://hairdoskeels38.amocrm.ru/leads/detail/${order.leadId}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSync = () => {
    if (onSync && order.leadId) {
      onSync(order.leadId);
    }
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
        <h3 className={styles.leadId}>
          Сделка #{order.leadId}
        </h3>
        <div className={styles.headerButtons}>
          {onSync && (
            <button
              className={styles.refreshIcon}
              onClick={handleSync}
              title="Обновить сделку"
              aria-label="Обновить сделку"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 3V6H10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 13V10H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M11 5C10.2098 4.20979 9.1402 3.75 8 3.75C5.92893 3.75 4.25 5.42893 4.25 7.5C4.25 9.57107 5.92893 11.25 8 11.25C10.0711 11.25 11.75 9.57107 11.75 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M5 11C5.79021 11.7902 6.8598 12.25 8 12.25C10.0711 12.25 11.75 10.5711 11.75 8.5C11.75 6.42893 10.0711 4.75 8 4.75C5.92893 4.75 4.25 6.42893 4.25 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
          <button
            className={styles.linkIcon}
            onClick={handleLeadClick}
            title="Открыть сделку в AmoCRM"
            aria-label="Открыть сделку в AmoCRM"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.5 3.5H3.5C2.67157 3.5 2 4.17157 2 5V12.5C2 13.3284 2.67157 14 3.5 14H11C11.8284 14 12.5 13.3284 12.5 12.5V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 2H14V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 9L14 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
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
          {order.tracker && (
              <div className={styles.contactItem}>
                <span className={styles.label}>Трекер:</span>
                <span className={styles.value}>
                {order.tracker}
              </span>
              </div>
          )}
          {order.deliveryStatus && (
              <div className={styles.contactItem}>
                <span className={styles.label}>Статус доставки:</span>
                <span className={styles.value}>
                {order.deliveryStatus}
              </span>
              </div>
          )}
          {order.comment && (
              <div className={`${styles.contactItem} ${styles.commentItem}`}>
                <span className={styles.label}>Комментарий:</span>
                <span className={styles.value}>
                {order.comment}
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

      {(onAddTracker || onAddComment) && (
        <div className={styles.cardFooter}>
          {onAddTracker && (
            <button
              onClick={onAddTracker}
              className={styles.addTrackerButton}
            >
              Добавить трекер
            </button>
          )}
          {onAddComment && (
            <button
              onClick={onAddComment}
              className={styles.addTrackerButton}
            >
              Добавить комментарий
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderCard;
