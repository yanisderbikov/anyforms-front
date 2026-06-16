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

  const handleCopyCdekStreet = () => {
    copyToClipboard(order.pvzSdekStreet, 'ПВЗ СДЭК улица скопировано');
  };

  const handleCopyCdekCity = () => {
    copyToClipboard(order.pvzSdekCity, 'ПВЗ СДЭК город скопирован');
  };

  const handleLeadClick = () => {
    if (order.leadId) {
      const url = `https://anyforms.amocrm.ru/leads/detail/${order.leadId}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSync = () => {
    if (onSync && order.leadId) {
      onSync(order.leadId);
    }
  };

  const formatDate = (dateInput) => {
    if (dateInput == null || dateInput === '') return '-';
    try {
      // Массив от API: [year, month, day, hour, min] или [year, month, day, hour, min, sec] (month 1–12)
      const parts = Array.isArray(dateInput)
        ? dateInput.map(Number)
        : String(dateInput).split(',').map(Number);
      if (parts.length >= 3 && parts.every((n) => !Number.isNaN(n))) {
        const [year, month, day, hour = 0, min = 0, sec = 0] = parts;
        // Date.UTC использует месяц 0–11
        const utcMs = Date.UTC(year, month - 1, day, hour, min, sec);
        const date = new Date(utcMs);
        return date.toLocaleDateString('ru-RU', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      }
      // Fallback: попытка парсить как ISO или другой стандартный формат
      const date = new Date(dateInput);
      if (Number.isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '-';
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 12a9 9 0 1 1-2.64-6.36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 3v5h-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
          {order.pvzSdekStreet && (
            <div className={styles.contactItem}>
              <span className={styles.label}>ПВЗ СДЭК улица:</span>
              <span 
                className={`${styles.value} ${styles.clickable}`}
                onClick={handleCopyCdekStreet}
                title="Нажмите для копирования"
              >
                {order.pvzSdekStreet}
              </span>
            </div>
          )}
          {order.pvzSdekCity && (
              <div className={styles.contactItem}>
                <span className={styles.label}>ПВЗ СДЭК город:</span>
                <span
                    className={`${styles.value} ${styles.clickable}`}
                    onClick={handleCopyCdekCity}
                    title="Нажмите для копирования"
                >
                {order.pvzSdekCity}
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
