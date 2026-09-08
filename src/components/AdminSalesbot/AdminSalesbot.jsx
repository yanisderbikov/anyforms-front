import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { RefreshButton } from '../AdminInvoices/invoiceShared';
import {
  fetchSalesbotConfig,
  fetchSalesbots,
  fetchPipelines,
  createFunnel,
  updateFunnel,
  deleteFunnel,
  createStep,
  updateStep,
  moveStep,
  deleteStep,
  errorMessage,
  parsePositiveInt,
  amoPipelineUrl,
  sortBots,
  pipelineNameMaps,
} from './salesbotApi';
import { BotPicker, PipelinePicker } from './SalesbotPickers';
import styles from './AdminSalesbot.module.css';

const typeStatus = (t) => {
  if (!t.drip) return { label: 'служебный', className: styles.badgeMuted };
  if (!t.funnel) return { label: 'нет воронки', className: styles.badgeOff };
  if (t.steps.length === 0) return { label: 'нет ботов', className: styles.badgeOff };
  return { label: 'работает', className: styles.badgeOn };
};

// Воронка/статус amoCRM, где ищутся лиды типа (order_type_funnel). Редактируется на месте.
const FunnelBlock = ({ type, funnel, onChanged, pipelines, pipelinesError, pipelineNames }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ pipelineId: '', statusId: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const startEdit = () => {
    setDraft({
      pipelineId: funnel ? String(funnel.pipelineId) : '',
      statusId: funnel ? String(funnel.statusId) : '',
    });
    setError('');
    setEditing(true);
  };

  const cancel = () => {
    setEditing(false);
    setError('');
  };

  const save = async (e) => {
    e.preventDefault();
    const pipeline = parsePositiveInt(draft.pipelineId);
    const status = parsePositiveInt(draft.statusId);
    if (!pipeline || !status) {
      setError('Выберите воронку и статус или введите их id из amoCRM.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { type, pipelineId: pipeline, statusId: status };
      if (funnel) {
        await updateFunnel(funnel.id, payload);
        toast.success('Воронка обновлена');
      } else {
        await createFunnel(payload);
        toast.success('Воронка задана');
      }
      setEditing(false);
      await onChanged();
    } catch (err) {
      setError(errorMessage(err, 'Не удалось сохранить воронку'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm('Удалить воронку? Тип перестанет обрабатываться, цепочка ботов сохранится.')) return;
    try {
      await deleteFunnel(funnel.id);
      toast.success('Воронка удалена');
      await onChanged();
    } catch (err) {
      toast.error(errorMessage(err, 'Не удалось удалить воронку'));
    }
  };

  if (editing) {
    return (
      <form className={styles.inlineForm} onSubmit={save}>
        <label className={styles.label}>
          Воронка и статус
          <PipelinePicker
            pipelines={pipelines}
            pipelinesError={pipelinesError}
            pipelineId={draft.pipelineId}
            statusId={draft.statusId}
            onChange={setDraft}
            autoFocus
          />
        </label>
        <div className={styles.inlineActions}>
          <button type="submit" className={styles.primaryBtn} disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
          <button type="button" className={styles.ghostBtn} onClick={cancel}>
            Отмена
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </form>
    );
  }

  const pipelineName = funnel ? funnel.pipelineName || pipelineNames.pipelines[funnel.pipelineId] : null;
  const statusName = funnel ? funnel.statusName || pipelineNames.statuses[funnel.statusId] : null;

  return (
    <div className={styles.row}>
      {funnel ? (
        <p className={styles.rowText}>
          воронка{' '}
          <a
            className={styles.amoLink}
            href={amoPipelineUrl(funnel.pipelineId)}
            target="_blank"
            rel="noreferrer"
            title="Открыть воронку в amoCRM"
          >
            {pipelineName || funnel.pipelineId}
          </a>
          {pipelineName && <span className={styles.botId}>{funnel.pipelineId}</span>}
          {' · '}статус <b>{statusName || funnel.statusId}</b>
          {statusName && <span className={styles.botId}>{funnel.statusId}</span>}
        </p>
      ) : (
        <p className={styles.rowTextMuted}>Воронка не задана — лиды этого типа не ищутся, боты не уходят.</p>
      )}
      <div className={styles.rowActions}>
        <button type="button" className={styles.editBtn} onClick={startEdit}>
          {funnel ? 'Изменить' : 'Задать воронку'}
        </button>
        {funnel && (
          <button type="button" className={styles.deleteBtn} onClick={remove}>
            Удалить
          </button>
        )}
      </div>
    </div>
  );
};

// Ячейка «бот»: название из amoCRM (с бэка или из загруженного списка) и id.
const BotCell = ({ botId, botName, botNames }) => {
  const name = botName || botNames[botId];
  return name ? (
    <>
      <span className={styles.botName}>{name}</span>
      <span className={styles.botId}>{botId}</span>
    </>
  ) : (
    <span className={styles.botIdOnly}>{botId}</span>
  );
};

// Один шаг цепочки (bot_sequence): порядок меняется стрелками, бот — на месте.
const StepRow = ({ type, step, index, count, busy, onMove, onChanged, bots, botsError, botNames }) => {
  const [editing, setEditing] = useState(false);
  const [botId, setBotId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const startEdit = () => {
    setBotId(String(step.botId));
    setError('');
    setEditing(true);
  };

  const save = async (e) => {
    e.preventDefault();
    const bot = parsePositiveInt(botId);
    if (!bot) {
      setError('Выберите бота из списка или введите его id.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateStep(step.id, { botId: bot });
      toast.success(`Шаг ${step.position} обновлён`);
      setEditing(false);
      await onChanged();
    } catch (err) {
      setError(errorMessage(err, 'Не удалось сохранить шаг'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm(`Удалить шаг ${step.position} (бот ${step.botName || step.botId})?`)) return;
    try {
      await deleteStep(step.id);
      toast.success(`Шаг ${step.position} удалён`);
      await onChanged();
    } catch (err) {
      toast.error(errorMessage(err, 'Не удалось удалить шаг'));
    }
  };

  if (editing) {
    return (
      <tr className={styles.editRow}>
        <td colSpan={3}>
          <form className={styles.inlineForm} onSubmit={save}>
            <label className={styles.label}>
              Бот на шаге {step.position}
              <BotPicker bots={bots} botsError={botsError} value={botId} onChange={setBotId} autoFocus />
            </label>
            <div className={styles.inlineActions}>
              <button type="submit" className={styles.primaryBtn} disabled={saving}>
                {saving ? 'Сохранение…' : 'Сохранить'}
              </button>
              <button type="button" className={styles.ghostBtn} onClick={() => setEditing(false)}>
                Отмена
              </button>
            </div>
            {error && <p className={styles.error}>{error}</p>}
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className={styles.tdPos}>{step.position}</td>
      <td className={styles.tdBot}>
        <BotCell botId={step.botId} botName={step.botName} botNames={botNames} />
      </td>
      <td className={styles.tdActions}>
        <span className={styles.arrows}>
          <button
            type="button"
            className={styles.arrowBtn}
            onClick={() => onMove(step, 'UP')}
            disabled={busy || index === 0}
            aria-label={`Шаг ${step.position}: выше`}
            title="Выше"
          >
            ↑
          </button>
          <button
            type="button"
            className={styles.arrowBtn}
            onClick={() => onMove(step, 'DOWN')}
            disabled={busy || index === count - 1}
            aria-label={`Шаг ${step.position}: ниже`}
            title="Ниже"
          >
            ↓
          </button>
        </span>
        <button type="button" className={styles.editBtn} onClick={startEdit} disabled={busy}>
          Изменить
        </button>
        <button type="button" className={styles.deleteBtn} onClick={remove} disabled={busy}>
          Удалить
        </button>
      </td>
    </tr>
  );
};

// Добавление бота: всегда в конец цепочки, позицию назначает бэк.
const AddStepForm = ({ type, nextPosition, onChanged, bots, botsError }) => {
  const [botId, setBotId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const bot = parsePositiveInt(botId);
    if (!bot) {
      setError('Выберите бота из списка или введите его id.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const created = await createStep({ type, botId: bot });
      toast.success(`Бот ${created.botName || bot} добавлен на шаг ${created.position}`);
      setBotId('');
      await onChanged();
    } catch (err) {
      setError(errorMessage(err, 'Не удалось добавить шаг'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.addForm} onSubmit={submit}>
      <label className={styles.label}>
        Новый бот — встанет на шаг {nextPosition}
        <BotPicker bots={bots} botsError={botsError} value={botId} onChange={setBotId} />
      </label>
      <div className={styles.inlineActions}>
        <button type="submit" className={styles.primaryBtn} disabled={saving}>
          {saving ? 'Добавление…' : 'Добавить в конец'}
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
};

const TypeCard = ({ config, onChanged, bots, botsError, botNames, pipelines, pipelinesError, pipelineNames }) => {
  const status = typeStatus(config);
  const nextPosition = config.steps.reduce((max, s) => Math.max(max, s.position), 0) + 1;
  // Пока идёт перестановка — стрелки и кнопки шагов заблокированы, чтобы не наслаивать запросы.
  const [moving, setMoving] = useState(false);

  const handleMove = async (step, direction) => {
    setMoving(true);
    try {
      await moveStep(step.id, direction);
      await onChanged();
    } catch (err) {
      toast.error(errorMessage(err, 'Не удалось переставить шаг'));
    } finally {
      setMoving(false);
    }
  };

  const stepsTable = (editable) => (
    <table className={styles.table}>
      <thead>
        <tr>
          <th className={styles.thPos}>шаг</th>
          <th className={styles.thBot}>бот в amocrm</th>
          <th className={styles.thActions} />
        </tr>
      </thead>
      <tbody>
        {config.steps.map((s, index) =>
          editable ? (
            <StepRow
              key={s.id}
              type={config.type}
              step={s}
              index={index}
              count={config.steps.length}
              busy={moving}
              onMove={handleMove}
              onChanged={onChanged}
              bots={bots}
              botsError={botsError}
              botNames={botNames}
            />
          ) : (
            <tr key={s.id}>
              <td className={styles.tdPos}>{s.position}</td>
              <td className={styles.tdBot}>
                <BotCell botId={s.botId} botName={s.botName} botNames={botNames} />
              </td>
              <td className={styles.tdActions} />
            </tr>
          )
        )}
      </tbody>
    </table>
  );

  return (
    <section className={styles.card}>
      <header className={styles.cardHead}>
        <div className={styles.cardHeadText}>
          <h2 className={styles.cardTitle}>
            {config.label} <span className={styles.typeCode}>{config.type}</span>
          </h2>
          <p className={styles.cardDesc}>{config.description}</p>
        </div>
        <span className={`${styles.badge} ${status.className}`}>{status.label}</span>
      </header>

      {config.drip ? (
        <>
          <h3 className={styles.blockTitle}>где искать лидов</h3>
          <FunnelBlock
            type={config.type}
            funnel={config.funnel}
            onChanged={onChanged}
            pipelines={pipelines}
            pipelinesError={pipelinesError}
            pipelineNames={pipelineNames}
          />

          <h3 className={styles.blockTitle}>цепочка ботов</h3>
          {config.steps.length === 0 ? (
            <p className={styles.rowTextMuted}>Ботов пока нет — добавьте первого.</p>
          ) : (
            stepsTable(true)
          )}
          <AddStepForm
            type={config.type}
            nextPosition={nextPosition}
            onChanged={onChanged}
            bots={bots}
            botsError={botsError}
          />
        </>
      ) : (
        <>
          <p className={styles.rowTextMuted}>
            Служебный тип: записи в журнал пишет само приложение, воронка и цепочка не настраиваются.
          </p>
          {config.steps.length > 0 && stepsTable(false)}
        </>
      )}
    </section>
  );
};

/**
 * Страница «Цепочки»: настройки дрип-кампании SalesBot по типам заказа —
 * воронка/статус amoCRM (order_type_funnel) и порядок ботов (bot_sequence).
 */
const AdminSalesbot = () => {
  const [config, setConfig] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pageError, setPageError] = useState('');
  // Справочники amoCRM для выбора по имени; при ошибке остаётся ручной ввод id.
  const [bots, setBots] = useState([]);
  const [botsError, setBotsError] = useState('');
  const [botsLoading, setBotsLoading] = useState(true);
  const [pipelines, setPipelines] = useState([]);
  const [pipelinesError, setPipelinesError] = useState('');

  const loadBots = useCallback(async (refresh = false) => {
    setBotsLoading(true);
    try {
      setBots(sortBots(await fetchSalesbots(refresh)));
      setBotsError('');
    } catch (err) {
      setBotsError(errorMessage(err, 'Не удалось загрузить список ботов из amoCRM'));
    } finally {
      setBotsLoading(false);
    }
  }, []);

  const loadPipelines = useCallback(async (refresh = false) => {
    try {
      setPipelines(await fetchPipelines(refresh));
      setPipelinesError('');
    } catch (err) {
      setPipelinesError(errorMessage(err, 'Не удалось загрузить список воронок из amoCRM'));
    }
  }, []);

  useEffect(() => {
    loadBots();
    loadPipelines();
  }, [loadBots, loadPipelines]);

  const botNames = useMemo(() => Object.fromEntries(bots.map((b) => [b.id, b.name])), [bots]);
  const pipelineNames = useMemo(() => pipelineNameMaps(pipelines), [pipelines]);

  const load = useCallback(async () => {
    try {
      const data = await fetchSalesbotConfig();
      setConfig(Array.isArray(data) ? data : []);
      setPageError('');
    } catch (err) {
      setPageError(errorMessage(err, 'Не удалось загрузить настройки ботов'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([load(), loadBots(true), loadPipelines(true)]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>боты amoCRM</h1>
          <p className={styles.subtitle}>Дрип-цепочки: где искать лидов и какие боты уходят по порядку</p>
        </div>
        <RefreshButton onClick={handleRefresh} refreshing={refreshing} label="Обновить настройки и справочники amoCRM" />
      </header>

      <aside className={styles.note}>
        <p>
          По расписанию каждому лиду в целевом статусе уходит <b>первая позиция цепочки без успешной отправки</b>.
          Клиент ответил → сделка сменила статус → боты ему больше не уходят.
        </p>
        <p>
          Новый бот встаёт <b>в конец</b>, порядок меняется стрелками. Один и тот же бот одному лиду повторно
          не уходит, даже если цепочку переставили — но лиды в работе получат переставленные шаги в новом порядке.
        </p>
      </aside>

      {pageError && <p className={styles.banner}>{pageError}</p>}
      {botsError && !botsLoading && (
        <p className={styles.bannerWarn}>
          Боты amoCRM не загрузились ({botsError}) — имена не показываются, id можно ввести вручную.{' '}
          <button type="button" className={styles.linkBtn} onClick={() => loadBots(true)}>
            повторить
          </button>
        </p>
      )}
      {!botsError && !botsLoading && bots.length === 0 && (
        <p className={styles.bannerWarn}>В amoCRM не найдено ни одного SalesBot — id придётся ввести вручную.</p>
      )}
      {pipelinesError && (
        <p className={styles.bannerWarn}>
          Воронки amoCRM не загрузились ({pipelinesError}) — воронку и статус можно задать по id.{' '}
          <button type="button" className={styles.linkBtn} onClick={() => loadPipelines(true)}>
            повторить
          </button>
        </p>
      )}
      {loading ? (
        <p className={styles.rowTextMuted}>Загрузка настроек…</p>
      ) : (
        config.map((t) => (
          <TypeCard
            key={t.type}
            config={t}
            onChanged={load}
            bots={bots}
            botsError={botsError}
            botNames={botNames}
            pipelines={pipelines}
            pipelinesError={pipelinesError}
            pipelineNames={pipelineNames}
          />
        ))
      )}
    </div>
  );
};

export default AdminSalesbot;
