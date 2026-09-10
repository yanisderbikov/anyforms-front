import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { formatDate, RefreshButton } from '../AdminInvoices/invoiceShared';
import {
  fetchSalesbots,
  fetchPipelines,
  fetchManualRuns,
  previewManualRun,
  startManualRun,
  errorMessage,
  parsePositiveInt,
  sortBots,
  pipelineNameMaps,
  RUN_STATUS_LABELS,
} from './salesbotApi';
import { BotPicker, PipelinePicker } from './SalesbotPickers';
import styles from './AdminSalesbotManualRun.module.css';

const POLL_MS = 3000;

const RUN_STATUS_CLASS = {
  RUNNING: 'statusRunning',
  DONE: 'statusDone',
  FAILED: 'statusFailed',
};

const pluralLeads = (n) => {
  const tail10 = n % 10;
  const tail100 = n % 100;
  if (tail10 === 1 && tail100 !== 11) return 'лид';
  if (tail10 >= 2 && tail10 <= 4 && (tail100 < 12 || tail100 > 14)) return 'лида';
  return 'лидов';
};

/**
 * Страница «Ручной запуск»: запустить выбранного бота всем лидам воронки/статуса
 * (при желании — только с тегом). Перед запуском обязательно превью: сколько лидов
 * получат бота. Прогон идёт на бэке в фоне, счётчики обновляются опросом.
 */
