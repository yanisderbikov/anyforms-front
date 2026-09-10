import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { RefreshButton } from '../AdminInvoices/invoiceShared';
import {
  fetchGroups,
  fetchSalesbots,
  fetchPipelines,
  createGroup,
  updateGroup,
  deleteGroup,
  createStep,
  updateStep,
  moveStep,
  deleteStep,
  errorMessage,
  parsePositiveInt,
  amoPipelineUrl,
  sortBots,
  pipelineNameMaps,
  minutesToDelay,
  delayToMinutes,
  delayLabel,
} from './salesbotApi';
import { BotPicker, PipelinePicker } from './SalesbotPickers';
import styles from './AdminSalesbot.module.css';

const groupStatus = (g) => {
  if (!g.enabled) return { label: 'на паузе', className: styles.badgeMuted };
  if (!g.pipelineId) return { label: 'нет воронки', className: styles.badgeOff };
  if (g.steps.length === 0) return { label: 'нет ботов', className: styles.badgeOff };
  return { label: 'работает', className: styles.badgeOn };
};

// Запрос на обновление группы: бэк ждёт все поля целиком.
const groupPayload = (group, patch) => ({
  name: group.name,
  pipelineId: group.pipelineId,
  statusId: group.statusId,
  enabled: group.enabled,
  sendFrom: group.sendFrom,
  sendTo: group.sendTo,
  ...patch,
});

// Окно отправки по умолчанию (salesbot.run.window-msk на бэке) — показываем, когда у группы своего нет.
const DEFAULT_SEND_WINDOW = '09:00–21:00';

// Окно отправки группы: в какие часы по Москве могут уходить боты. Пусто — окно по умолчанию.
const SendWindowBlock = ({ group, onChanged }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ from: '', to: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const custom = Boolean(group.sendFrom && group.sendTo);

  const startEdit = () => {
    setDraft({ from: group.sendFrom || '10:00', to: group.sendTo || '17:00' });
    setError('');
    setEditing(true);
  };

  const save = async (e, reset = false) => {
    e.preventDefault();
    if (!reset && (!draft.from || !draft.to)) {
      setError('Укажите начало и конец окна.');
      return;
    }
    if (!reset && draft.from >= draft.to) {
      setError('Начало окна должно быть раньше конца.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateGroup(
        group.id,
        groupPayload(group, reset ? { sendFrom: null, sendTo: null } : { sendFrom: draft.from, sendTo: draft.to })
      );
      toast.success(reset ? 'Окно сброшено на общее' : 'Окно отправки сохранено');
      setEditing(false);
      await onChanged();
    } catch (err) {
      setError(errorMessage(err, 'Не удалось сохранить окно'));
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <form className={styles.inlineForm} onSubmit={save}>
        <label className={styles.label}>
          С (мск)
          <input
            type="time"
            className={`${styles.input} ${styles.inputTime}`}
            value={draft.from}
            onChange={(e) => setDraft({ ...draft, from: e.target.value })}
            autoFocus
          />
        </label>
        <label className={styles.label}>
          До (мск)
          <input
            type="time"
            className={`${styles.input} ${styles.inputTime}`}
            value={draft.to}
            onChange={(e) => setDraft({ ...draft, to: e.target.value })}
          />
        </label>
        <div className={styles.inlineActions}>
          <button type="submit" className={styles.primaryBtn} disabled={saving}>
            {saving ? 'Сохранение…' : 'Сохранить'}
          </button>
          {custom && (
            <button type="button" className={styles.ghostBtn} onClick={(e) => save(e, true)} disabled={saving}>
              Сбросить на общее
            </button>
          )}
          <button type="button" className={styles.ghostBtn} onClick={() => setEditing(false)}>
            Отмена
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </form>
    );
  }

  return (
    <div className={styles.row}>
      <p className={custom ? styles.rowText : styles.rowTextMuted}>
        {custom ? (
          <>
            боты уходят с <b>{group.sendFrom}</b> до <b>{group.sendTo}</b> по Москве
          </>
        ) : (
          <>общее окно {DEFAULT_SEND_WINDOW} по Москве — задайте своё, если нужно другое время</>
        )}
      </p>
      <div className={styles.rowActions}>
        <button type="button" className={styles.editBtn} onClick={startEdit}>
          {custom ? 'Изменить' : 'Задать окно'}
        </button>
      </div>
    </div>
  );
};

