import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { getItemLogs, addItemLog } from '../../services/customProducts';
import AutoTextarea from './AutoTextarea';
import styles from './ProductionLog.module.css';

const fmtTime = (v) => {
  const ms = typeof v === 'number' ? (v < 1e12 ? v * 1000 : v) : Date.parse(v);
  if (Number.isNaN(ms)) return '';
  return new Date(ms).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Лог производства позиции: «сделали то, сделали это». Писать можно только в статусе
// «В производстве»; уже сделанные записи видны и после смены статуса.
const ProductionLog = ({ item, startAdding = false, onAdded }) => {
  const [logs, setLogs] = useState([]);
  const [adding, setAdding] = useState(startAdding);
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const canAdd = item.status === 'IN_PRODUCTION';

  useEffect(() => {
    let alive = true;
    getItemLogs(item.id)
      .then((data) => {
        if (alive) setLogs(data || []);
      })
      .catch(() => toast.error('Не удалось загрузить лог'));
    return () => {
      alive = false;
    };
  }, [item.id]);

  const cancel = () => {
    setAdding(false);
    setText('');
  };

  const save = async () => {
    const value = text.trim();
    if (!value || saving) return;
    try {
      setSaving(true);
      const entry = await addItemLog(item.id, value);
      setLogs((prev) => [...prev, entry]);
      cancel();
      if (onAdded) onAdded(entry);
    } catch {
      toast.error('Не удалось добавить запись');
    } finally {
      setSaving(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      save();
    } else if (e.key === 'Escape') {
      // Не закрываем модалку целиком — только форму записи
      e.stopPropagation();
      cancel();
    }
  };

  if (!canAdd && logs.length === 0) return null;

  return (
    <div className={styles.block}>
      <span className={styles.label}>лог производства</span>

      {logs.length > 0 && (
        <ul className={styles.list}>
          {logs.map((l) => (
            <li key={l.id} className={styles.entry}>
              <span className={styles.time}>{fmtTime(l.createdAt)}</span>
              <span className={styles.text}>{l.text}</span>
            </li>
          ))}
        </ul>
      )}

      {canAdd && (adding ? (
        <div className={styles.form}>
          <AutoTextarea
            className={styles.input}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="что сделали"
            autoFocus
          />
          <div className={styles.actions}>
            <button className={styles.save} onClick={save} disabled={saving || !text.trim()}>
              {saving ? 'сохраняем…' : 'сохранить'}
            </button>
            <button className={styles.cancel} onClick={cancel} disabled={saving}>отмена</button>
          </div>
        </div>
      ) : (
        <button className={styles.addBtn} onClick={() => setAdding(true)}>+ добавить лог</button>
      ))}
    </div>
  );
};

export default ProductionLog;
