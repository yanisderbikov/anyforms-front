import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getCustomOrders } from '../../services/customProducts';
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

  return (
    <div className={styles.page}>
      <CustomHeader />
      <div className={styles.tabsWrap}>
        <CustomTabs />
      </div>

      <div className={styles.subTabs}>
        <button className={`${styles.subTab} ${filter === 'empty' ? styles.subActive : ''}`} onClick={() => setFilter('empty')}>
          созданные (пустые)
        </button>
        <button className={`${styles.subTab} ${filter === 'all' ? styles.subActive : ''}`} onClick={() => setFilter('all')}>
          все
        </button>
        <button className={styles.refresh} onClick={load}>обновить</button>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>загрузка…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>{filter === 'empty' ? 'нет пустых заказов' : 'под-заказов нет'}</p>
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
                  {cnt(o) === 0 ? 'пусто' : `${cnt(o)} поз.`}
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
    </div>
  );
};

export default CustomOrdersList;
