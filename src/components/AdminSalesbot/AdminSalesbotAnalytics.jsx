import React, { useEffect, useMemo, useState } from 'react';
import { formatDate } from '../AdminInvoices/invoiceShared';
import {
  fetchOrderTypes,
  fetchSalesbotAnalytics,
  fetchSalesbotLogs,
  errorMessage,
  STATUS_LABELS,
  amoLeadUrl,
  parsePositiveInt,
} from './salesbotApi';
import styles from './AdminSalesbotAnalytics.module.css';

const PAGE_SIZE = 50;

// Локальная дата YYYY-MM-DD (toISOString сдвигает день из-за UTC).
const toInputDate = (d) => {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

// Пустые границы — без ограничения периода.
const PRESETS = [
  { key: 'all', label: 'всё время', range: () => ['', ''] },
  { key: '7d', label: '7 дней', range: () => [toInputDate(daysAgo(6)), toInputDate(new Date())] },
  { key: '30d', label: '30 дней', range: () => [toInputDate(daysAgo(29)), toInputDate(new Date())] },
  {
    key: 'month',
    label: 'этот месяц',
    range: () => {
      const now = new Date();
      return [toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)), toInputDate(now)];
    },
  },
  {
    key: 'year',
    label: 'этот год',
    range: () => {
      const now = new Date();
      return [toInputDate(new Date(now.getFullYear(), 0, 1)), toInputDate(now)];
    },
  },
];

const STATUS_CLASS = {
  SUCCESS: 'statusOk',
  FAILED: 'statusFailed',
  MESSAGE_SEND_FAILED: 'statusBlocked',
};

const percent = (share) => (share == null ? '—' : `${Math.round(share * 100)}%`);

// position = 0 — ручной массовый запуск (вне цепочки).
const positionLabel = (position) => (position === 0 ? 'ручной' : position ?? '—');

const StatCard = ({ value, label, accent }) => (
  <div className={accent ? `${styles.statCard} ${styles.statCardAccent}` : styles.statCard}>
    <span className={styles.statValue}>{value}</span>
    <span className={styles.statLabel}>{label}</span>
  </div>
);