const AdminSalesbotManualRun = () => {
  const [bots, setBots] = useState([]);
  const [botsError, setBotsError] = useState('');
  const [pipelines, setPipelines] = useState([]);
  const [pipelinesError, setPipelinesError] = useState('');

  const [target, setTarget] = useState({ pipelineId: '', statusId: '' });
  const [botId, setBotId] = useState('');
  const [tagName, setTagName] = useState('');
  // Тип заказа по полю сделки «Розница»: '' — любые, 'true' — розница, 'false' — не розница.
  const [retail, setRetail] = useState('');

  const [preview, setPreview] = useState(null);
  const [previewKey, setPreviewKey] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');

  const [runs, setRuns] = useState([]);
  const [runsError, setRunsError] = useState('');
  const [runsRefreshing, setRunsRefreshing] = useState(false);

  // Превью привязано к «кому» (воронка/статус/фильтры); бот в ключ не входит — его можно
  // выбрать уже после подсчёта, тогда «уже получали» пересчитывается автоматически.
  const targetKey = `${target.pipelineId}|${target.statusId}|${tagName.trim()}|${retail}`;
  const previewFresh = preview !== null && previewKey === targetKey;
  const botValid = parsePositiveInt(botId) !== null;
  // Для запуска превью должно быть посчитано именно с выбранным ботом (иначе не знаем пропуски).
  const previewForBot = previewFresh && botValid && String(preview.forBotId) === String(parsePositiveInt(botId));

  useEffect(() => {
    fetchSalesbots()
      .then((data) => setBots(sortBots(data)))
      .catch((err) => setBotsError(errorMessage(err, 'Не удалось загрузить список ботов из amoCRM')));
    fetchPipelines()
      .then(setPipelines)
      .catch((err) => setPipelinesError(errorMessage(err, 'Не удалось загрузить список воронок из amoCRM')));
  }, []);

  const botNames = useMemo(() => Object.fromEntries(bots.map((b) => [b.id, b.name])), [bots]);
  const pipelineNames = useMemo(() => pipelineNameMaps(pipelines), [pipelines]);

  const loadRuns = useCallback(async () => {
    try {
      setRuns(await fetchManualRuns());
      setRunsError('');
    } catch (err) {
      setRunsError(errorMessage(err, 'Не удалось загрузить список запусков'));
    }
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  // Пока какой-то запуск идёт — опрашиваем счётчики.
  const hasRunning = runs.some((r) => r.status === 'RUNNING');
  useEffect(() => {
    if (!hasRunning) return undefined;
    const timer = setInterval(loadRuns, POLL_MS);
    return () => clearInterval(timer);
  }, [hasRunning, loadRuns]);

  // requireBot=false — для подсчёта лидов бот не нужен.
  const validParams = (requireBot) => {
    const pipeline = parsePositiveInt(target.pipelineId);
    const status = parsePositiveInt(target.statusId);
    const bot = parsePositiveInt(botId);
    if (!pipeline || !status) {
      setError('Выберите воронку и статус или введите их id.');
      return null;
    }
    if (requireBot && !bot) {
      setError('Выберите бота или введите его id.');
      return null;
    }
    const tag = tagName.trim();
    return {
      pipelineId: pipeline,
      statusId: status,
      botId: bot || undefined,
      tagName: tag || undefined,
      retail: retail === '' ? undefined : retail === 'true',
    };
  };

  const runPreview = useCallback(async (params, key) => {
    setPreviewing(true);
    setError('');
    try {
      const data = await previewManualRun(params);
      setPreview({ ...data, forBotId: params.botId ?? null });
      setPreviewKey(key);
    } catch (err) {
      setPreview(null);
      setError(errorMessage(err, 'Не удалось посчитать лидов'));
    } finally {
      setPreviewing(false);
    }
  }, []);

  const handlePreview = async () => {
    const params = validParams(false);
    if (!params) return;
    await runPreview(params, targetKey);
  };

  // Бот выбран (или сменился) после подсчёта — тихо пересчитываем «уже получали» под него.
  useEffect(() => {
    if (!previewFresh || !botValid || previewForBot || previewing) return;
    const params = validParams(true);
    if (params) runPreview(params, targetKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botId, previewFresh, botValid, previewForBot, previewing]);

  const handleStart = async () => {
    const params = validParams(true);
    if (!params || !previewForBot) return;
    const botLabel = preview.botName || botNames[params.botId] || `id ${params.botId}`;
    const where = [preview.pipelineName || pipelineNames.pipelines[params.pipelineId] || `воронка ${params.pipelineId}`,
      preview.statusName || pipelineNames.statuses[params.statusId] || `статус ${params.statusId}`].join(' → ');
    const filters = [
      params.retail === true ? 'только розница' : null,
      params.retail === false ? 'только не розница' : null,
      params.tagName ? `тег «${params.tagName}»` : null,
    ].filter(Boolean);
    const confirmed = window.confirm(
      `Запустить бота «${botLabel}» для ${preview.toSend} ${pluralLeads(preview.toSend)}?\n` +
        `${where}${filters.length ? `, ${filters.join(', ')}` : ''}.\n` +
        `Сообщения уйдут реальным клиентам, отменить нельзя.`
    );
    if (!confirmed) return;
    setStarting(true);
    setError('');
    try {
      const run = await startManualRun({
        ...params,
        tagName: params.tagName || null,
        retail: params.retail === undefined ? null : params.retail,
      });
      toast.success(`Запуск #${run.id} стартовал`);
      setPreview(null);
      await loadRuns();
    } catch (err) {
      setError(errorMessage(err, 'Не удалось запустить бота'));
    } finally {
      setStarting(false);
    }
  };

  const handleRunsRefresh = async () => {
    setRunsRefreshing(true);
    try {
      await loadRuns();
    } finally {
      setRunsRefreshing(false);
    }
  };

  // «розница · тег «лошадка»» — отбор лидов внутри статуса; «—», если запуск был по всему статусу.
  const runFilter = (run) => {
    const parts = [
      run.retail === true ? 'розница' : null,
      run.retail === false ? 'не розница' : null,
      run.tagName ? `тег «${run.tagName}»` : null,
    ].filter(Boolean);
    return parts.length ? parts.join(' · ') : '—';
  };

  const runPlace = (run) => {
    const pipeline = run.pipelineName || pipelineNames.pipelines[run.pipelineId] || run.pipelineId;
    const status = run.statusName || pipelineNames.statuses[run.statusId] || run.statusId;
    return `${pipeline} → ${status}`;
  };

  return (
    <div className={styles.wrap}>
      <header className={styles.pageHead}>
        <h1 className={styles.title}>ручной запуск</h1>
        <p className={styles.subtitle}>Запустить бота всем лидам воронки/статуса, вне дрип-цепочки</p>
      </header>

      <section className={styles.card}>
        <h2 className={styles.cardTitle}>кому и что отправить</h2>
        {(botsError || pipelinesError) && (
          <p className={styles.warn}>
            Справочники amoCRM загрузились не полностью ({botsError || pipelinesError}) — id можно ввести вручную.
          </p>
        )}
        <div className={styles.formGrid}>
          <label className={styles.label}>
            Воронка и статус
            <PipelinePicker
              pipelines={pipelines}
              pipelinesError={pipelinesError}
              pipelineId={target.pipelineId}
              statusId={target.statusId}
              onChange={setTarget}
            />
          </label>
          <label className={styles.label}>
            Бот
            <BotPicker bots={bots} botsError={botsError} value={botId} onChange={setBotId} />
          </label>
          <label className={styles.label}>
            Тип заказа (поле сделки «Розница»)
            <select className={styles.select} value={retail} onChange={(e) => setRetail(e.target.value)}>
              <option value="">любой</option>
              <option value="true">только розница</option>
              <option value="false">только не розница (под заказ)</option>
            </select>
          </label>
          <label className={styles.label}>
            Только лиды с тегом (необязательно)
            <input
              className={styles.input}
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              placeholder="например, лошадка"
            />
          </label>
        </div>
        <p className={styles.hint}>
          Посчитать лидов можно без бота. Кнопка запуска появится, когда выбран бот и есть свежий подсчёт: лиды,
          которым этот бот уже уходил (по журналу), пропускаются.
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.ghostBtn} onClick={handlePreview} disabled={previewing || starting}>
            {previewing ? 'Считаем…' : 'Посчитать лидов'}
          </button>
          {previewForBot && (
            <button
              type="button"
              className={styles.dangerBtn}
              onClick={handleStart}
              disabled={starting || previewing || preview.toSend === 0}
            >
              {starting ? 'Запуск…' : `Запустить для ${preview.toSend} ${pluralLeads(preview.toSend)}`}
            </button>
          )}
          {previewFresh && !botValid && <span className={styles.hintInline}>выберите бота, чтобы запустить</span>}
        </div>
        {error && <p className={styles.error}>{error}</p>}
        {previewFresh && (
          <div className={styles.preview}>
            <div className={styles.previewStat}>
              <span className={styles.previewValue}>{preview.total}</span>
              <span className={styles.previewLabel}>
                в статусе
                {retail === 'true' ? ', розница' : retail === 'false' ? ', не розница' : ''}
                {tagName.trim() ? ', с тегом' : ''}
              </span>
            </div>
            {previewForBot ? (
              <>
                <div className={styles.previewStat}>
                  <span className={styles.previewValue}>{preview.alreadySent}</span>
                  <span className={styles.previewLabel}>уже получали бота — пропустим</span>
                </div>
                <div className={`${styles.previewStat} ${styles.previewStatAccent}`}>
                  <span className={styles.previewValue}>{preview.toSend}</span>
                  <span className={styles.previewLabel}>получат бота</span>
                </div>
              </>
            ) : (
              <div className={styles.previewStat}>
                <span className={styles.previewValue}>—</span>
                <span className={styles.previewLabel}>
                  {previewing ? 'считаем пропуски…' : 'выберите бота, чтобы узнать, кто его уже получал'}
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      <section className={styles.card}>
        <div className={styles.sectionHead}>
          <h2 className={styles.cardTitle}>последние запуски</h2>
          <RefreshButton onClick={handleRunsRefresh} refreshing={runsRefreshing} label="Обновить список запусков" />
        </div>
        {runsError && <p className={styles.error}>{runsError}</p>}
        {runs.length === 0 && !runsError ? (
          <p className={styles.hint}>Запусков ещё не было (список живёт до перезапуска бэка).</p>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thLeft}>№</th>
                  <th className={styles.thLeft}>статус</th>
                  <th className={styles.thLeft}>начат (мск)</th>
                  <th className={styles.thLeft}>где</th>
                  <th className={styles.thLeft}>бот</th>
                  <th className={styles.thLeft}>фильтр</th>
                  <th className={styles.thNum}>найдено</th>
                  <th className={styles.thNum}>отправлено</th>
                  <th className={styles.thNum}>пропущено</th>
                  <th className={styles.thNum}>ошибок</th>
                  <th className={styles.thLeft}>кто</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr key={run.id}>
                    <td className={styles.tdNum}>{run.id}</td>
                    <td>
                      <span className={`${styles.status} ${styles[RUN_STATUS_CLASS[run.status]] || ''}`}>
                        {RUN_STATUS_LABELS[run.status] || run.status}
                      </span>
                      {run.error && <span className={styles.runError} title={run.error}>{run.error}</span>}
                    </td>
                    <td className={styles.tdNowrap}>{formatDate(run.startedAt)}</td>
                    <td>{runPlace(run)}</td>
                    <td>
                      {run.botName || botNames[run.botId] ? (
                        <>
                          <span className={styles.botName}>{run.botName || botNames[run.botId]}</span>
                          <span className={styles.botId}>{run.botId}</span>
                        </>
                      ) : (
                        run.botId
                      )}
                    </td>
                    <td>{runFilter(run)}</td>
                    <td className={styles.tdNum}>{run.total < 0 ? '…' : run.total}</td>
                    <td className={styles.tdNum}>{run.sent}</td>
                    <td className={styles.tdNum}>{run.skipped}</td>
                    <td className={`${styles.tdNum} ${run.failed > 0 ? styles.tdFailed : ''}`}>{run.failed}</td>
                    <td>{run.startedBy || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default AdminSalesbotManualRun;
