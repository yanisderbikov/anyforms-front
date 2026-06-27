import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getCustomOrders, createCustomOrder } from '../../services/customProducts';
import CustomHeader from './CustomHeader';
import CustomTabs from './CustomTabs';
import styles from './CustomOrdersList.module.css';

const fmtDate = (s) => {
  try {
    return s ? new Date(s).toLocaleDateString('ru-RU') : '';
  } catch {
    return '';
  }
};

const CustomOrdersList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('empty'); // 'empty' | 'all'
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ contactName: '', contactPhone: '' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setOrders(await getCustomOrders());
    } catch {
      toast.error('Ошибка при загрузке заказов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const cnt = (o) => o.customItemsCount || 0;
  const filtered = orders.filter((o) => (filter === 'all' ? true : cnt(o) === 0));

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const created = await createCustomOrder({
        contactName: form.contactName.trim() || null,
        contactPhone: form.contactPhone.trim() || null,
      });
      navigate(`/orders/custom/order/${created.id}`);
    } catch {
      toast.error('Не удалось создать заказ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <CustomHeader />
      <div className={styles.tabsWrap}>
        <CustomTabs />
      </div>

      <div className={styles.subTabs}>
        <button className={`${styles.subTab} ${filter === 'empty' ? styles.subActive : ''}`} onClick={() => setFilter('empty')}>
          не оформленные
        </button>
        <button className={`${styles.subTab} ${filter === 'all' ? styles.subActive : ''}`} onClick={() => setFilter('all')}>
          все
        </button>
        <button className={styles.plusBtn} onClick={() => setCreating(true)} title="Создать заказ с нуля (без CRM)">+</button>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>загрузка…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>{filter === 'empty' ? 'нет не оформленных заказов' : 'под-заказов нет'}</p>
        </div>
      ) : (
        <div className={styles.cards}>
          {filtered.map((o) => (
            <div key={o.id} className={styles.card} onClick={() => navigate(`/orders/custom/order/${o.id}`)}>
              <div className={styles.cardHead}>
                <span className={styles.cardTitle}>
                  {o.contactName || (o.leadId ? `сделка #${o.leadId}` : `заказ #${o.id}`)}
                </span>
                <span className={`${styles.badge} ${cnt(o) === 0 ? styles.badgeEmpty : ''}`}>
                  {cnt(o) === 0 ? 'не оформлен' : `${cnt(o)} поз.`}
                </span>
              </div>
              <div className={styles.cardMeta}>
                {o.contactPhone && <span>{o.contactPhone}</span>}
                {o.leadId && <span>amo #{o.leadId}</span>}
                {o.purchaseDate && <span>{fmtDate(o.purchaseDate)}</span>}
              </div>
              <div className={styles.fillHint}>заполнить →</div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <div className={styles.modalOverlay} onClick={() => !saving && setCreating(false)}>
          <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
            <div className={styles.modalTitle}>новый заказ без CRM</div>
            <input
              className={styles.modalInput}
              placeholder="имя клиента (необязательно)"
              value={form.contactName}
              onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))}
              autoFocus
            />
            <input
              className={styles.modalInput}
              placeholder="телефон (необязательно)"
              value={form.contactPhone}
              onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
            />
            <div className={styles.modalActions}>
              <button type="button" className={styles.modalCancel} onClick={() => setCreating(false)} disabled={saving}>
                отмена
              </button>
              <button type="submit" className={styles.modalCreate} disabled={saving}>
                {saving ? 'создаю…' : 'создать'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CustomOrdersList;
