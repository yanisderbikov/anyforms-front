import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../apiClient';
import { authHeaders, formatAmount, formatDate, RefreshButton } from '../AdminInvoices/invoiceShared';
import { normalizePromoCode } from '../../shared/promoTracking';
import styles from './AdminPromoCodes.module.css';

// Сроки промокодов задаются по Москве (UTC+3, перехода на летнее время нет).
const MSK_OFFSET_MS = 3 * 60 * 60 * 1000;

// ISO-instant с бэка → значение для <input type="datetime-local"> в московском времени.
const isoToMskInput = (iso) => {
  if (!iso) return '';
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return '';
  return new Date(t + MSK_OFFSET_MS).toISOString().slice(0, 16);
};

// Значение datetime-local (московское время) → ISO-instant для бэка.
const mskInputToIso = (value) => (value ? new Date(`${value}:00+03:00`).toISOString() : null);

const emptyForm = {
  code: '',
  discountPercent: '',
  discountAmountRub: '',
  minOrderRub: '',
  active: true,
  validFrom: '',
  validUntil: '',
};

// «50% + 5 000 ₽» — размер скидки промокода одной строкой.
const discountLabel = (p) =>
  [
    p.discountPercent ? `${p.discountPercent}%` : null,
    p.discountAmountKopecks ? formatAmount(p.discountAmountKopecks) : null,
  ]
    .filter(Boolean)
    .join(' + ');

const promoStatus = (p) => {
  if (!p.active) return { label: 'выключен', className: styles.statusOff };
  if (p.validFrom && Date.parse(p.validFrom) > Date.now()) {
    return { label: 'ждёт старта', className: styles.statusWait };
  }
  return { label: 'действует', className: styles.statusOn };
};

