import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatDateTime, formatRub, formatShare } from './calculatorModel';
import {
  deleteCalculation,
  errorMessage,
  getCalculations,
  getCalculatorOptions,
} from '../../services/orderCalculator';
import styles from './AdminCalculator.module.css';

const SEARCH_DELAY_MS = 300;

const CalculatorJournal = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [founder, setFounder] = useState(false);

  useEffect(() => {
    getCalculatorOptions().then((data) => setFounder(Boolean(data.founder))).catch(() => null);
  }, []);

  const load = useCallback(async (q) => {
    setLoading(true);
    try {
      setItems(await getCalculations(q));
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Не удалось загрузить журнал'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => load(query.trim()), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [query, load]);

  const remove = async (event, item) => {
    event.stopPropagation();
    if (!window.confirm(`Удалить расчёт №${item.id} из журнала?`)) return;
    try {
      await deleteCalculation(item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      toast.success('Расчёт удалён');
    } catch (err) {
      toast.error(errorMessage(err, 'Не удалось удалить расчёт'));
    }
  };

  const marginBadge = (item) => {
    if (item.margin == null) return null;
    const className = item.belowMinMargin ? styles.badgeBad : styles.badgeGood;
    return <span className={`${styles.badge} ${className}`}>маржа {formatShare(item.margin)}</span>;
  };

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <h1 className={styles.title}>журнал расчётов</h1>
        <span className={styles.status}>кто, когда и что считал; клик — открыть в калькуляторе</span>
      </div>

      <section className={styles.card}>
        <div className={styles.searchRow}>
          <input
            className={styles.input}
            value={query}
            placeholder="Клиент, изделие или автор"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {error && <p className={styles.banner}>{error}</p>}
        {loading && !items.length && <p className={styles.muted}>Загрузка…</p>}
        {!loading && !items.length && !error && <p className={styles.muted}>Сохранённых расчётов пока нет.</p>}
        <ul className={styles.list}>
          {items.map((item) => (
            <li
              key={item.id}
              className={styles.listItem}
              onClick={() => navigate(`/admin/calculator?id=${item.id}`)}
            >
              <div className={styles.listMain}>
                <span className={styles.listTitle}>
                  №{item.id} · {item.client || 'без клиента'}
                  {item.title ? ` — ${item.title}` : ''}
                </span>
                <span className={styles.listMeta}>
                  {formatDateTime(item.createdAt)} · {item.createdByName || item.createdByEmail}
                  {founder && item.ratesVersionId ? ` · ставки v${item.ratesVersionId}` : ''}
                </span>
                {item.comment && <span className={styles.listMeta}>{item.comment}</span>}
                <span className={styles.badges}>
                  {item.preliminary && <span className={`${styles.badge} ${styles.badgeWarn}`}>предварительная оценка</span>}
                  {item.hasEstimates && <span className={`${styles.badge} ${styles.badgeEstimate}`}>есть оценки</span>}
                  {item.hasExceptions && <span className={`${styles.badge} ${styles.badgeAi}`}>исключения</span>}
                </span>
              </div>
              <div className={styles.listSide}>
                <span className={styles.listTitle}>{formatRub(item.totalRub)}</span>
                {marginBadge(item)}
                <button
                  type="button"
                  className={styles.btnGhost}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/admin/calculator/kp?id=${item.id}`, '_blank', 'noopener');
                  }}
                >
                  КП в PDF
                </button>
                {founder && (
                  <button type="button" className={styles.btnDanger} onClick={(e) => remove(e, item)}>
                    удалить
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default CalculatorJournal;
