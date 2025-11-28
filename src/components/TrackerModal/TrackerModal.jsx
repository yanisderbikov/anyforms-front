import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { setTracker } from '../../services/api';
import styles from './TrackerModal.module.css';

const TrackerModal = ({ leadId, onClose, onSuccess }) => {
  const [trackerValue, setTrackerValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const trimmedTracker = trackerValue.trim();
    
    if (!trimmedTracker) {
      setError('Поле трекера не может быть пустым');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await setTracker(leadId, trimmedTracker);
      
      if (result.success) {
        toast.success('Трекер успешно установлен!');
        onSuccess();
      } else {
        const errorMessage = result.error || 'Ошибка при установке трекера';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      const errorMessage = 'Ошибка при установке трекера';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error setting tracker:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Установить трекер</h2>
          <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Закрыть"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="tracker" className={styles.label}>
              Номер трекера
            </label>
            <input
              id="tracker"
              type="text"
              value={trackerValue}
              onChange={(e) => {
                setTrackerValue(e.target.value);
                setError('');
              }}
              placeholder="Введите номер трекера"
              className={`${styles.input} ${error ? styles.inputError : ''}`}
              disabled={loading}
              autoFocus
            />
            {error && <p className={styles.errorText}>{error}</p>}
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={loading}
            >
              Отмена
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || !trackerValue.trim()}
            >
              {loading ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TrackerModal;



