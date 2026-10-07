import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Section } from './CalculatorParts';
import { RATE_GROUPS, RATE_STEPS, formatDateTime, parseNumber } from './calculatorModel';
import {
  errorMessage,
  getCalculatorOptions,
  getCalculatorRates,
  getCalculatorRatesHistory,
  updateCalculatorRates,
} from '../../services/orderCalculator';
import styles from './AdminCalculator.module.css';

const INTEGER_RATES = new Set(['maxKitsPaidByClient', 'offerValidityDays']);

const toForm = (rates) => {
  const form = {};
  RATE_GROUPS.forEach((group) => group.fields.forEach(([key]) => {
    form[key] = rates?.[key] == null ? '' : String(rates[key]);
  }));
  RATE_STEPS.forEach((step) => {
    form[step.key] = (rates?.[step.key] || []).map((s) => ({ from: String(s.from), value: String(s.value) }));
  });
  return form;
};

const toRates = (form) => {
  const rates = {};
  RATE_GROUPS.forEach((group) => group.fields.forEach(([key]) => {
    const n = parseNumber(form[key]);
    rates[key] = n == null ? null : INTEGER_RATES.has(key) ? Math.round(n) : n;
  }));
  RATE_STEPS.forEach((step) => {
    rates[step.key] = form[step.key].map((s) => ({
      from: parseNumber(s.from) == null ? null : Math.round(parseNumber(s.from)),
      value: parseNumber(s.value),
    }));
  });
  return rates;
};

const CalculatorRatesPage = () => {
  const [founder, setFounder] = useState(false);
  const [current, setCurrent] = useState(null);
  const [form, setForm] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const [rates, versions, options] = await Promise.all([
        getCalculatorRates(),
        getCalculatorRatesHistory(),
        getCalculatorOptions(),
      ]);
      setCurrent(rates);
      setForm(toForm(rates.rates));
      setHistory(versions);
      setFounder(Boolean(options.founder));
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Не удалось загрузить ставки'));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const setStep = (stepKey, index, patch) =>
    setForm((prev) => ({
      ...prev,
      [stepKey]: prev[stepKey].map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));

  const addStep = (stepKey) =>
    setForm((prev) => ({ ...prev, [stepKey]: [...prev[stepKey], { from: '', value: '' }] }));

  const removeStep = (stepKey, index) =>
    setForm((prev) => ({ ...prev, [stepKey]: prev[stepKey].filter((_, i) => i !== index) }));

  const save = async () => {
    setSaving(true);
    try {
      const saved = await updateCalculatorRates(toRates(form));
      setCurrent(saved);
      setForm(toForm(saved.rates));
      setHistory(await getCalculatorRatesHistory());
      toast.success(`Ставки сохранены — версия ${saved.versionId}`);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Не удалось сохранить ставки'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <h1 className={styles.title}>ставки калькулятора</h1>
      </div>

      <section className={styles.card}>
        <div className={styles.cardHead}>
          <h2 className={styles.cardTitle}>справочник ставок</h2>
          {current && (
            <span className={styles.status}>
              версия {current.versionId} · {formatDateTime(current.updatedAt)}
              {current.updatedBy ? ` · ${current.updatedBy}` : ''}
            </span>
          )}
        </div>
        <p className={styles.hint} style={{ margin: '0 0 12px' }}>
          {founder
            ? 'Каждое сохранение создаёт новую версию: старые расчёты в журнале помнят, по какой версии посчитаны.'
            : 'Ставки меняет только основатель — здесь они для справки.'}
        </p>
        {error && <p className={styles.banner}>{error}</p>}
        {!form && !error && <p className={styles.muted}>Загрузка…</p>}

        {form && (
          <>
            {RATE_GROUPS.map((group) => (
              <Section key={group.title} title={group.title} defaultOpen={!group.collapsed}>
                <div className={styles.grid}>
                  {group.fields.map(([key, label, unit]) => (
                    <label key={key} className={styles.label}>
                      {label}
                      <span className={styles.inputWithUnit}>
                        <input
                          className={styles.input}
                          inputMode="decimal"
                          value={form[key]}
                          disabled={!founder}
                          onChange={(e) => setField(key, e.target.value)}
                        />
                        <span className={styles.unit}>{unit}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </Section>
            ))}

            {RATE_STEPS.map((step) => (
              <Section key={step.key} title={step.title} defaultOpen>
                <p className={styles.hint} style={{ margin: '0 0 8px' }}>{step.hint}</p>
                <table className={styles.stepsTable}>
                  <thead>
                    <tr>
                      <th>тираж от</th>
                      <th>{step.valueLabel}</th>
                      <th aria-label="действия" />
                    </tr>
                  </thead>
                  <tbody>
                    {form[step.key].map((s, i) => (
                      <tr key={i}>
                        <td>
                          <input
                            className={styles.input}
                            inputMode="numeric"
                            value={s.from}
                            disabled={!founder}
                            onChange={(e) => setStep(step.key, i, { from: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            className={styles.input}
                            inputMode="decimal"
                            value={s.value}
                            disabled={!founder}
                            onChange={(e) => setStep(step.key, i, { value: e.target.value })}
                          />
                        </td>
                        <td>
                          {founder && form[step.key].length > 1 && (
                            <button type="button" className={styles.btnSmall} onClick={() => removeStep(step.key, i)}>
                              убрать
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {founder && (
                  <button type="button" className={styles.btnSmall} onClick={() => addStep(step.key)} style={{ marginTop: 8 }}>
                    + ступень
                  </button>
                )}
              </Section>
            ))}

            {founder && (
              <div className={styles.actionsRow}>
                <button type="button" className={styles.btn} onClick={save} disabled={saving}>
                  {saving ? 'сохранение…' : 'сохранить новую версию'}
                </button>
                <button type="button" className={styles.btnGhost} onClick={() => setForm(toForm(current?.rates))} disabled={saving}>
                  отменить правки
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {history.length > 0 && (
        <section className={styles.card}>
          <h2 className={styles.cardTitle} style={{ marginBottom: 10 }}>история версий</h2>
          <ul className={styles.list}>
            {history.map((v) => (
              <li key={v.versionId} className={styles.listItem} style={{ cursor: 'default' }}>
                <span className={styles.listMain}>
                  <span className={styles.listTitle}>версия {v.versionId}</span>
                  <span className={styles.listMeta}>{formatDateTime(v.updatedAt)} · {v.updatedBy || '—'}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default CalculatorRatesPage;
