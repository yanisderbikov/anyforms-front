import React, { useEffect, useState } from 'react';
import apiClient from '../../apiClient';
import { getShops } from '../../services/itemsService';
import styles from './ShopSalesReport.module.css';

// Локальная дата в формате YYYY-MM-DD (toISOString сдвигает день из-за UTC).
const toInputDate = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

// Понедельник текущей недели (getDay: воскресенье = 0).
const startOfWeek = () => {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
};

const PRESETS = [
  { key: 'week', label: 'эта неделя', range: () => [startOfWeek(), new Date()] },
  { key: '7d', label: '7 дней', range: () => [daysAgo(6), new Date()] },
  { key: '30d', label: '30 дней', range: () => [daysAgo(29), new Date()] },
  {
    key: 'month',
    label: 'этот месяц',
    range: () => {
      const now = new Date();
      return [new Date(now.getFullYear(), now.getMonth(), 1), now];
    },
  },
  {
    key: 'year',
    label: 'этот год',
    range: () => {
      const now = new Date();
      return [new Date(now.getFullYear(), 0, 1), now];
    },
  },
  { key: 'all', label: 'всё время', range: () => [new Date(2020, 0, 1), new Date()] },
];

// Все магазины-партнёры платят комиссию 20% от оборота; свой магазин anyforms — нет.
const COMMISSION_RATE = 0.2;
const OWN_SHOP_SLUG = 'anyforms';

const formatRub = (kopecks) =>
  (kopecks / 100).toLocaleString('ru-RU', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

const pluralMolds = (n) => {
  const tail10 = n % 10;
  const tail100 = n % 100;
  if (tail10 === 1 && tail100 !== 11) return 'молд';
  if (tail10 >= 2 && tail10 <= 4 && (tail100 < 12 || tail100 > 14)) return 'молда';
  return 'молдов';
};

/**
 * Страница «Аналитика»: продажи по магазину-партнёру за период — итоги
 * (заказы, молды, сумма) и разбивка по товарам. Данные — /api/orders/shop-report.
 */
const ShopSalesReport = () => {
  const [shops, setShops] = useState([]);
  const [shopSlug, setShopSlug] = useState('');
  // По умолчанию — текущая неделя; отчёт запрашивается сразу, как загрузятся магазины.
  const [from, setFrom] = useState(() => toInputDate(startOfWeek()));
  const [to, setTo] = useState(() => toInputDate(new Date()));
  const [preset, setPreset] = useState('week');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getShops()
      .then((loaded) => {
        setShops(loaded);
        // Сразу показываем отчёт по первому магазину, не дожидаясь выбора.
        if (loaded.length > 0) {
          setShopSlug((current) => current || loaded[0].slug);
        }
      })
      .catch((err) => setError(err?.message || 'Не удалось загрузить магазины'));
  }, []);

  useEffect(() => {
    if (!shopSlug || !from || !to) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    const token = apiClient.getToken ? apiClient.getToken() : null;
    apiClient.instance
      .get('/api/orders/shop-report', {
        params: { shopSlug, from, to },
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      .then((res) => {
        if (!cancelled) setReport(res.data);
      })
      .catch((err) => {
        if (!cancelled) {
          setReport(null);
          setError(err?.response?.data?.error || err?.message || 'Не удалось загрузить отчёт');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [shopSlug, from, to]);

  const applyPreset = (p) => {
    const [start, end] = p.range();
    setPreset(p.key);
    setFrom(toInputDate(start));
    setTo(toInputDate(end));
  };

  return (
    <div className={styles.wrap}>
      <header className={styles.pageHead}>
        <h1 className={styles.title}>Аналитика</h1>
        <p className={styles.subtitle}>Продажи магазинов-партнёров за период</p>
      </header>

      <div className={styles.controls}>
        <select
          className={styles.select}
          value={shopSlug}
          onChange={(e) => setShopSlug(e.target.value)}
          aria-label="Магазин для отчёта"
        >
          <option value="">Выберите магазин</option>
          {shops.map((shop) => (
            <option key={shop.slug} value={shop.slug}>
              {shop.name}
            </option>
          ))}
        </select>
        <div className={styles.dates}>
          <input
            type="date"
            className={styles.dateInput}
            value={from}
            max={to}
            onChange={(e) => {
              setFrom(e.target.value);
              setPreset('');
            }}
            aria-label="Начало периода"
          />
          <span className={styles.dateDash}>—</span>
          <input
            type="date"
            className={styles.dateInput}
            value={to}
            min={from}
            onChange={(e) => {
              setTo(e.target.value);
              setPreset('');
            }}
            aria-label="Конец периода"
          />
        </div>
        <div className={styles.presets} role="group" aria-label="Быстрый выбор периода">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={preset === p.key ? `${styles.presetBtn} ${styles.presetActive}` : styles.presetBtn}
              aria-pressed={preset === p.key}
              onClick={() => applyPreset(p)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {!shopSlug && !error && (
        <p className={styles.hint}>Выберите магазин, чтобы увидеть продажи за период.</p>
      )}
      {loading && <p className={styles.hint}>Загрузка отчёта…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {report && !loading && !error && (
        <>
          <div className={styles.stats}>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{report.ordersCount}</span>
              <span className={styles.statLabel}>заказов</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{report.itemsCount}</span>
              <span className={styles.statLabel}>{pluralMolds(report.itemsCount)} куплено</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>{formatRub(report.totalKopecks)} ₽</span>
              <span className={styles.statLabel}>общая сумма</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statValue}>
                {report.ordersCount > 0
                  ? `${formatRub(Math.round(report.totalKopecks / report.ordersCount))} ₽`
                  : '—'}
              </span>
              <span className={styles.statLabel}>средний чек</span>
            </div>
            {shopSlug !== OWN_SHOP_SLUG && (
              <div className={`${styles.statCard} ${styles.statCardCommission}`}>
                <span className={styles.statValue}>
                  {formatRub(Math.round(report.totalKopecks * COMMISSION_RATE))} ₽
                </span>
                <span className={styles.statLabel}>к выплате комиссий (20% от оборота)</span>
              </div>
            )}
          </div>

          {report.products?.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thName}>Товар</th>
                  <th className={styles.thNum}>Кол-во</th>
                  <th className={styles.thNum}>Сумма</th>
                </tr>
              </thead>
              <tbody>
                {report.products.map((p) => (
                  <tr key={p.productName}>
                    <td className={styles.tdName}>{p.productName}</td>
                    <td className={styles.tdNum}>{p.quantity}</td>
                    <td className={styles.tdNum}>
                      {p.totalKopecks != null ? `${formatRub(p.totalKopecks)} ₽` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.hint}>За выбранный период оплаченных заказов нет.</p>
          )}
        </>
      )}
    </div>
  );
};

export default ShopSalesReport;
