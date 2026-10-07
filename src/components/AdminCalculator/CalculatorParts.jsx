import React, { useState } from 'react';
import { SOURCE_LABELS } from './calculatorModel';
import styles from './AdminCalculator.module.css';

export const HintList = ({ hints }) => {
  if (!hints?.length) return null;
  return (
    <ul className={styles.hints}>
      {hints.map((hint, index) => (
        <li key={`${hint.code}-${index}`} className={`${styles.hintItem} ${styles[`hint${hint.level}`] || ''}`}>
          {hint.message}
        </li>
      ))}
    </ul>
  );
};

export const Section = ({ title, meta, defaultOpen = false, className = '', children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`${styles.section} ${className}`}>
      <button type="button" className={styles.sectionToggle} onClick={() => setOpen((prev) => !prev)}>
        <span>
          {open ? '▾' : '▸'} {title}
        </span>
        {meta && <span className={styles.sectionMeta}>{meta}</span>}
      </button>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </div>
  );
};

export const SourceBadge = ({ source }) => {
  if (!source) return null;
  const className = {
    ESTIMATE: styles.badgeEstimate,
    DEFAULT: styles.badgeDefault,
  }[source];
  return <span className={`${styles.badge} ${className}`}>{SOURCE_LABELS[source]}</span>;
};

export const NumberField = ({
  label,
  unit,
  hint,
  value,
  onChange,
  placeholder,
  source,
  onAccept,
  disabled,
  integer,
  invalid,
}) => {
  const inputClass = [
    styles.input,
    invalid ? styles.inputInvalid : '',
    !value && source === 'ESTIMATE' ? styles.inputEstimate : '',
    !value && source === 'DEFAULT' ? styles.inputDefault : '',
  ].join(' ');
  return (
    <label className={styles.label}>
      <span className={styles.labelHead}>
        <span>{label}</span>
        <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
          <SourceBadge source={value ? null : source} />
          {onAccept && (
            <button
              type="button"
              className={styles.btnSmall}
              onClick={(e) => {
                e.preventDefault();
                onAccept();
              }}
              title="Принять оценку как подтверждённое значение"
              disabled={disabled}
            >
              ✓
            </button>
          )}
        </span>
      </span>
      <span className={styles.inputWithUnit}>
        <input
          type="text"
          inputMode={integer ? 'numeric' : 'decimal'}
          className={inputClass}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-invalid={invalid ? 'true' : undefined}
        />
        {unit && <span className={styles.unit}>{unit}</span>}
      </span>
      {hint && <span className={`${styles.hint} ${invalid ? styles.hintInvalid : ''}`}>{hint}</span>}
    </label>
  );
};

export const TriStateSelect = ({ label, hint, value, autoValue, onChange, disabled }) => {
  const current = value == null ? 'auto' : value ? 'yes' : 'no';
  const autoLabel = autoValue == null ? 'авто' : `авто: ${autoValue ? 'да' : 'нет'}`;
  return (
    <label className={styles.label}>
      <span className={styles.labelHead}>
        <span>{label}</span>
      </span>
      <select
        className={styles.select}
        value={current}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value === 'auto' ? null : e.target.value === 'yes')}
      >
        <option value="auto">{autoLabel}</option>
        <option value="yes">да</option>
        <option value="no">нет</option>
      </select>
      {hint && <span className={styles.hint}>{hint}</span>}
    </label>
  );
};
