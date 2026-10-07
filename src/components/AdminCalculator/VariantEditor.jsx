import React from 'react';
import {
  EXCEPTION_FIELDS,
  TECH_GROUPS,
  TRI_STATE_FIELDS,
  acceptValue,
  displayResolved,
  parseNumber,
} from './calculatorModel';
import { NumberField, Section, TriStateSelect } from './CalculatorParts';
import styles from './AdminCalculator.module.css';

const DIGITAL_FIELDS = new Set(['fdmProjectHours']);
const MODEL_PRICE = 'modelContractorPrice';

const VariantEditor = ({ variant, option, catalog, founder, digital, modelRequired, onChange }) => {
  const sources = option?.sources || {};
  const resolved = option?.input || {};
  const formType = catalog?.formTypes?.find((t) => t.code === variant.formType);

  const setField = (key, value) => {
    onChange({ [key]: value, aiFields: variant.aiFields.filter((k) => k !== key) });
  };

  const groups = TECH_GROUPS.map((group) => ({
    ...group,
    fields: group.fields.filter((f) => f.key !== MODEL_PRICE && (!digital || DIGITAL_FIELDS.has(f.key))),
  })).filter((group) => group.fields.length > 0);

  const visibleFields = groups.flatMap((g) => g.fields);
  const estimated = visibleFields.filter((f) => !variant[f.key] && sources[f.key] === 'ESTIMATE');
  const aiUnconfirmed = visibleFields.filter((f) => variant[f.key] && sources[f.key] === 'AI');
  const filled = visibleFields.filter((f) => variant[f.key]).length;

  const acceptAll = () => {
    const patch = {};
    estimated.forEach((f) => {
      patch[f.key] = acceptValue(f, resolved[f.key]);
    });
    onChange({ ...patch, aiFields: [] });
  };

  const toggleModifier = (code) => {
    const has = variant.modifiers.includes(code);
    onChange({ modifiers: has ? variant.modifiers.filter((m) => m !== code) : [...variant.modifiers, code] });
  };

  const modelPriceMissing = modelRequired && parseNumber(variant[MODEL_PRICE]) == null;

  const exceptionsSet = EXCEPTION_FIELDS.some((f) => variant[f.key] !== '');
  const showExceptions = founder || exceptionsSet;

  return (
    <div>
      <div className={styles.grid}>
        <label className={styles.label}>
          Тип формы
          <select
            className={styles.select}
            value={variant.formType}
            onChange={(e) => onChange({ formType: e.target.value })}
          >
            {(catalog?.formTypes || []).map((t) => (
              <option key={t.code} value={t.code}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        {!digital && (
          <label className={styles.label}>
            Мастер-модель
            <select
              className={styles.select}
              value={variant.masterType}
              onChange={(e) => onChange({ masterType: e.target.value })}
            >
              {(catalog?.masterTypes || []).map((m) => (
                <option key={m.code} value={m.code}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {modelRequired && (
          <NumberField
            label="Цена художника за модель *"
            unit="₽"
            value={variant[MODEL_PRICE]}
            placeholder="цена художника"
            invalid={modelPriceMissing}
            hint={modelPriceMissing
              ? 'Обязательно: без цены художника расчёт не запускается'
              : 'Сколько берёт художник за 3D-модель — наша себестоимость модели'}
            onChange={(next) => setField(MODEL_PRICE, next)}
          />
        )}
        {!digital && variant.formType === 'SET' && (
          <NumberField
            label="Форм в комплекте"
            unit="шт"
            integer
            value={variant.setFormsCount}
            placeholder="2"
            onChange={(value) => onChange({ setFormsCount: value })}
          />
        )}
        {!digital && variant.formType.startsWith('FLAT_MATRIX') && (
          <NumberField
            label="Ячеек в матрице"
            unit="шт"
            integer
            value={variant.cellsCount}
            placeholder="1"
            onChange={(value) => onChange({ cellsCount: value })}
          />
        )}
      </div>
      {formType?.hint && <p className={styles.hint} style={{ margin: '8px 0 0' }}>{formType.hint}</p>}

      {!digital && (
        <div className={styles.checkGroup}>
          {(catalog?.modifiers || []).map((m) => (
            <label key={m.code} className={styles.check} title={m.hint}>
              <input
                type="checkbox"
                checked={variant.modifiers.includes(m.code)}
                onChange={() => toggleModifier(m.code)}
              />
              {m.label}
            </label>
          ))}
          <label className={styles.check} title="Кожуху нужно основание, крепёж и рёбра — он тяжелее">
            <input
              type="checkbox"
              checked={variant.shellUnstable}
              onChange={(e) => onChange({ shellUnstable: e.target.checked })}
            />
            узкое или круглое сечение
          </label>
        </div>
      )}

      <Section
        title="технические параметры (расчётчик)"
        defaultOpen={filled > 0}
        meta={(
          <>
            {estimated.length > 0 && (
              <span className={`${styles.badge} ${styles.badgeEstimate}`}>оценок: {estimated.length}</span>
            )}
            {aiUnconfirmed.length > 0 && (
              <span className={`${styles.badge} ${styles.badgeAi}`}>AI: {aiUnconfirmed.length}</span>
            )}
            {filled > 0 && <span>заполнено {filled}</span>}
          </>
        )}
      >
        <p className={styles.hint} style={{ margin: '0 0 10px' }}>
          Пустое поле — калькулятор подставит оценку по габаритам и типу формы. Оценки нужно подтвердить
          (✓ — принять значение как проверенное).
        </p>
        {(estimated.length > 0 || aiUnconfirmed.length > 0) && (
          <button type="button" className={styles.btnGhost} onClick={acceptAll} style={{ marginBottom: 6 }}>
            принять все оценки
          </button>
        )}
        <div className={styles.techGroups}>
          {groups.map((group) => (
            <div key={group.title}>
              <p className={styles.subTitle}>{group.title}</p>
              <div className={styles.grid}>
                {group.fields.map((field) => {
                  const source = sources[field.key];
                  const value = variant[field.key];
                  const resolvedValue = resolved[field.key];
                  const placeholder = !value && (source === 'ESTIMATE' || source === 'DEFAULT') && resolvedValue != null
                    ? `${source === 'ESTIMATE' ? '≈ ' : ''}${displayResolved(field, resolvedValue)}`
                    : '';
                  let onAccept = null;
                  if (!value && source === 'ESTIMATE') {
                    onAccept = () => setField(field.key, acceptValue(field, resolvedValue));
                  } else if (value && source === 'AI') {
                    onAccept = () => onChange({ aiFields: variant.aiFields.filter((k) => k !== field.key) });
                  }
                  return (
                    <NumberField
                      key={field.key}
                      label={field.label}
                      unit={field.unit}
                      hint={field.hint}
                      integer={field.integer}
                      value={value}
                      placeholder={placeholder}
                      source={source}
                      onAccept={onAccept}
                      onChange={(next) => setField(field.key, next)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
          {!digital && (
            <div>
              <p className={styles.subTitle}>правила</p>
              <div className={styles.grid}>
                {TRI_STATE_FIELDS.map((field) => (
                  <TriStateSelect
                    key={field.key}
                    label={field.label}
                    hint={field.hint}
                    value={variant[field.key]}
                    source={sources[field.key]}
                    autoValue={field.key === 'shellRequired'
                      ? (option ? (option.input.shellGrams > 0) : null)
                      : option ? option.input[field.key] : null}
                    onChange={(next) => setField(field.key, next)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>

      {showExceptions && (
        <Section
          title="исключения (основатель)"
          className={styles.founderSection}
          defaultOpen={exceptionsSet}
          meta={exceptionsSet ? <span className={`${styles.badge} ${styles.badgeWarn}`}>заданы</span> : null}
        >
          {!founder && (
            <p className={styles.hint} style={{ margin: '0 0 10px' }}>
              Исключения задаёт только основатель — менеджер видит их, но не меняет.
            </p>
          )}
          <div className={styles.grid}>
            {EXCEPTION_FIELDS.filter((f) => !digital || f.key === 'modelPriceOverride').map((field) => (
              <NumberField
                key={field.key}
                label={field.label}
                unit={field.unit}
                hint={field.hint}
                integer={field.integer}
                value={variant[field.key]}
                disabled={!founder}
                placeholder={field.key === 'formPriceOverride' && option?.price
                  ? `расчёт ${displayResolved({}, option.price.formPrice)}`
                  : field.key === 'kitsOverride' && option?.price ? `по шкале ${option.price.kits || 1}` : ''}
                onChange={(next) => onChange({ [field.key]: next })}
              />
            ))}
          </div>
          {!digital && variant.formType === 'FLAT_MATRIX_CLUSTER' && founder && (
            <p className={styles.hint} style={{ margin: '10px 0 0' }}>
              Кластер {variant.cellsCount || 1} яч.: 950 + 350 × {Math.max((Number(variant.cellsCount) || 1) - 1, 0)} ={' '}
              {950 + 350 * Math.max((Number(variant.cellsCount) || 1) - 1, 0)} ₽ — только на малых тиражах.
            </p>
          )}
        </Section>
      )}
    </div>
  );
};

export default VariantEditor;
