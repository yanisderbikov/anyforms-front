import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import PositionCard from './PositionCard';
import OrderSummary from './OrderSummary';
import KpPreview from './KpPreview';
import {
  buildRequest,
  clearDraft,
  duplicatePosition,
  emptyOrder,
  emptyPosition,
  formatDateTime,
  hasFounderFields,
  missingModelPrices,
  orderFromRequest,
  readDraft,
  stripFounderFields,
  writeDraft,
} from './calculatorModel';
import {
  calculateOrder,
  errorMessage,
  getCalculation,
  getCalculatorOptions,
  getReferenceUrls,
  saveCalculation,
} from '../../services/orderCalculator';
import styles from './AdminCalculator.module.css';

const RECALC_DELAY_MS = 350;

const AdminCalculator = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState('');
  const [order, setOrder] = useState(() => readDraft() || emptyOrder());
  const [result, setResult] = useState(null);
  const [calcError, setCalcError] = useState('');
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [kpOpen, setKpOpen] = useState(false);
  const [loadedEntry, setLoadedEntry] = useState(null);
  const [referenceUrls, setReferenceUrls] = useState({});
  const loadingId = useRef(null);
  const requestedReferenceKeys = useRef(new Set());

  useEffect(() => {
    getCalculatorOptions()
      .then(setCatalog)
      .catch((err) => setCatalogError(errorMessage(err, 'Не удалось загрузить справочники калькулятора')));
  }, []);

  const calculationId = searchParams.get('id');
  useEffect(() => {
    if (!calculationId || loadingId.current === calculationId) return;
    loadingId.current = calculationId;
    getCalculation(calculationId)
      .then((data) => {
        setOrder(orderFromRequest(data.request));
        setReferenceUrls(data.referenceUrls || {});
        setLoadedEntry(data.entry);
        setSearchParams({}, { replace: true });
      })
      .catch((err) => toast.error(errorMessage(err, 'Не удалось открыть расчёт')))
      .finally(() => {
        loadingId.current = null;
      });
  }, [calculationId, setSearchParams]);

  useEffect(() => {
    const keys = order.positions
      .flatMap((p) => p.references.map((r) => r.key))
      .filter((key) => !referenceUrls[key] && !requestedReferenceKeys.current.has(key));
    if (!keys.length) return;
    keys.forEach((key) => requestedReferenceKeys.current.add(key));
    getReferenceUrls(keys)
      .then((urls) => {
        if (Object.keys(urls).length) setReferenceUrls((prev) => ({ ...prev, ...urls }));
      })
      .catch(() => null);
  }, [order.positions, referenceUrls]);

  useEffect(() => {
    writeDraft(order);
  }, [order]);

  const request = useMemo(() => buildRequest(order), [order]);
  const requestKey = useMemo(() => JSON.stringify(request), [request]);
  const missingPrices = useMemo(() => missingModelPrices(order), [order]);
  const blocked = missingPrices.length > 0;

  useEffect(() => {
    if (!catalog) return undefined;
    if (blocked) {
      setResult(null);
      setCalcError('');
      setCalculating(false);
      return undefined;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setCalculating(true);
      try {
        const data = await calculateOrder(JSON.parse(requestKey), controller.signal);
        setResult(data);
        setCalcError('');
      } catch (err) {
        if (err?.code === 'ERR_CANCELED' || err?.name === 'CanceledError') return;
        setCalcError(errorMessage(err, 'Не удалось посчитать'));
      } finally {
        if (!controller.signal.aborted) setCalculating(false);
      }
    }, RECALC_DELAY_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [requestKey, catalog, blocked]);

  const founder = Boolean(catalog?.founder);
  const resultFits = result && result.positions.length === order.positions.length;

  const updateOrder = (patch) => setOrder((prev) => ({ ...prev, ...patch }));

  const updatePosition = useCallback((index, patch) => {
    setOrder((prev) => ({
      ...prev,
      positions: prev.positions.map((p, i) => {
        if (i !== index) return p;
        const next = typeof patch === 'function' ? patch(p) : patch;
        return { ...p, ...next };
      }),
    }));
  }, []);

  const addPosition = () => setOrder((prev) => ({ ...prev, positions: [...prev.positions, emptyPosition()] }));

  const removePosition = (index) =>
    setOrder((prev) => ({ ...prev, positions: prev.positions.filter((_, i) => i !== index) }));

  const copyPosition = (index) =>
    setOrder((prev) => ({
      ...prev,
      positions: [...prev.positions.slice(0, index + 1), duplicatePosition(prev.positions[index]), ...prev.positions.slice(index + 1)],
    }));

  const reset = () => {
    if (!window.confirm('Начать новый расчёт? Текущие данные формы будут очищены.')) return;
    clearDraft();
    setOrder(emptyOrder());
    setResult(null);
    setLoadedEntry(null);
    setCalcError('');
  };

  const save = async () => {
    setSaving(true);
    try {
      const saved = await saveCalculation(request);
      setLoadedEntry(saved);
      toast.success(`Расчёт №${saved.id} сохранён в журнал`);
    } catch (err) {
      toast.error(errorMessage(err, 'Не удалось сохранить расчёт'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <h1 className={styles.title}>калькулятор заказа</h1>
      </div>

      {catalogError && <p className={styles.banner}>{catalogError}</p>}
      {loadedEntry && (
        <div className={styles.notice}>
          <span>
            Расчёт №{loadedEntry.id} от {formatDateTime(loadedEntry.createdAt)}
            {loadedEntry.createdByName ? ` · ${loadedEntry.createdByName}` : ''} — цифры пересчитаны по действующим ставкам.
          </span>
          <button type="button" className={styles.btnSmall} onClick={() => setLoadedEntry(null)}>скрыть</button>
        </div>
      )}

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}>заказ</h2>
          <span className={styles.status}>
            {blocked ? 'ждёт цену художника' : calculating ? 'считаю…' : result && founder ? `ставки v${result.ratesVersionId}` : ''}
          </span>
        </div>
        <div className={styles.gridWide}>
          <label className={styles.label}>
            Клиент
            <input
              className={styles.input}
              value={order.client}
              placeholder="«Анкор ЖБИ»"
              onChange={(e) => updateOrder({ client: e.target.value })}
            />
          </label>
          <label className={styles.label}>
            Что рассказал клиент
            <textarea
              className={styles.textarea}
              value={order.comment}
              placeholder="Задача, пожелания, ссылки — попадёт в журнал"
              onChange={(e) => updateOrder({ comment: e.target.value })}
            />
          </label>
        </div>
      </section>

      {catalog && !founder && hasFounderFields(order) && (
        <div className={styles.notice}>
          <span>
            В расчёте есть решения основателя: ручные цены, комплекты, бонус или особая скидка. Менеджер не может
            пересчитать их сам — уберите их, чтобы считать дальше, или попросите основателя.
          </span>
          <button type="button" className={styles.btnGhost} onClick={() => setOrder((prev) => stripFounderFields(prev))}>
            убрать решения основателя
          </button>
        </div>
      )}
      {blocked && (
        <p className={styles.banner}>
          Расчёт не запущен — укажите цену художника за модель: {missingPrices.join('; ')}. Если модель даёт
          клиент, отметьте «готовая 3D-модель клиента».
        </p>
      )}
      {calcError && <p className={styles.banner}>{calcError}</p>}

      {order.positions.map((position, index) => (
        <PositionCard
          key={position.key}
          position={position}
          index={index}
          positionsCount={order.positions.length}
          positionResult={resultFits ? result.positions[index] : null}
          catalog={catalog}
          founder={founder}
          summary={result?.summary}
          referenceUrls={referenceUrls}
          onReferenceUrls={(urls) => setReferenceUrls((prev) => ({ ...prev, ...urls }))}
          onChange={(patch) => updatePosition(index, patch)}
          onRemove={() => removePosition(index)}
          onDuplicate={() => copyPosition(index)}
        />
      ))}

      <button type="button" className={styles.addPosition} onClick={addPosition}>
        + позиция (другое изделие в этом заказе)
      </button>

      <OrderSummary
        discount={order.discount}
        result={resultFits ? result : null}
        founder={founder}
        onDiscountChange={(patch) => setOrder((prev) => ({ ...prev, discount: { ...prev.discount, ...patch } }))}
        onSave={save}
        saving={saving}
        onOpenKp={() => setKpOpen(true)}
        onReset={reset}
      />

      {kpOpen && resultFits && (
        <KpPreview
          order={order}
          result={result}
          catalog={catalog}
          founder={founder}
          referenceUrls={referenceUrls}
          onClose={() => setKpOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminCalculator;
