import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../apiClient';
import { EMAIL_RE, sanitizePhoneInput, isPhoneValid, toSubmitPhone } from '../../utils/phone';
import {
  STATUS_LABELS,
  STATUS_CLASSES,
  formatAmount,
  formatDate,
  copyToClipboard,
  authHeaders,
  RefreshButton,
} from './invoiceShared';
import styles from './AdminInvoices.module.css';

const PRODUCT_OPTIONS = [
  { code: 'GUIDE', label: 'Гайд' },
  { code: 'COURSE', label: 'Курс — самостоятельное изучение' },
  { code: 'COURSE_PERSONAL', label: 'Курс — личное ведение' },
];

const PRODUCT_LABELS = Object.fromEntries(PRODUCT_OPTIONS.map((p) => [p.code, p.label]));

const initialForm = {
  fullName: '',
  phone: '',
  email: '',
  productCode: 'GUIDE',
  promoCode: '',
};

const TrainingInvoices = () => {
  const [form, setForm] = useState(initialForm);
  const [invoices, setInvoices] = useState([]);
  const [prices, setPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [promoInfo, setPromoInfo] = useState(null);
  const [checkingPromo, setCheckingPromo] = useState(false);
  const [createdUrl, setCreatedUrl] = useState('');

  const loadInvoices = useCallback(async () => {
    try {
      const res = await apiClient.instance.get('/api/training-invoice/recent', {
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

  // Цены продуктов — бэк отдаёт их строкой в рублях, храним в копейках.
  useEffect(() => {
    apiClient.instance
      .get('/api/payment/products')
      .then((res) => {
        const map = {};
        (Array.isArray(res.data) ? res.data : []).forEach((p) => {
          const kopecks = Math.round(parseFloat(p.price) * 100);
          if (Number.isFinite(kopecks)) map[p.code] = kopecks;
        });
        setPrices(map);
      })
      .catch(() => {});
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadInvoices();
    } finally {
      setRefreshing(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'phone' ? sanitizePhoneInput(value) : value;
    setForm((prev) => ({ ...prev, [name]: nextValue }));
    // Смена продукта или кода делает проверку промокода неактуальной.
    if (name === 'productCode' || name === 'promoCode') setPromoInfo(null);
  };

  const checkPromo = async () => {
    const code = form.promoCode.trim();
    if (!code) {
      setPromoInfo(null);
      return;
    }
    setCheckingPromo(true);
    try {
      const res = await apiClient.instance.get('/api/payment/promo-check', {
        params: { code, productCode: form.productCode },
      });
      setPromoInfo(res.data);
    } catch {
      setPromoInfo({ valid: false, message: 'Не удалось проверить промокод' });
    } finally {
      setCheckingPromo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!EMAIL_RE.test(form.email.trim())) {
      setError('Некорректный email');
      return;
    }
    if (!isPhoneValid(form.phone)) {
      setError('Некорректный телефон');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        productCode: form.productCode,
        fullName: form.fullName.trim(),
        phone: toSubmitPhone(form.phone),
        email: form.email.trim(),
      };
      if (form.promoCode.trim()) payload.promoCode = form.promoCode.trim();

      const res = await apiClient.instance.post('/api/training-invoice', payload, {
        headers: authHeaders(),
      });
      const invoice = res.data;
      if (invoice?.paymentUrl) {
        copyToClipboard(invoice.paymentUrl);
        setCreatedUrl(invoice.paymentUrl);
      }
      setForm(initialForm);
      setPromoInfo(null);
      await loadInvoices();
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Не удалось создать ссылку'
      );
    } finally {
      setSaving(false);
    }
  };

  const basePrice = prices[form.productCode];
  const finalPrice = promoInfo?.valid ? promoInfo.discountedPriceKopecks : basePrice;

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <label className={styles.label}>
            Продукт *
            <select
              name="productCode"
              value={form.productCode}
              onChange={handleChange}
              className={styles.input}
            >
              {PRODUCT_OPTIONS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.label}>
            ФИО *
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className={styles.input}
              placeholder="Иванов Иван Иванович"
              required
            />
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
            Email * (после оплаты на него уйдёт письмо с доступом)
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
            Промокод
            <div className={styles.promoRow}>
              <input
                type="text"
                name="promoCode"
                value={form.promoCode}
                onChange={handleChange}
                className={styles.input}
                placeholder="ANY10"
                autoComplete="off"
              />
              <button
                type="button"
                className={styles.promoBtn}
                onClick={checkPromo}
                disabled={checkingPromo || !form.promoCode.trim()}
              >
                {checkingPromo ? 'Проверяем…' : 'Проверить'}
              </button>
            </div>
            {promoInfo && (
              promoInfo.valid ? (
                <span className={styles.promoOk}>
                  Промокод действует: скидка {promoInfo.discountPercent}%
                </span>
              ) : (
                <span className={styles.promoErr}>{promoInfo.message || 'Промокод недействителен'}</span>
              )
            )}
          </label>
        </div>
        {finalPrice != null && (
          <p className={styles.priceInfo}>
            К оплате: {formatAmount(finalPrice)}
            {promoInfo?.valid && basePrice != null && (
              <span className={styles.priceOld}>{formatAmount(basePrice)}</span>
            )}
          </p>
        )}
        {error && <p className={styles.error}>{error}</p>}
        <button type="submit" className={styles.submit} disabled={saving}>
          {saving ? 'Создаём…' : 'Создать ссылку'}
        </button>
        <p className={styles.hintText}>
          Ссылка на оплату сразу скопируется в буфер обмена. После оплаты клиенту автоматически уйдёт
          письмо с доступом — как при обычной покупке.
        </p>
        {createdUrl && (
          <div className={styles.createdBox}>
            <span className={styles.createdLink}>{createdUrl}</span>
            <button type="button" className={styles.copyBtn} onClick={() => copyToClipboard(createdUrl)}>
              Скопировать
            </button>
          </div>
        )}
      </form>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Последние счета</h2>
          <RefreshButton onClick={handleRefresh} refreshing={refreshing} label="Обновить список счетов" />
        </div>
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
                  <span className={styles.itemLabel}>Продукт:</span>{' '}
                  {PRODUCT_LABELS[inv.productCode] || inv.productCode}
                </p>
                <p className={styles.itemRow}>
                  <span className={styles.itemLabel}>Телефон:</span> {inv.contactPhone || '—'}
                </p>
                {inv.email && (
                  <p className={styles.itemRow}>
                    <span className={styles.itemLabel}>Email:</span> {inv.email}
                  </p>
                )}
                <p className={styles.itemRow}>
                  <span className={styles.itemLabel}>Сумма:</span> {formatAmount(inv.amountKopecks)}
                  {inv.promoCode && (
                    <>
                      {' '}· <span className={styles.itemLabel}>Промокод:</span> {inv.promoCode}
                      {inv.discountPercent != null && ` (−${inv.discountPercent}%)`}
                    </>
                  )}
                </p>
                <p className={styles.itemRow}>
                  <span className={styles.itemLabel}>Выставлен:</span> {formatDate(inv.createdAt)}
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
    </>
  );
};

export default TrainingInvoices;
