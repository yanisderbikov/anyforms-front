import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './ModelerSelect.module.css';

// Select с автодобавлением (как в Notion): выбираешь из существующих значений
// либо вводишь новое — оно применяется сразу, а на сервере запомнится после сохранения.
const ModelerSelect = ({ value, options = [], onChange, placeholder = 'не назначен' }) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const q = query.trim();
  const filtered = useMemo(() => {
    const list = options.filter((o) => o && o.toLowerCase().includes(q.toLowerCase()));
    return list;
  }, [options, q]);

  const canCreate = q && !options.some((o) => o.toLowerCase() === q.toLowerCase());

  const pick = (val) => {
    onChange(val);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className={styles.root} ref={rootRef}>
      <button type="button" className={styles.trigger} onClick={() => setOpen((v) => !v)}>
        {value ? <span className={styles.chip}>{value}</span> : <span className={styles.placeholder}>{placeholder}</span>}
        <span className={styles.caret}>▾</span>
      </button>

      {open && (
        <div className={styles.popover}>
          <input
            ref={inputRef}
            className={styles.search}
            value={query}
            placeholder="найти или добавить…"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (canCreate) pick(q);
                else if (filtered.length) pick(filtered[0]);
              }
            }}
          />
          <div className={styles.list}>
            {value && (
              <button type="button" className={styles.clear} onClick={() => pick(null)}>
                убрать
              </button>
            )}
            {filtered.map((o) => (
              <button
                type="button"
                key={o}
                className={`${styles.option} ${o === value ? styles.active : ''}`}
                onClick={() => pick(o)}
              >
                <span className={styles.chip}>{o}</span>
              </button>
            ))}
            {canCreate && (
              <button type="button" className={styles.create} onClick={() => pick(q)}>
                + добавить «{q}»
              </button>
            )}
            {!filtered.length && !canCreate && <div className={styles.empty}>нет значений</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelerSelect;
