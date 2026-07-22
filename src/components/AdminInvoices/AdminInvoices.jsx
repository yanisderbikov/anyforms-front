import React, { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../apiClient';
import styles from './AdminInvoices.module.css';

const initialForm = {
  name: '',
  phone: '',
  email: '',
  amount: '',
  description: '',
};

const STATUS_LABELS = {
  PENDING: 'Ожидает оплаты',
  SUCCEEDED: 'Оплачен',
  CANCELED: 'Отменён',
  REFUNDED: 'Возврат',
  FAILED: 'Ошибка',
};

const STATUS_CLASSES = {
  PENDING: 'statusPending',
  SUCCEEDED: 'statusPaid',
  CANCELED: 'statusCanceled',
  REFUNDED: 'statusCanceled',
  FAILED: 'statusCanceled',
};

const formatAmount = (kopecks) => {
  if (kopecks == null) return '—';
  return `${(kopecks / 100).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽`;
};

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const copyToClipboard = (text) => {
  navigator.clipboard
    .writeText(String(text))
    .then(() => toast.success('Ссылка на оплату скопирована', { position: 'top-right', duration: 1500 }))
    .catch(() => toast.error('Ошибка копирования'));
};

const AdminInvoices = () => {
  const [form, setForm] = useState(initialForm);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);
  const nameWrapRef = useRef(null);

  const authHeaders = () => {
    const token = apiClient.getToken ? apiClient.getToken() : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadInvoices = useCallback(async () => {
    try {
      const res = await apiClient.instance.get('/api/invoice/recent', {
        params: { limit: 5 },
        headers: authHeaders(),
      });
      setInvoices(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Не удалось загрузить счета');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvoices();
  }, [loadInvoices]);

  // Закрываем подсказки при клике вне поля ФИО.
  useEffect(() => {
    const onClickOutside = (e) => {
      if (nameWrapRef.current && !nameWrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const searchContacts = (q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!q || q.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await apiClient.instance.get('/api/orders/contacts/search', {
          params: { q: q.trim() },
          headers: authHeaders(),
        });
        const list = Array.isArray(res.data) ? res.data : [];
        setSuggestions(list);
        setShowSuggestions(list.length > 0);
      } catch {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'name') searchContacts(value);
  };

  const pickSuggestion = (s) => {
    setForm((prev) => ({
      ...prev,
      name: s.contactName || prev.name,
      phone: s.contactPhone || prev.phone,
    }));
    setShowSuggestions(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        amount: form.amount.trim(),
        description: form.description.trim(),
      };
      if (form.email.trim()) payload.email = form.email.trim();

      const res = await apiClient.instance.post('/api/invoice', payload, {
        headers: authHeaders(),
      });
      const invoice = res.data;
      if (invoice?.paymentUrl) copyToClipboard(invoice.paymentUrl);
      setForm(initialForm);
      await loadInvoices();
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Не удалось выставить счёт'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Выставить счёт</h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <label className={styles.label} ref={nameWrapRef}>
            ФИО *
            <div className={styles.suggestWrap}>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                className={styles.input}
                placeholder="Иванов Иван Иванович"
                autoComplete="off"
                required
              />
              {showSuggestions && (
                <ul className={styles.suggestList}>
                  {suggestions.map((s, i) => (
                    <li key={i}>
                      <button
                        type="button"
                        className={styles.suggestItem}
                        onClick={() => pickSuggestion(s)}
                      >
                        <span className={styles.suggestName}>{s.contactName || '—'}</span>
                        {s.contactPhone && <span className={styles.suggestPhone}>{s.contactPhone}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </label>
          <label className={styles.label}>
            Телефон * (уходит в чек)
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className={styles.input}
              placeholder="+79991234567"
              required
            />
          </label>
          <label className={styles.label}>
            Email (если нужно — чек уйдёт и на почту)
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={styles.input}
              placeholder="client@mail.ru"
            />
          </label>
          <label className={styles.label}>
            Сумма, ₽ *
            <input
              type="text"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              className={styles.input}
              placeholder="1190 или 1190,50"
              required
            />
          </label>
          <label className={styles.label}>
            Назначение платежа * (попадёт в чек как наименование товара)
            <input
              type="text"
              name="description"
              value={form.description}
              onChange={handleChange}
              className={styles.input}
              placeholder="Силиконовая форма по инд. размерам"
              required
            />
          </label>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.submit} disabled={saving}>
          {saving ? 'Выставляем…' : 'Выставить счёт'}
        </button>
        <p className={styles.hintText}>
          После выставления ссылка на оплату сразу скопируется в буфер обмена.
        </p>
      </form>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Последние счета</h2>
        {loading ? (
          <p className={styles.message}>Загрузка…</p>
        ) : invoices.length === 0 ? (
          <p className={styles.message}>Счетов пока нет.</p>
        ) : (
          <ul className={styles.list}>
            {invoices.map((inv) => (
              <li key={inv.externalPaymentId} className={styles.item}>
                <div className={styles.itemMain}>
                  <span className={styles.itemName}>{inv.contactName || '—'}</span>
                  <span className={`${styles.status} ${styles[STATUS_CLASSES[inv.status] || 'statusPending']}`}>
                    {STATUS_LABELS[inv.status] || inv.status}
                  </span>
                </div>
                <p className={styles.itemRow}>
                  <span className={styles.itemLabel}>Телефон:</span> {inv.contactPhone || '—'}
                  {inv.email && (
                    <>
                      {' '}· <span className={styles.itemLabel}>Email:</span> {inv.email}
                    </>
                  )}
                </p>
                <p className={styles.itemRow}>
                  <span className={styles.itemLabel}>Сумма:</span> {formatAmount(inv.amountKopecks)}
                  {' '}· <span className={styles.itemLabel}>Выставлен:</span> {formatDate(inv.createdAt)}
                </p>
                {inv.description && (
                  <p className={styles.itemRow}>
                    <span className={styles.itemLabel}>Назначение:</span> {inv.description}
                  </p>
                )}
                <p className={styles.itemRow}>
                  <span className={styles.itemLabel}>ID платежа:</span>{' '}
                  <code className={styles.itemId}>{inv.externalPaymentId}</code>
                </p>
                {inv.paymentUrl && (
                  <div className={styles.itemActions}>
                    <button
                      type="button"
                      className={styles.copyBtn}
                      onClick={() => copyToClipboard(inv.paymentUrl)}
                    >
                      Скопировать ссылку
                    </button>
                    <a
                      href={inv.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.link}
                    >
                      Открыть оплату
                    </a>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default AdminInvoices;
