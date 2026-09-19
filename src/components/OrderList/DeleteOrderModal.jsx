import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { deleteRetailOrder } from '../../services/api';
import styles from './DeleteOrderModal.module.css';

const DeleteOrderModal = ({ order, onClose, onDeleted }) => {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const title = order.publicId ? `#${order.publicId}` : `сделка #${order.leadId}`;

  const handleDelete = async () => {
    if (!confirmed || loading) return;
    setError('');
    setLoading(true);
    try {
      await deleteRetailOrder(order.id);
      toast.success(`Заказ ${title} удалён`);
      onDeleted();
    } catch (e) {
      const message = e.message || 'Не удалось удалить заказ';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) onClose();
  };

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="delete-order-title">
        <div className={styles.modalHeader}>
          <h2 id="delete-order-title" className={styles.modalTitle}>удалить заказ {title}?</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Закрыть" disabled={loading}>
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.warning}>
            Это необратимо. Заказ исчезнет из розницы, восстановить его будет нельзя.
          </p>

          <div className={styles.orderInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>клиент</span>
              <span className={styles.infoValue}>
                {order.contactName || '-'}{order.contactPhone ? `, ${order.contactPhone}` : ''}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>товары</span>
              <ul className={styles.itemsList}>
                {(order.items || []).map((item, index) => (
                  <li key={index}>
                    {item.productName} × {item.quantity}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className={styles.detailsTitle}>что будет удалено</p>
          <ul className={styles.detailsList}>
            <li>сам заказ и все его позиции</li>
            <li>отметка о telegram-уведомлении по заказу</li>
            <li>платежи останутся в истории, но отвяжутся от заказа</li>
            <li>сделка в AmoCRM не изменится — при необходимости закройте её вручную</li>
          </ul>

          <label className={styles.confirmRow}>
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={loading}
            />
            <span>я понимаю, что заказ будет удалён безвозвратно</span>
          </label>

          {error && <p className={styles.errorText}>{error}</p>}

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={loading}>
              Отмена
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className={styles.deleteButton}
              disabled={!confirmed || loading}
            >
              {loading ? 'Удаляем...' : 'Удалить безвозвратно'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteOrderModal;