// Воронка/статус amoCRM, где ищутся лиды группы. Редактируется на месте.
const FunnelBlock = ({ group, onChanged, pipelines, pipelinesError, pipelineNames }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ pipelineId: '', statusId: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const hasFunnel = group.pipelineId != null;

  const startEdit = () => {
    setDraft({
      pipelineId: hasFunnel ? String(group.pipelineId) : '',
      statusId: hasFunnel ? String(group.statusId) : '',
    });
    setError('');
    setEditing(true);
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
      await updateGroup(group.id, groupPayload(group, { pipelineId: pipeline, statusId: status }));
      toast.success('Воронка сохранена');
      setEditing(false);
      await onChanged();
    } catch (err) {
      setError(errorMessage(err, 'Не удалось сохранить воронку'));
    } finally {
      setSaving(false);
    }
  };

  const clear = async () => {
    if (!window.confirm('Убрать воронку? Группа перестанет обрабатываться, цепочка ботов сохранится.')) return;
    try {
      await updateGroup(group.id, groupPayload(group, { pipelineId: null, statusId: null }));
      toast.success('Воронка убрана');
      await onChanged();
    } catch (err) {
      toast.error(errorMessage(err, 'Не удалось убрать воронку'));
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
          <button type="button" className={styles.ghostBtn} onClick={() => setEditing(false)}>
            Отмена
          </button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </form>
    );
  }

  const pipelineName = hasFunnel ? group.pipelineName || pipelineNames.pipelines[group.pipelineId] : null;
  const statusName = hasFunnel ? group.statusName || pipelineNames.statuses[group.statusId] : null;

  return (
    <div className={styles.row}>
      {hasFunnel ? (
        <p className={styles.rowText}>
          воронка{' '}
          <a
            className={styles.amoLink}
            href={amoPipelineUrl(group.pipelineId)}
            target="_blank"
            rel="noreferrer"
            title="Открыть воронку в amoCRM"
          >
            {pipelineName || group.pipelineId}
          </a>
          {pipelineName && <span className={styles.botId}>{group.pipelineId}</span>}
          {' · '}статус <b>{statusName || group.statusId}</b>
          {statusName && <span className={styles.botId}>{group.statusId}</span>}
        </p>
      ) : (
        <p className={styles.rowTextMuted}>Воронка не задана — лиды не ищутся, боты не уходят.</p>
      )}
      <div className={styles.rowActions}>
        <button type="button" className={styles.editBtn} onClick={startEdit}>
          {hasFunnel ? 'Изменить' : 'Задать воронку'}
        </button>
        {hasFunnel && (
          <button type="button" className={styles.deleteBtn} onClick={clear}>
            Убрать
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

// Задержка шага: дни и часы. Для шага 1 — от попадания сделки в статус, дальше — от предыдущей отправки.
const DelayFields = ({ days, hours, onChange }) => (
  <div className={styles.delayFields}>
    <label className={styles.delayField}>
      <input
        className={`${styles.input} ${styles.inputShort}`}
        inputMode="numeric"
        value={days}
        onChange={(e) => onChange({ days: e.target.value, hours })}
        aria-label="Дней"
      />
      <span className={styles.delayUnit}>дн.</span>
    </label>
    <label className={styles.delayField}>
      <input
        className={`${styles.input} ${styles.inputShort}`}
        inputMode="numeric"
        value={hours}
        onChange={(e) => onChange({ days, hours: e.target.value })}
        aria-label="Часов"
      />
      <span className={styles.delayUnit}>ч.</span>
    </label>
  </div>
);

// Один шаг цепочки (bot_sequence): порядок меняется стрелками, бот и задержка — на месте.
const StepRow = ({ step, index, count, busy, onMove, onChanged, bots, botsError, botNames }) => {
  const [editing, setEditing] = useState(false);
  const [botId, setBotId] = useState('');
  const [delay, setDelay] = useState({ days: '1', hours: '0' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const startEdit = () => {
    const d = minutesToDelay(step.delayMinutes);
    setBotId(String(step.botId));
    setDelay({ days: String(d.days), hours: String(d.hours) });
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
    const delayMinutes = delayToMinutes(delay.days, delay.hours);
    if (delayMinutes === null) {
      setError('Задержка: дни — целое от 0, часы — целое от 0 до 23.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await updateStep(step.id, { botId: bot, delayMinutes });
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
            <div className={styles.label}>
              {index === 0 ? 'Через сколько после попадания в статус' : 'Через сколько после предыдущего шага'}
              <DelayFields days={delay.days} hours={delay.hours} onChange={setDelay} />
            </div>
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
        <span className={styles.delayTag} title={index === 0 ? 'после попадания сделки в статус' : 'после предыдущего шага'}>
          через {delayLabel(step.delayMinutes)}
        </span>
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
const AddStepForm = ({ groupId, nextPosition, onChanged, bots, botsError }) => {
  const [botId, setBotId] = useState('');
  const [delay, setDelay] = useState({ days: '1', hours: '0' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const bot = parsePositiveInt(botId);
    if (!bot) {
      setError('Выберите бота из списка или введите его id.');
      return;
    }
    const delayMinutes = delayToMinutes(delay.days, delay.hours);
    if (delayMinutes === null) {
      setError('Задержка: дни — целое от 0, часы — целое от 0 до 23.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const created = await createStep({ groupId, botId: bot, delayMinutes });
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
      <div className={styles.label}>
        {nextPosition === 1 ? 'Через сколько после попадания в статус' : 'Через сколько после предыдущего шага'}
        <DelayFields days={delay.days} hours={delay.hours} onChange={setDelay} />
      </div>
      <div className={styles.inlineActions}>
        <button type="submit" className={styles.primaryBtn} disabled={saving}>
          {saving ? 'Добавление…' : 'Добавить в конец'}
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
};

// Карточка группы: название (правится на месте), пауза, удаление, воронка и цепочка.
const GroupCard = ({ group, onChanged, bots, botsError, botNames, pipelines, pipelinesError, pipelineNames }) => {
  const status = groupStatus(group);
  const nextPosition = group.steps.reduce((max, s) => Math.max(max, s.position), 0) + 1;
  const [moving, setMoving] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(group.name);
  const [nameError, setNameError] = useState('');
  const [busy, setBusy] = useState(false);

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

  const saveName = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Название не может быть пустым.');
      return;
    }
    setBusy(true);
    try {
      await updateGroup(group.id, groupPayload(group, { name: trimmed }));
      toast.success('Группа переименована');
      setRenaming(false);
      setNameError('');
      await onChanged();
    } catch (err) {
      setNameError(errorMessage(err, 'Не удалось переименовать'));
    } finally {
      setBusy(false);
    }
  };

  const toggleEnabled = async () => {
    setBusy(true);
    try {
      await updateGroup(group.id, groupPayload(group, { enabled: !group.enabled }));
      toast.success(group.enabled ? 'Группа поставлена на паузу' : 'Группа включена');
      await onChanged();
    } catch (err) {
      toast.error(errorMessage(err, 'Не удалось изменить группу'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const warn = group.steps.length
      ? `Удалить группу «${group.name}» вместе с цепочкой из ${group.steps.length} бот(ов)? Журнал отправок сохранится.`
      : `Удалить группу «${group.name}»?`;
    if (!window.confirm(warn)) return;
    setBusy(true);
    try {
      await deleteGroup(group.id);
      toast.success(`Группа «${group.name}» удалена`);
      await onChanged();
    } catch (err) {
      toast.error(errorMessage(err, 'Не удалось удалить группу'));
      setBusy(false);
    }
  };

  return (
    <section className={styles.card}>
      <header className={styles.cardHead}>
        <div className={styles.cardHeadText}>
          {renaming ? (
            <form className={styles.inlineForm} onSubmit={saveName}>
              <input
                className={styles.input}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={128}
                autoFocus
                aria-label="Название группы"
              />
              <div className={styles.inlineActions}>
                <button type="submit" className={styles.primaryBtn} disabled={busy}>
                  Сохранить
                </button>
                <button
                  type="button"
                  className={styles.ghostBtn}
                  onClick={() => {
                    setRenaming(false);
                    setName(group.name);
                    setNameError('');
                  }}
                >
                  Отмена
                </button>
              </div>
              {nameError && <p className={styles.error}>{nameError}</p>}
            </form>
          ) : (
            <h2 className={styles.cardTitle}>
              {group.name} <span className={styles.typeCode}>группа #{group.id}</span>
            </h2>
          )}
        </div>
        <div className={styles.cardHeadActions}>
          <span className={`${styles.badge} ${status.className}`}>{status.label}</span>
          {!renaming && (
            <button type="button" className={styles.linkBtn} onClick={() => setRenaming(true)} disabled={busy}>
              переименовать
            </button>
          )}
          <button type="button" className={styles.linkBtn} onClick={toggleEnabled} disabled={busy}>
            {group.enabled ? 'на паузу' : 'включить'}
          </button>
          <button type="button" className={`${styles.linkBtn} ${styles.linkDanger}`} onClick={remove} disabled={busy}>
            удалить группу
          </button>
        </div>
      </header>

      <h3 className={styles.blockTitle}>где искать лидов</h3>
      <FunnelBlock
        group={group}
        onChanged={onChanged}
        pipelines={pipelines}
        pipelinesError={pipelinesError}
        pipelineNames={pipelineNames}
      />

      <h3 className={styles.blockTitle}>когда отправлять</h3>
      <SendWindowBlock group={group} onChanged={onChanged} />

      <h3 className={styles.blockTitle}>цепочка ботов</h3>
      {group.steps.length === 0 ? (
        <p className={styles.rowTextMuted}>Ботов пока нет — добавьте первого.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.thPos}>шаг</th>
              <th className={styles.thBot}>бот в amocrm</th>
              <th className={styles.thActions} />
            </tr>
          </thead>
          <tbody>
            {group.steps.map((s, index) => (
              <StepRow
                key={s.id}
                step={s}
                index={index}
                count={group.steps.length}
                busy={moving}
                onMove={handleMove}
                onChanged={onChanged}
                bots={bots}
                botsError={botsError}
                botNames={botNames}
              />
            ))}
          </tbody>
        </table>
      )}
      <AddStepForm groupId={group.id} nextPosition={nextPosition} onChanged={onChanged} bots={bots} botsError={botsError} />
    </section>
  );
};

// Новая группа: название и (по желанию) воронка/статус сразу.
const NewGroupForm = ({ onCreated, pipelines, pipelinesError }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState({ pipelineId: '', statusId: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Дайте группе название.');
      return;
    }
    const pipeline = parsePositiveInt(target.pipelineId);
    const status = parsePositiveInt(target.statusId);
    if ((target.pipelineId || target.statusId) && (!pipeline || !status)) {
      setError('Воронка и статус задаются вместе — либо оставьте оба пустыми.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await createGroup({ name: trimmed, pipelineId: pipeline || null, statusId: status || null, enabled: true });
      toast.success(`Группа «${trimmed}» создана`);
      setName('');
      setTarget({ pipelineId: '', statusId: '' });
      setOpen(false);
      await onCreated();
    } catch (err) {
      setError(errorMessage(err, 'Не удалось создать группу'));
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button type="button" className={styles.newGroupBtn} onClick={() => setOpen(true)}>
        + новая группа
      </button>
    );
  }

  return (
    <form className={`${styles.card} ${styles.newGroupForm}`} onSubmit={submit}>
      <h2 className={styles.cardTitle}>новая группа</h2>
      <div className={styles.newGroupGrid}>
        <label className={styles.label}>
          Название
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="например, Розница — грелка"
            maxLength={128}
            autoFocus
          />
        </label>
        <label className={styles.label}>
          Где искать лидов (можно задать позже)
          <PipelinePicker
            pipelines={pipelines}
            pipelinesError={pipelinesError}
            pipelineId={target.pipelineId}
            statusId={target.statusId}
            onChange={setTarget}
          />
        </label>
      </div>
      <div className={styles.inlineActions}>
        <button type="submit" className={styles.primaryBtn} disabled={saving}>
          {saving ? 'Создание…' : 'Создать группу'}
        </button>
        <button type="button" className={styles.ghostBtn} onClick={() => setOpen(false)}>
          Отмена
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </form>
  );
};

/**
 * Страница «Цепочки»: группы дрип-кампании SalesBot — у каждой название, воронка/статус
 * amoCRM (где искать лидов) и порядок ботов.
 */
const AdminSalesbot = () => {
  const [groups, setGroups] = useState([]);
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
      setGroups(await fetchGroups());
      setPageError('');
    } catch (err) {
      setPageError(errorMessage(err, 'Не удалось загрузить группы'));
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
          <p className={styles.subtitle}>Группы дрип-цепочек: где искать лидов и какие боты уходят по порядку</p>
        </div>
        <RefreshButton onClick={handleRefresh} refreshing={refreshing} label="Обновить группы и справочники amoCRM" />
      </header>

      <aside className={styles.note}>
        <p>
          По расписанию каждому лиду в статусе группы уходит <b>первая позиция цепочки без успешной отправки</b>.
          Клиент ответил → сделка сменила статус → боты ему больше не уходят.
        </p>
        <p>
          У каждого шага своя задержка: для первого — от момента, когда сделка попала в статус группы, дальше —
          от предыдущей отправки. Бот уходит в ближайшую проверку (раз в полчаса) после срока, но только внутри
          окна отправки группы: если срок выпал на ночь, бот уйдёт при следующем открытии окна.
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

      <NewGroupForm onCreated={load} pipelines={pipelines} pipelinesError={pipelinesError} />

      {loading ? (
        <p className={styles.rowTextMuted}>Загрузка групп…</p>
      ) : groups.length === 0 ? (
        <p className={styles.rowTextMuted}>Групп пока нет — создайте первую.</p>
      ) : (
        groups.map((g) => (
          <GroupCard
            key={g.id}
            group={g}
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