const AdminPromoCodes = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  // null — создаём новый; id — редактируем существующий.
  const [editingId, setEditingId] = useState(null);

  const loadPromos = useCallback(async () => {
    try {
      const res = await apiClient.instance.get('/api/promo-code', { headers: authHeaders() });
      setPromos(Array.isArray(res.data) ? res.data : []);
      setPageError('');
    } catch (err) {
      setPageError(err?.response?.data?.message || err?.message || 'Не удалось загрузить промокоды');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPromos();
  }, [loadPromos]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadPromos();
    } finally {
      setRefreshing(false);
    }
  };

  const setField = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setError('');
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setForm({
      code: p.code || '',
      discountPercent: p.discountPercent != null ? String(p.discountPercent) : '',
      discountAmountRub: p.discountAmountKopecks != null ? String(p.discountAmountKopecks / 100) : '',
      minOrderRub: p.minOrderKopecks != null ? String(p.minOrderKopecks / 100) : '',
      active: Boolean(p.active),
      validFrom: isoToMskInput(p.validFrom),
      validUntil: isoToMskInput(p.validUntil),
    });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Рубли из инпута → копейки; пустая строка → null; мусор → NaN (ловим при валидации).
  const rubToKopecks = (value) => {
    const trimmed = String(value).trim().replace(',', '.');
    if (!trimmed) return null;
    return Math.round(Number(trimmed) * 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = normalizePromoCode(form.code);
    const percent = form.discountPercent === '' ? 0 : Number(form.discountPercent);
    const amountKopecks = rubToKopecks(form.discountAmountRub);
    const minOrderKopecks = rubToKopecks(form.minOrderRub);

    if (!code) return setError('Укажите код промокода.');
    if (!Number.isInteger(percent) || percent < 0 || percent > 100) {
      return setError('Процент — целое число от 0 до 100.');
    }
    if (amountKopecks != null && (!Number.isFinite(amountKopecks) || amountKopecks <= 0)) {
      return setError('Фиксированная скидка — сумма в рублях больше нуля.');
    }
    if (minOrderKopecks != null && (!Number.isFinite(minOrderKopecks) || minOrderKopecks <= 0)) {
      return setError('Минимальная сумма заказа — сумма в рублях больше нуля.');
    }
    if (percent === 0 && amountKopecks == null) {
      return setError('Скидка пустая: укажите процент или сумму.');
    }
    if (form.validFrom && form.validUntil && form.validFrom >= form.validUntil) {
      return setError('Начало действия должно быть раньше окончания.');
    }

    const payload = {
      code,
      discountPercent: percent,
      discountAmountKopecks: amountKopecks,
      minOrderKopecks,
      active: form.active,
      validFrom: mskInputToIso(form.validFrom),
      validUntil: mskInputToIso(form.validUntil),
    };

    setSaving(true);
    setError('');
    try {
      if (editingId) {
        await apiClient.instance.put(`/api/promo-code/${editingId}`, payload, { headers: authHeaders() });
        toast.success(`Промокод ${code} обновлён`);
      } else {
        await apiClient.instance.post('/api/promo-code', payload, { headers: authHeaders() });
        toast.success(`Промокод ${code} создан`);
      }
      resetForm();
      await loadPromos();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Не удалось сохранить промокод');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Удалить промокод ${p.code}?`)) return;
    try {
      await apiClient.instance.delete(`/api/promo-code/${p.id}`, { headers: authHeaders() });
      toast.success(`Промокод ${p.code} удалён`);
      if (editingId === p.id) resetForm();
      await loadPromos();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Не удалось удалить промокод');
    }
  };

  // «с 01.09.26, 00:00 до 30.09.26, 23:59» — период действия в МСК.
  const periodLabel = (p) => {
    const from = p.validFrom ? `с ${formatDate(p.validFrom)}` : '';
    const until = p.validUntil ? `до ${formatDate(p.validUntil)}` : '';
    const joined = [from, until].filter(Boolean).join(' ');
    return joined || 'бессрочно';
  };

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Промокоды</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.formTitle}>
          {editingId ? `Редактирование: ${form.code || '…'}` : 'Новый промокод'}
        </h2>
        <div className={styles.formGrid}>
          <label className={styles.label}>
            Код *
            <input
              type="text"
              name="code"
              value={form.code}
              onChange={setField}
              className={styles.input}
              placeholder="DI_GIPS"
              autoComplete="off"
              required
            />
          </label>
          <label className={styles.label}>
            Скидка, %
            <input
              type="number"
              name="discountPercent"
              value={form.discountPercent}
              onChange={setField}
              className={styles.input}
              placeholder="0"
              min="0"
              max="100"
              step="1"
            />
          </label>
          <label className={styles.label}>
            Скидка, ₽ (сверх процента)
            <input
              type="number"
              name="discountAmountRub"
              value={form.discountAmountRub}
              onChange={setField}
              className={styles.input}
              placeholder="Не задана"
              min="0.01"
              step="any"
            />
          </label>
          <label className={styles.label}>
            Мин. сумма заказа, ₽
            <input
              type="number"
              name="minOrderRub"
              value={form.minOrderRub}
              onChange={setField}
              className={styles.input}
              placeholder="Без порога"
              min="0.01"
              step="any"
            />
          </label>
          <label className={styles.label}>
            Действует с (МСК)
            <input
              type="datetime-local"
              name="validFrom"
              value={form.validFrom}
              onChange={setField}
              className={styles.input}
            />
          </label>
          <label className={styles.label}>
            Действует до (МСК)
            <input
              type="datetime-local"
              name="validUntil"
              value={form.validUntil}
              onChange={setField}
              className={styles.input}
            />
            <span className={styles.hint}>В этот момент код уже не работает. Пусто — бессрочно.</span>
          </label>
        </div>
        <label className={styles.checkRow}>
          <input type="checkbox" name="active" checked={form.active} onChange={setField} />
          Активен
        </label>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.formActions}>
          <button type="submit" className={styles.submit} disabled={saving}>
            {saving ? 'Сохранение…' : editingId ? 'Сохранить' : 'Создать промокод'}
          </button>
          {editingId && (
            <button type="button" className={styles.cancelBtn} onClick={resetForm}>
              Отмена
            </button>
          )}
        </div>
      </form>

      <section className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>Актуальные промокоды</h2>
          <RefreshButton onClick={handleRefresh} refreshing={refreshing} label="Обновить список промокодов" />
        </div>
        {pageError && <p className={styles.banner}>{pageError}</p>}
        {loading ? (
          <p className={styles.message}>Загрузка промокодов…</p>
        ) : promos.length === 0 ? (
          <p className={styles.message}>Действующих промокодов нет.</p>
        ) : (
          <ul className={styles.list}>
            {promos.map((p) => {
              const status = promoStatus(p);
              return (
                <li key={p.id} className={styles.item}>
                  <div className={styles.itemMain}>
                    <div className={styles.itemHead}>
                      <span className={styles.code}>{p.code}</span>
                      <span className={`${styles.status} ${status.className}`}>{status.label}</span>
                    </div>
                    <p className={styles.meta}>
                      скидка {discountLabel(p) || '—'}
                      {p.minOrderKopecks ? ` · от ${formatAmount(p.minOrderKopecks)}` : ''}
                      {' · '}
                      {periodLabel(p)}
                      {(p.validFrom || p.validUntil) ? ' МСК' : ''}
                    </p>
                  </div>
                  <div className={styles.actions}>
                    <button type="button" className={styles.editBtn} onClick={() => startEdit(p)}>
                      Изменить
                    </button>
                    <button type="button" className={styles.deleteBtn} onClick={() => handleDelete(p)}>
                      Удалить
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default AdminPromoCodes;
