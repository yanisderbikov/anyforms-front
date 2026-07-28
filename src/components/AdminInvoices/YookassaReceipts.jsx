import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../apiClient';
import { EMAIL_RE } from '../../utils/phone';
import { formatAmount, formatDate, authHeaders, RefreshButton } from './invoiceShared';
import styles from './AdminInvoices.module.css';

const PRODUCT_LABELS = {
  GUIDE: 'Гайд',
  COURSE: 'Курс — самостоятельное изучение',
  COURSE_PERSONAL: 'Курс — личное ведение',
};

const TASK_STATUS = {
  NEW: { label: 'Отправляется', className: 'statusPending' },
  RUNNING: { label: 'Отправляется', className: 'statusPending' },
  DONE: { label: 'Отправлен', className: 'statusPaid' },
  FAILED: { label: 'Ошибка', className: 'statusCanceled' },
};

const LINK_RE = /^https?:\/\//;

const initialForm = { email: '', link: '' };

const YookassaReceipts = () => {
  const [form, setForm] = useState(initialForm);
  const [tasks, setTasks] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [links, setLinks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingId, setSendingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [tasksRes, txRes] = await Promise.all([
        apiClient.instance.get('/api/receipt/recent', { params: { limit: 20 }, headers: authHeaders() }),
        apiClient.instance.get('/api/receipt/transactions', { params: { limit: 50 }, headers: authHeaders() }),
      ]);
      setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      setTransactions(Array.isArray(txRes.data) ? txRes.data : []);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Не удалось загрузить данные'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  };

  const sendReceipt = async (email, link) => {
    await apiClient.instance.post('/api/receipt/send', { email, link }, { headers: authHeaders() });
    toast.success('Чек поставлен в очередь — письмо уйдёт в течение минуты');
    await load();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!EMAIL_RE.test(form.email.trim())) {
      setError('Некорректный email');
      return;
    }
    if (!LINK_RE.test(form.link.trim())) {
      setError('Ссылка на чек должна начинаться с http(s)://');
      return;
    }
    setSaving(true);
    try {
      await sendReceipt(form.email.trim(), form.link.trim());
      setForm(initialForm);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Не удалось отправить чек'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCardSend = async (t) => {
    const link = (links[t.externalPaymentId] || '').trim();
    if (!LINK_RE.test(link)) {
      toast.error('Вставьте ссылку на чек (начинается с http(s)://)');
      return;
    }
    setSendingId(t.externalPaymentId);
    try {
      await sendReceipt(t.email, link);
      setLinks((prev) => ({ ...prev, [t.externalPaymentId]: '' }));
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Не удалось отправить чек'
      );
    } finally {
      setSendingId(null);
    }
  };

  // Кому чек уже отправляли — по email в списке последних тасок.
  const sentEmails = new Set(tasks.map((t) => (t.email || '').toLowerCase()).filter(Boolean));

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <label className={styles.label}>
            Email *
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className={styles.input}
              placeholder="client@mail.ru"
              required
            />
          </label>
          <label className={styles.label}>
            Ссылка на чек *
            <input
              type="url"
              name="link"
              value={form.link}
              onChange={handleChange}
              className={styles.input}
              placeholder="https://…"
              required
            />
          </label>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.submit} disabled={saving}>
          {saving ? 'Отправляем…' : 'Отправить чек'}
        </button>
        <p className={styles.hintText}>
          На указанный email уйдёт письмо «Спасибо за покупку» со ссылкой на чек.
        </p>
      </form>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Последние чеки</h2>
          <RefreshButton onClick={handleRefresh} refreshing={refreshing} label="Обновить списки" />
        </div>
        {loading ? (
          <p className={styles.message}>Загрузка…</p>
        ) : tasks.length === 0 ? (
          <p className={styles.message}>Чеков пока не отправляли.</p>
        ) : (
          <ul className={styles.list}>
            {tasks.map((t, i) => {
              const status = TASK_STATUS[t.status] || TASK_STATUS.NEW;
              return (
                <li key={`${t.email}-${t.createdAt}-${i}`} className={styles.item}>
                  <div className={styles.itemMain}>
                    <span className={styles.itemName}>{t.email || '—'}</span>
                    <span className={`${styles.status} ${styles[status.className]}`}>{status.label}</span>
                  </div>
                  {t.link && (
                    <p className={styles.itemRow}>
                      <span className={styles.itemLabel}>Чек:</span>{' '}
                      <a href={t.link} target="_blank" rel="noopener noreferrer" className={styles.link}>
                        {t.link}
                      </a>
                    </p>
                  )}
                  <p className={styles.itemRow}>
                    <span className={styles.itemLabel}>Создан:</span> {formatDate(t.createdAt)}
                  </p>
                  {t.status === 'FAILED' && t.comment && (
                    <p className={styles.receiptErr}>Ошибка: {t.comment}</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Оплаты через Юкассу</h2>
        </div>
        {loading ? (
          <p className={styles.message}>Загрузка…</p>
        ) : transactions.length === 0 ? (
          <p className={styles.message}>Оплат пока нет.</p>
        ) : (
          <ul className={styles.list}>
            {transactions.map((t) => (
              <li key={t.externalPaymentId} className={styles.item}>
                <div className={styles.itemMain}>
                  <span className={styles.itemName}>{t.contactName || t.email || '—'}</span>
                  <span className={`${styles.status} ${styles.statusPaid}`}>
                    {PRODUCT_LABELS[t.productCode] || t.productCode}
                  </span>
                </div>
                <p className={styles.itemRow}>
                  <span className={styles.itemLabel}>Email:</span> {t.email || '—'}
                </p>
                <p className={styles.itemRow}>
                  <span className={styles.itemLabel}>Сумма:</span> {formatAmount(t.amountKopecks)}
                </p>
                <p className={styles.itemRow}>
                  <span className={styles.itemLabel}>Оплачен:</span> {formatDate(t.paidAt)}
                </p>
                {t.email && sentEmails.has(t.email.toLowerCase()) && (
                  <p className={styles.hintText}>Чек на этот email уже отправляли — см. «Последние чеки».</p>
                )}
                {!t.email ? (
                  <p className={styles.receiptErr}>У оплаты нет email — чек отправить некуда.</p>
                ) : (
                  <div className={styles.receiptForm}>
                    <input
                      type="url"
                      className={styles.input}
                      placeholder="https://… ссылка на чек"
                      value={links[t.externalPaymentId] || ''}
                      onChange={(e) =>
                        setLinks((prev) => ({ ...prev, [t.externalPaymentId]: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      className={styles.promoBtn}
                      onClick={() => handleCardSend(t)}
                      disabled={sendingId === t.externalPaymentId}
                    >
                      {sendingId === t.externalPaymentId ? 'Отправляем…' : 'Отправить чек'}
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
};

export default YookassaReceipts;
