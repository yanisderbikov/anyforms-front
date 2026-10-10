import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../apiClient';
import { authHeaders, formatAmount, formatDate, RefreshButton } from '../AdminInvoices/invoiceShared';
import styles from '../AdminPromoCodes/AdminPromoCodes.module.css';

const toForm = (data) => ({
  enabled: Boolean(data.enabled),
  thresholdRub: data.thresholdKopecks != null ? String(data.thresholdKopecks / 100) : '',
});

const AdminFreeDelivery = () => {
  const [settings, setSettings] = useState(null);
  const [form, setForm] = useState({ enabled: true, thresholdRub: '' });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await apiClient.instance.get('/api/free-delivery', { headers: authHeaders() });
      setSettings(data);
      setForm(toForm(data));
      setPageError('');
    } catch (err) {
      setPageError(err?.response?.data?.message || err?.message || 'Не удалось загрузить настройку доставки');
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

  const setField = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const raw = String(form.thresholdRub).trim().replace(',', '.');
    const thresholdKopecks = Math.round(Number(raw) * 100);
    if (!raw || !Number.isFinite(thresholdKopecks) || thresholdKopecks <= 0) {
      return setError('Укажите сумму заказа в рублях больше нуля.');
    }

    setSaving(true);
    setError('');
    try {
      const { data } = await apiClient.instance.put(
        '/api/free-delivery',
        { enabled: form.enabled, thresholdKopecks },
        { headers: authHeaders() }
      );
      setSettings(data);
      setForm(toForm(data));
      toast.success(
        data.enabled
          ? `Бесплатная доставка от ${formatAmount(data.thresholdKopecks)} включена`
          : 'Бесплатная доставка выключена'
      );
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Не удалось сохранить настройку');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Бесплатная доставка</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.formTitle}>Условие акции</h2>
        {loading ? (
          <p className={styles.message}>Загрузка настройки…</p>
        ) : (
          <>
            <div className={styles.formGrid}>
              <label className={styles.label}>
                Бесплатно от суммы заказа, ₽ *
                <input
                  type="number"
                  name="thresholdRub"
                  value={form.thresholdRub}
                  onChange={setField}
                  className={styles.input}
                  placeholder="12000"
                  min="1"
                  step="any"
                  required
                />
                <span className={styles.hint}>
                  Сравнивается с суммой к оплате — после скидки по промокоду.
                </span>
              </label>
            </div>
            <label className={styles.checkRow}>
              <input type="checkbox" name="enabled" checked={form.enabled} onChange={setField} />
              Акция включена
            </label>
            {error && <p className={styles.error}>{error}</p>}
            <div className={styles.formActions}>
              <button type="submit" className={styles.submit} disabled={saving}>
                {saving ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          </>
        )}
      </form>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Сейчас на витрине</h2>
          <RefreshButton onClick={handleRefresh} refreshing={refreshing} label="Обновить настройку доставки" />
        </div>
        {pageError && <p className={styles.banner}>{pageError}</p>}
        {settings && (
          <ul className={styles.list}>
            <li className={styles.item}>
              <div className={styles.itemMain}>
                <div className={styles.itemHead}>
                  <span className={styles.code}>
                    от {formatAmount(settings.thresholdKopecks)}
                  </span>
                  <span className={`${styles.status} ${settings.enabled ? styles.statusOn : styles.statusOff}`}>
                    {settings.enabled ? 'действует' : 'выключена'}
                  </span>
                </div>
                <p className={styles.meta}>
                  {settings.enabled
                    ? 'Покупатель видит в корзине и на чекауте, сколько осталось до бесплатной доставки. '
                      + 'В заказе ставится метка, в сделке amo — примечание: доставку СДЭК оплачиваем мы.'
                    : 'Доставка оплачивается покупателем при получении для всех заказов.'}
                  {settings.updatedAt ? ` · изменено ${formatDate(settings.updatedAt)} МСК` : ''}
                </p>
              </div>
            </li>
          </ul>
        )}
      </section>
    </div>
  );
};

export default AdminFreeDelivery;
