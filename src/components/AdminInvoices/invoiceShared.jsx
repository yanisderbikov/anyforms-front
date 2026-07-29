import React from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../apiClient';
import styles from './AdminInvoices.module.css';

export const STATUS_LABELS = {
  PENDING: 'Ожидает оплаты',
  SUCCEEDED: 'Оплачен',
  CANCELED: 'Отменён',
  REFUNDED: 'Возврат',
  FAILED: 'Ошибка',
};

export const STATUS_CLASSES = {
  PENDING: 'statusPending',
  SUCCEEDED: 'statusPaid',
  CANCELED: 'statusCanceled',
  REFUNDED: 'statusCanceled',
  FAILED: 'statusCanceled',
};

export const formatAmount = (kopecks) => {
  if (kopecks == null) return '—';
  return `${(kopecks / 100).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽`;
};

export const formatDate = (value) => {
  if (!value) return '';
  // Бэк может отдавать Instant как epoch-секунды — переводим в миллисекунды.
  const date = typeof value === 'number' ? new Date(value * 1000) : new Date(value);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  });
};

export const copyToClipboard = (text) => {
  navigator.clipboard
    .writeText(String(text))
    .then(() => toast.success('Ссылка на оплату скопирована', { position: 'top-right', duration: 1500 }))
    .catch(() => toast.error('Ошибка копирования'));
};

export const authHeaders = () => {
  const token = apiClient.getToken ? apiClient.getToken() : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const RefreshButton = ({ onClick, refreshing, label }) => (
  <button
    type="button"
    className={styles.refreshBtn}
    onClick={onClick}
    disabled={refreshing}
    title={label}
    aria-label={label}
  >
    <svg
      className={refreshing ? styles.spinning : undefined}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M13.9 8a5.9 5.9 0 1 1-1.73-4.17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M13.9 1.6v2.8h-2.8"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
);
