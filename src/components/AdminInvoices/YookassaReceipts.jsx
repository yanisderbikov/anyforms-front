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

const initialForm = { email: '', link: '', productCode: '' };

const TASKS_LIMIT = 200;
const TRANSACTIONS_LIMIT = 500;

const emptyFilters = { receiptSent: '', from: '', to: '' };

const isoDate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** По умолчанию показываем оплаты без отправленного чека за последние 7 дней */
const defaultFilters = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - 7);
  return { receiptSent: 'notSent', from: isoDate(from), to: isoDate(to) };
};

const RECEIPT_FILTERS = [
  { value: '', label: 'Все' },
  { value: 'notSent', label: 'Без чека' },
  { value: 'sent', label: 'С чеком' },
];

const TABS = [
  { key: 'payments', label: 'Оплаты' },
  { key: 'sent', label: 'Отправленные чеки' },
  { key: 'manual', label: 'Отправить вручную' },
];

const productName = (t) => t.productTitle || PRODUCT_LABELS[t.productCode] || t.productCode || '';

const copyText = (text, msg) => {
  if (!text) return;
  navigator.clipboard
    .writeText(String(text))
    .then(() => toast.success(msg, { position: 'top-right', duration: 1500 }))
    .catch(() => toast.error('Ошибка копирования'));
};

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
  const [filters, setFilters] = useState(defaultFilters);
  const [tab, setTab] = useState('payments');

  const load = useCallback(async () => {
    const txParams = { limit: TRANSACTIONS_LIMIT };
    if (filters.receiptSent !== '') txParams.receiptSent = filters.receiptSent === 'sent';
    if (filters.from) txParams.from = filters.from;
    if (filters.to) txParams.to = filters.to;
    try {
      const [tasksRes, txRes] = await Promise.all([
        apiClient.instance.get('/api/receipt/recent', { params: { limit: TASKS_LIMIT }, headers: authHeaders() }),
        apiClient.instance.get('/api/receipt/transactions', { params: txParams, headers: authHeaders() }),
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
  }, [filters]);

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

  const sendReceipt = async (email, link, productCode) => {
    await apiClient.instance.post(
      '/api/receipt/send',
      { email, link, productCode: productCode || null },
      { headers: authHeaders() }
    );
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
      await sendReceipt(form.email.trim(), form.link.trim(), form.productCode);
      setForm(initialForm);
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Не удалось отправить чек'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const filtersActive = Boolean(filters.receiptSent || filters.from || filters.to);

  const handleCardSend = async (t) => {
    const link = (links[t.externalPaymentId] || '').trim();
    if (!LINK_RE.test(link)) {
      toast.error('Вставьте ссылку на чек (начинается с http(s)://)');
      return;
    }
    setSendingId(t.externalPaymentId);
    try {
      await sendReceipt(t.email, link, t.productCode);
      setLinks((prev) => ({ ...prev, [t.externalPaymentId]: '' }));
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Не удалось отправить чек'
      );
    } finally {
      setSendingId(null);
    }
  };

  return (
    <>
      {error && <p className={styles.errorBanner}>{error}</p>}

      <div className={styles.tabs} role="tablist">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
            {!loading && t.key === 'payments' && <span className={styles.tabCount}>{transactions.length}</span>}
            {!loading && t.key === 'sent' && <span className={styles.tabCount}>{tasks.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'payments' && (
        <section className={styles.section}>
          <div className={styles.toolbar}>
            <div className={styles.segmented}>
              {RECEIPT_FILTERS.map((f) => (
                <button
                  key={f.value || 'all'}
                  type="button"
                  className={`${styles.segment} ${filters.receiptSent === f.value ? styles.segmentActive : ''}`}
                  onClick={() => setFilters((prev) => ({ ...prev, receiptSent: f.value }))}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className={styles.dateRange}>
              <input
                type="date"
                name="from"
                value={filters.from}
                onChange={handleFilterChange}
                className={styles.dateInput}
                title="Оплачен с"
              />
              <span className={styles.dateDash}>—</span>
              <input
                type="date"
                name="to"
                value={filters.to}
                onChange={handleFilterChange}
                className={styles.dateInput}
                title="Оплачен по"
              />
            </div>
            {filtersActive && (
              <button type="button" className={styles.filterReset} onClick={() => setFilters(emptyFilters)}>
                Сбросить
              </button>
            )}
            <RefreshButton onClick={handleRefresh} refreshing={refreshing} label="Обновить списки" />
          </div>
          {loading ? (
            <p className={styles.message}>Загрузка…</p>
          ) : transactions.length === 0 ? (
            <p className={styles.message}>Оплат по этим фильтрам нет.</p>
          ) : (
            <ul className={styles.list}>
              {transactions.map((t) => {
                const alreadySent = Boolean(t.receiptSent);
                return (
                <li key={t.externalPaymentId} className={styles.item}>
                  <div className={styles.itemMain}>
                    <span className={styles.itemNameWrap}>
                      {alreadySent && (
                        <span className={styles.sentBadge} title="Чек по этому продукту на этот email уже отправляли — см. вкладку «Отправленные чеки»">
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M2.5 6.5L5 9l4.5-6"
                              stroke="#fff"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      )}
                      <span className={styles.itemName}>{t.contactName || t.email || '—'}</span>
                    </span>
                    <span className={`${styles.status} ${styles.statusPaid}`}>
                      {PRODUCT_LABELS[t.productCode] || t.productCode}
                    </span>
                  </div>
                  <p className={styles.itemRow}>
                    <span className={styles.itemLabel}>Продукт:</span>{' '}
                    {productName(t) ? (
                      <span
                        className={styles.clickable}
                        onClick={() => copyText(productName(t), 'Название продукта скопировано')}
                        title="Нажмите для копирования"
                      >
                        {productName(t)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </p>
                  <p className={styles.itemRow}>
                    <span className={styles.itemLabel}>Email:</span>{' '}
                    {t.email ? (
                      <span
                        className={styles.clickable}
                        onClick={() => copyText(t.email, 'Email скопирован')}
                        title="Нажмите для копирования"
                      >
                        {t.email}
                      </span>
                    ) : (
                      '—'
                    )}
                  </p>
                  <p className={styles.itemRow}>
                    <span className={styles.itemLabel}>Сумма:</span>{' '}
                    <span
                      className={styles.clickable}
                      onClick={() => copyText(t.amountKopecks != null ? t.amountKopecks / 100 : '', 'Сумма скопирована')}
                      title="Нажмите для копирования"
                    >
                      {formatAmount(t.amountKopecks)}
                    </span>
                  </p>
                  <p className={styles.itemRow}>
                    <span className={styles.itemLabel}>Оплачен:</span> {formatDate(t.paidAt)}
                  </p>
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
                );
              })}
            </ul>
          )}

        </section>
      )}

      {tab === 'sent' && (
        <section className={styles.section}>
          <div className={styles.toolbar}>
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
                      <span
                        className={`${styles.itemName} ${t.email ? styles.clickable : ''}`}
                        onClick={() => copyText(t.email, 'Email скопирован')}
                        title={t.email ? 'Нажмите для копирования' : undefined}
                      >
                        {t.email || '—'}
                      </span>
                      <span className={`${styles.status} ${styles[status.className]}`}>{status.label}</span>
                    </div>
                    <p className={styles.itemRow}>
                      <span className={styles.itemLabel}>Продукт:</span>{' '}
                      {PRODUCT_LABELS[t.productCode] || t.productCode || '—'}
                    </p>
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
      )}

      {tab === 'manual' && (
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
            <label className={styles.label}>
              Тип продукта
              <select
                name="productCode"
                value={form.productCode}
                onChange={handleChange}
                className={styles.input}
              >
                <option value="">Не указан</option>
                {Object.entries(PRODUCT_LABELS).map(([code, label]) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="submit" className={styles.submit} disabled={saving}>
            {saving ? 'Отправляем…' : 'Отправить чек'}
          </button>
          <p className={styles.hintText}>
            На указанный email уйдёт письмо «Спасибо за покупку» со ссылкой на чек.
          </p>
        </form>
      )}
    </>
  );
};

export default YookassaReceipts;
