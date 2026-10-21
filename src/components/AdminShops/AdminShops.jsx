import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../../apiClient';
import { authHeaders, formatDate, RefreshButton } from '../AdminInvoices/invoiceShared';
import { COLOR_FIELDS, apiError, formFromShop, shopPayload } from './shopForm';
import styles from '../AdminPromoCodes/AdminPromoCodes.module.css';
import own from './AdminShops.module.css';

const AdminShops = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState('');
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
        { ...shopPayload(formFromShop(shop)), active: !shop.active },
        { headers: authHeaders() },
      );
      toast.success(shop.active ? `Магазин выключен: ${shop.name}` : `Магазин включён: ${shop.name}`);
      await loadShops();
    } catch (err) {
      toast.error(apiError(err, 'Не удалось сохранить'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={styles.wrap}>
      <div className={own.head}>
        <h1 className={styles.title}>Магазины витрины</h1>
        <Link to="/admin/shops/new" className={styles.submit}>
          Новый магазин
        </Link>
      </div>

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
                      {(shop.logoMarkUrl || shop.logoUrl) && (
                        <img className={own.thumb} src={shop.logoMarkUrl || shop.logoUrl} alt="" />
                      )}
                      <span className={styles.code}>{shop.name}</span>
                      {COLOR_FIELDS.some((f) => shop[f]) && (
                        <span className={own.swatches} aria-hidden="true">
                          {COLOR_FIELDS.filter((f) => shop[f]).map((f) => (
                            <span key={f} style={{ background: shop[f] }} />
                          ))}
                        </span>
                      )}
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
                    <Link to={`/admin/shops/${shop.id}`} className={`${styles.editBtn} ${own.linkBtn}`}>
                      Настроить
                    </Link>
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