// Разбивка по шагам цепочки одного типа; строка с максимумом недоставленных подсвечена.
const TypeTable = ({ data }) => {
  const worst = data.steps.reduce((max, s) => Math.max(max, s.blocked), 0);
  const launched = data.sent + data.blocked;
  return (
    <section className={styles.typeSection}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>
          {data.label} <span className={styles.typeCode}>{data.type}</span>
        </h2>
        <span className={styles.count}>
          ушло {launched} · не доставлено {data.blocked} · не запущено {data.failed}
        </span>
      </div>
      <div className={styles.tableScroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thNum}>шаг</th>
              <th className={styles.thBot}>бот</th>
              <th className={styles.thNum}>ушло</th>
              <th className={styles.thNum}>не доставлено</th>
              <th className={styles.thShare}>доля блокировок</th>
              <th className={styles.thNum}>не запущено</th>
            </tr>
          </thead>
          <tbody>
            {data.steps.map((s) => {
              const isWorst = worst > 0 && s.blocked === worst;
              return (
                <tr key={`${s.position}-${s.botId}`} className={isWorst ? styles.rowWorst : undefined}>
                  <td className={styles.tdNum}>{positionLabel(s.position)}</td>
                  <td className={styles.tdBot}>
                    {s.botName && <span className={styles.botName}>{s.botName}</span>}
                    <span className={s.botName ? styles.botId : undefined}>{s.botId}</span>
                    {!s.inSequence && (
                      <span className={styles.stale} title="Этого бота на этой позиции в текущей цепочке нет">
                        не в цепочке
                      </span>
                    )}
                  </td>
                  <td className={styles.tdNum}>{s.sent + s.blocked}</td>
                  <td className={s.blocked > 0 ? `${styles.tdNum} ${styles.tdBlocked}` : styles.tdNum}>
                    {s.blocked}
                  </td>
                  <td className={styles.tdShare}>
                    <div className={styles.shareWrap}>
                      <span className={styles.bar} aria-hidden="true">
                        <span
                          className={styles.barFill}
                          style={{ width: `${Math.round((s.blockedShare || 0) * 100)}%` }}
                        />
                      </span>
                      <span className={styles.shareText}>{percent(s.blockedShare)}</span>
                    </div>
                  </td>
                  <td className={styles.tdNum}>{s.failed}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

/**
 * Страница «Аналитика» ботов: по журналу bot_execution_log показывает, на каком шаге
 * цепочки amoCRM перестаёт доставлять сообщения (MESSAGE_SEND_FAILED), и сам журнал
 * с фильтрами. Период — календарные дни по Москве.
 */
const AdminSalesbotAnalytics = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [preset, setPreset] = useState('all');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [orderTypes, setOrderTypes] = useState([]);
  const [logType, setLogType] = useState('');
  const [logStatus, setLogStatus] = useState('MESSAGE_SEND_FAILED');
  const [leadIdInput, setLeadIdInput] = useState('');
  const [leadId, setLeadId] = useState('');
  const [leadError, setLeadError] = useState('');
  const [page, setPage] = useState(0);
  const [logs, setLogs] = useState(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState('');

  const typeLabels = useMemo(
    () => Object.fromEntries(orderTypes.map((t) => [t.value, t.label])),
    [orderTypes]
  );

  useEffect(() => {
    fetchOrderTypes()
      .then((data) => setOrderTypes(Array.isArray(data) ? data : []))
      .catch(() => setOrderTypes([]));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchSalesbotAnalytics({ from: from || undefined, to: to || undefined })
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setReport(null);
          setError(errorMessage(err, 'Не удалось загрузить аналитику'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [from, to]);

  useEffect(() => {
    let cancelled = false;
    setLogsLoading(true);
    setLogsError('');
    fetchSalesbotLogs({
      type: logType || undefined,
      status: logStatus || undefined,
      leadId: leadId || undefined,
      from: from || undefined,
      to: to || undefined,
      page,
      size: PAGE_SIZE,
    })
      .then((data) => {
        if (!cancelled) setLogs(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setLogs(null);
          setLogsError(errorMessage(err, 'Не удалось загрузить журнал'));
        }
      })
      .finally(() => {
        if (!cancelled) setLogsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [logType, logStatus, leadId, from, to, page]);

  const applyPreset = (p) => {
    const [start, end] = p.range();
    setPreset(p.key);
    setFrom(start);
    setTo(end);
    setPage(0);
  };

  const changeFrom = (value) => {
    setFrom(value);
    setPreset('');
    setPage(0);
  };

  const changeTo = (value) => {
    setTo(value);
    setPreset('');
    setPage(0);
  };

  const applyLeadFilter = (e) => {
    e.preventDefault();
    const trimmed = leadIdInput.trim();
    if (trimmed && !parsePositiveInt(trimmed)) {
      setLeadError('ID сделки — положительное целое число.');
      return;
    }
    setLeadError('');
    setLeadId(trimmed);
    setPage(0);
  };

  const resetLeadFilter = () => {
    setLeadIdInput('');
    setLeadId('');
    setLeadError('');
    setPage(0);
  };

  const totals = report?.totals;
  const launched = totals ? totals.sent + totals.blocked : 0;
  const overallShare = launched > 0 ? totals.blocked / launched : null;
  const totalPages = logs?.totalPages ?? 0;

  return (
    <div className={styles.wrap}>
      <header className={styles.pageHead}>
        <h1 className={styles.title}>аналитика ботов</h1>
        <p className={styles.subtitle}>На каком шаге цепочки amoCRM перестаёт доставлять сообщения</p>
      </header>

      <div className={styles.controls}>
        <div className={styles.dates}>
          <input
            type="date"
            className={styles.dateInput}
            value={from}
            max={to || undefined}
            onChange={(e) => changeFrom(e.target.value)}
            aria-label="Начало периода"
          />
          <span className={styles.dateDash}>—</span>
          <input
            type="date"
            className={styles.dateInput}
            value={to}
            min={from || undefined}
            onChange={(e) => changeTo(e.target.value)}
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

      {loading && <p className={styles.hint}>Загрузка аналитики…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {report && !loading && !error && (
        <>
          <div className={styles.stats}>
            <StatCard value={launched} label="запусков ушло в amoCRM" />
            <StatCard value={totals.blocked} label="не доставлено — заблокировали или недоступен" accent />
            <StatCard value={percent(overallShare)} label="доля недоставленных" />
            <StatCard value={totals.failed} label="не запущено — лид вышел из статуса" />
            <StatCard value={totals.leads} label="лидов в журнале" />
          </div>

          {report.types.length === 0 ? (
            <p className={styles.hint}>За период записей в журнале нет.</p>
          ) : (
            report.types.map((t) => <TypeTable key={t.type} data={t} />)
          )}
        </>
      )}

      <section className={styles.logsSection}>
        <div className={styles.sectionHead}>
          <h2 className={styles.sectionTitle}>журнал запусков</h2>
          {logs && <span className={styles.count}>{logs.totalElements} записей</span>}
        </div>
        <div className={styles.logFilters}>
          <select
            className={styles.select}
            value={logType}
            onChange={(e) => {
              setLogType(e.target.value);
              setPage(0);
            }}
            aria-label="Тип заказа"
          >
            <option value="">все типы</option>
            {orderTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            className={styles.select}
            value={logStatus}
            onChange={(e) => {
              setLogStatus(e.target.value);
              setPage(0);
            }}
            aria-label="Статус"
          >
            <option value="">все статусы</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <form className={styles.leadForm} onSubmit={applyLeadFilter}>
            <input
              className={styles.leadInput}
              inputMode="numeric"
              placeholder="ID сделки"
              value={leadIdInput}
              onChange={(e) => setLeadIdInput(e.target.value)}
              aria-label="ID сделки"
            />
            <button type="submit" className={styles.leadBtn}>
              Найти
            </button>
            {leadId && (
              <button type="button" className={styles.leadReset} onClick={resetLeadFilter}>
                Сбросить
              </button>
            )}
          </form>
        </div>
        {leadError && <p className={styles.error}>{leadError}</p>}
        {logsError && <p className={styles.error}>{logsError}</p>}
        {logsLoading && !logs && <p className={styles.hint}>Загрузка журнала…</p>}
        {logs && logs.content.length === 0 && <p className={styles.hint}>Записей по фильтру нет.</p>}
        {logs && logs.content.length > 0 && (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thLeft}>когда (мск)</th>
                  <th className={styles.thLeft}>сделка</th>
                  <th className={styles.thLeft}>тип</th>
                  <th className={styles.thNum}>шаг</th>
                  <th className={styles.thBot}>бот</th>
                  <th className={styles.thLeft}>статус</th>
                </tr>
              </thead>
              <tbody>
                {logs.content.map((row) => (
                  <tr key={row.id}>
                    <td className={styles.tdNowrap}>{formatDate(row.dateExecuted)}</td>
                    <td>
                      <a className={styles.leadLink} href={amoLeadUrl(row.leadId)} target="_blank" rel="noreferrer">
                        {row.leadId}
                      </a>
                    </td>
                    <td>{typeLabels[row.type] || row.type}</td>
                    <td className={styles.tdNum}>{positionLabel(row.position)}</td>
                    <td className={styles.tdBot}>
                      {row.botName && <span className={styles.botName}>{row.botName}</span>}
                      <span className={row.botName ? styles.botId : undefined}>{row.botId}</span>
                    </td>
                    <td>
                      <span className={`${styles.status} ${styles[STATUS_CLASS[row.status]] || ''}`}>
                        {STATUS_LABELS[row.status] || row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className={styles.pager}>
            <button
              type="button"
              className={styles.pagerBtn}
              disabled={page === 0 || logsLoading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ← Назад
            </button>
            <span className={styles.pagerText}>
              стр. {page + 1} из {totalPages}
            </span>
            <button
              type="button"
              className={styles.pagerBtn}
              disabled={page + 1 >= totalPages || logsLoading}
              onClick={() => setPage((p) => p + 1)}
            >
              Вперёд →
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminSalesbotAnalytics;
