import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../apiClient';
import { authHeaders, formatDate, RefreshButton } from '../AdminInvoices/invoiceShared';
import styles from '../AdminPromoCodes/AdminPromoCodes.module.css';

const emptyForm = { slug: '', name: '', supportTelegram: '', amoContactValue: '' };

const apiError = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

const AdminShops = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const loadShops = useCallback(async () => {
    try {
      const res = await apiClient.instance.get('/api/shop/admin', { headers: authHeaders() });
      setShops(Array.isArray(res.data) ? res.data : []);
      setPageError('');
    } catch (err) {
      setPageError(apiError(err, 'Не удалось загрузить магазины'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadShops();
    } finally {
      setRefreshing(false);
    }
  };

  const setField = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
  };

  const startEdit = (shop) => {
    setEditingId(shop.id);
    setForm({
      slug: shop.slug,
      name: shop.name || '',
      supportTelegram: shop.supportTelegram || '',
      amoContactValue: shop.amoContactValue || '',
    });
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) return setError('Укажите название магазина.');
    const payload = {
      name,
      supportTelegram: form.supportTelegram.trim() || null,
      amoContactValue: form.amoContactValue.trim() || null,
    };

    setSaving(true);
    setError('');
    try {
      if (editingId) {
        const current = shops.find((s) => s.id === editingId);
        await apiClient.instance.put(
          `/api/shop/admin/${editingId}`,
          { ...payload, active: current ? current.active : true },
          { headers: authHeaders() },
        );
        toast.success(`Сохранено: ${name}`);
      } else {
        const slug = form.slug.trim().toLowerCase();
        if (!slug) {
          setSaving(false);
          return setError('Укажите slug — адрес витрины /shop/{slug}.');
        }
        await apiClient.instance.post(
          '/api/shop/admin',
          { ...payload, slug },
          { headers: authHeaders() },
        );
        toast.success(`Магазин создан: витрина /shop/${slug} уже работает`);
      }
      resetForm();
      await loadShops();
    } catch (err) {
      setError(apiError(err, 'Не удалось сохранить магазин'));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (shop) => {
    if (
      shop.active &&
      !window.confirm(`Выключить магазин ${shop.name}? Витрина /shop/${shop.slug} перестанет открываться.`)
    ) {
      return;
    }
    setBusyId(shop.id);
    try {
      await apiClient.instance.put(
        `/api/shop/admin/${shop.id}`,
        {
          name: shop.name,
          supportTelegram: shop.supportTelegram || null,
          amoContactValue: shop.amoContactValue || null,
          active: !shop.active,
        },
        { headers: authHeaders() },
      );
      toast.success(shop.active ? `Магазин выключен: ${shop.name}` : `Магазин включён: ${shop.name}`);
      if (editingId === shop.id) resetForm();
      await loadShops();
    } catch (err) {
      toast.error(apiError(err, 'Не удалось сохранить'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Магазины витрины</h1>

      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.formTitle}>
          {editingId ? `Редактирование: ${form.slug}` : 'Новый магазин'}
        </h2>
        <div className={styles.formGrid}>
          {!editingId && (
            <label className={styles.label}>
              Slug — адрес витрины *
              <input
                type="text"
                name="slug"
                value={form.slug}
                onChange={setField}
                className={styles.input}
                placeholder="di_gips"
                autoComplete="off"
                required
              />
              <span className={styles.hint}>
                Витрина откроется на /shop/&#123;slug&#125; сразу после создания. Строчные латинские
                буквы, цифры, _ и -. Поменять slug потом нельзя.
              </span>
            </label>
          )}
          <label className={styles.label}>
            Название *
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={setField}
              className={styles.input}
              placeholder="di_gips"
              autoComplete="off"
              required
            />
            <span className={styles.hint}>
              Показывается на витрине, в селектах админки и в аналитике.
            </span>
          </label>
          <label className={styles.label}>
            Телеграм-бот поддержки
            <input
              type="text"
              name="supportTelegram"
              value={form.supportTelegram}
              onChange={setField}
              className={styles.input}
              placeholder="di_gips_supportbot"
              autoComplete="off"
            />
            <span className={styles.hint}>
              Username без @. Письма и витрина ведут покупателя в этого бота; пусто — общий AnyFormsBot.
            </span>
          </label>
          <label className={styles.label}>
            Значение поля «Магазин» в amoCRM
            <input
              type="text"
              name="amoContactValue"
              value={form.amoContactValue}
              onChange={setField}
              className={styles.input}
              placeholder="di_gips"
              autoComplete="off"
            />
            <span className={styles.hint}>
              Сначала добавьте это значение в список поля «Магазин» контакта в amoCRM, потом впишите
              сюда — им помечаются контакты покупателей. Пусто — поле в amo не заполняется.
            </span>
          </label>
        </div>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.formActions}>
          <button type="submit" className={styles.submit} disabled={saving}>
            {saving ? 'Сохранение…' : editingId ? 'Сохранить' : 'Создать магазин'}
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
          <h2 className={styles.sectionTitle}>Все магазины</h2>
          <RefreshButton onClick={handleRefresh} refreshing={refreshing} label="Обновить список магазинов" />
        </div>
        {pageError && <p className={styles.banner}>{pageError}</p>}
        {loading ? (
          <p className={styles.message}>Загрузка…</p>
        ) : shops.length === 0 ? (
          <p className={styles.message}>Пока нет ни одного магазина.</p>
        ) : (
          <ul className={styles.list}>
            {shops.map((shop) => {
              const busy = busyId === shop.id;
              return (
                <li key={shop.id} className={styles.item}>
                  <div className={styles.itemMain}>
                    <div className={styles.itemHead}>
                      <span className={styles.code}>{shop.name}</span>
                      <span className={`${styles.status} ${shop.active ? styles.statusOn : styles.statusOff}`}>
                        {shop.active ? 'на витрине' : 'выключен'}
                      </span>
                    </div>
                    <p className={styles.meta}>
                      <a href={`/shop/${shop.slug}`} target="_blank" rel="noreferrer">
                        /shop/{shop.slug}
                      </a>
                      {` · бот @${shop.supportTelegram}`}
                      {` · amo: ${shop.amoContactValue || 'не задано'}`}
                      {shop.createdAt ? ` · создан ${formatDate(shop.createdAt)}` : ''}
                      {shop.defaultShop ? ' · общая витрина /shop' : ''}
                    </p>
                  </div>
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.editBtn}
                      onClick={() => startEdit(shop)}
                      disabled={busy}
                    >
                      Изменить
                    </button>
                    {!shop.defaultShop && (
                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => toggleActive(shop)}
                        disabled={busy}
                      >
                        {shop.active ? 'Выключить' : 'Включить'}
                      </button>
                    )}
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

export default AdminShops;
