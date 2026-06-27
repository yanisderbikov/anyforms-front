import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getAllCustomItems } from '../../services/customProducts';
import CustomHeader from './CustomHeader';
import CustomTabs from './CustomTabs';
import CustomItemCard from './CustomItemCard';
import CustomItemModal from './CustomItemModal';
import styles from './CustomOrders.module.css';

const CustomOrders = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setItems(await getAllCustomItems());
    } catch (e) {
      toast.error('Ошибка при загрузке под-заказов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = items.filter((it) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (it.productName || '').toLowerCase().includes(q) || (it.description || '').toLowerCase().includes(q);
  });

  return (
    <div className={styles.page}>
      <CustomHeader />
      <div className={styles.tabsWrap}>
        <CustomTabs />
      </div>

      <div className={styles.controls}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="поиск по названию или описанию..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className={styles.refreshBtn} onClick={load}>обновить</button>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>загрузка…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>{search ? 'ничего не найдено' : 'позиций пока нет'}</p>
        </div>
      ) : (
        <div className={styles.cardsContainer}>
          {filtered.map((it) => (
            <CustomItemCard key={it.id} item={it} onOpen={() => setSelected(it)} />
          ))}
        </div>
      )}

      {selected && (
        <CustomItemModal
          item={selected}
          onClose={() => setSelected(null)}
          onSaved={(updated) => setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))}
          onDeleted={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
        />
      )}
    </div>
  );
};

export default CustomOrders;
