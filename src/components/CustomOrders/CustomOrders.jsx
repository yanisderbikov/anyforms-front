import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getAllCustomItems } from '../../services/customProducts';
import CustomTabs from './CustomTabs';
import CustomItemCard from './CustomItemCard';
import CustomItemViewModal from './CustomItemViewModal';
import CustomItemModal from './CustomItemModal';
import StatusFilter from './StatusFilter';
import styles from './CustomOrders.module.css';

// Ярлыки этапов в URL (?stage=…) → статус фильтра. Поддерживаем и «человекочитаемые»
// слаги, и сырые значения статуса, чтобы ссылку можно было открыть сразу на нужном этапе.
const STAGE_TO_STATUS = {
  modeling: 'MODELING',
  moderation: 'MODELING',
  MODELING: 'MODELING',
  production: 'IN_PRODUCTION',
  IN_PRODUCTION: 'IN_PRODUCTION',
  ship: 'READY_TO_SHIP',
  READY_TO_SHIP: 'READY_TO_SHIP',
  delivering: 'DELIVERING',
  DELIVERING: 'DELIVERING',
  completed: 'COMPLETED',
  COMPLETED: 'COMPLETED',
  all: null,
};
const STATUS_TO_STAGE = {
  MODELING: 'modeling',
  IN_PRODUCTION: 'production',
  READY_TO_SHIP: 'ship',
  DELIVERING: 'delivering',
  COMPLETED: 'completed',
};

const stageParamToStatus = (raw) => {
  if (raw == null) return 'IN_PRODUCTION';
  if (raw === 'all') return null;
  return STAGE_TO_STATUS[raw] ?? 'IN_PRODUCTION';
};

const CustomOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const statusFilter = stageParamToStatus(searchParams.get('stage'));

  const setStatusFilter = (status) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (status === null) next.set('stage', 'all');
        else next.set('stage', STATUS_TO_STAGE[status] || status);
        return next;
      },
      { replace: true },
    );
  };

  const load = async (completed) => {
    try {
      setLoading(true);
      setItems(await getAllCustomItems(completed ? 'COMPLETED' : undefined));
    } catch (e) {
      toast.error('Ошибка при загрузке под-заказов');
    } finally {
      setLoading(false);
    }
  };

  const showCompleted = statusFilter === 'COMPLETED';

  useEffect(() => {
    load(showCompleted);
  }, [showCompleted]);

  const filtered = items.filter((it) => {
    if (statusFilter && it.status !== statusFilter) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const haystack = [
      it.productName,
      it.description,
      it.clientName,
      it.modeler,
      it.statusDescription,
      it.id,
      it.orderId,
      it.leadId,
    ]
      .filter((v) => v != null && v !== '')
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });

  return (
    <div className={styles.page}>
      <div className={styles.tabsWrap}>
        <CustomTabs />
      </div>

      <div className={styles.controls}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="поиск: ФИО, описание, название, моделер, № заказа…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.filterRow}>
        <StatusFilter value={statusFilter} onChange={setStatusFilter} />
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
            <CustomItemCard
              key={it.id}
              item={it}
              showModeler={statusFilter === 'MODELING'}
              onOpen={() => setViewing(it)}
            />
          ))}
        </div>
      )}

      {viewing && (
        <CustomItemViewModal
          item={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => {
            setEditing(viewing);
            setViewing(null);
          }}
        />
      )}

      {editing && (
        <CustomItemModal
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))}
          onDeleted={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
        />
      )}
    </div>
  );
};

export default CustomOrders;
