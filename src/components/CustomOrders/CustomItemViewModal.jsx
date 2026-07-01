import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CUSTOM_STATUS_LABELS, CUSTOM_STATUS_STYLE, isImageFile, fileExt } from '../../services/customProducts';
import styles from './CustomItemViewModal.module.css';

// Скачивание файла: пробуем blob (форсит сохранение), при CORS — открываем в новой вкладке.
const downloadFile = async (file) => {
  try {
    const res = await fetch(file.url);
    if (!res.ok) throw new Error('fetch failed');
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = href;
    a.download = file.filename || 'file';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(href);
  } catch {
    window.open(file.url, '_blank', 'noopener');
  }
};

const CustomItemViewModal = ({ item, onClose, onEdit }) => {
  const files = item.files || [];
  const images = useMemo(() => files.filter(isImageFile), [files]);
  const others = useMemo(() => files.filter((f) => !isImageFile(f)), [files]);
  const [idx, setIdx] = useState(0);
  const count = images.length;

  // Зацикленное листание: всегда в пределах [0, count-1], не упирается в края.
  const go = useCallback(
    (delta) => {
      if (count === 0) return;
      setIdx((i) => ((i + delta) % count + count) % count);
    },
    [count],
  );

  // Сброс при открытии другой позиции и страховка от выхода индекса за пределы.
  useEffect(() => {
    setIdx(0);
  }, [item.id]);
  useEffect(() => {
    if (idx > count - 1) setIdx(0);
  }, [count, idx]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  // Свайп на тач-устройствах.
  const touchX = useRef(null);
  const onTouchStart = (e) => {
    touchX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  const current = images[Math.min(idx, count - 1)];

  const createdLabel = (() => {
    const v = item.createdAt;
    if (v == null) return null;
    const ms = typeof v === 'number' ? (v < 1e12 ? v * 1000 : v) : Date.parse(v);
    if (Number.isNaN(ms)) return null;
    return new Date(ms).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  })();

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Закрыть">×</button>

        {item.leadId && (
          <a
            className={styles.amoLink}
            href={`https://anyforms.amocrm.ru/leads/detail/${item.leadId}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Открыть сделку в AmoCRM"
            aria-label="Открыть сделку в AmoCRM"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.5 3.5H3.5C2.67157 3.5 2 4.17157 2 5V12.5C2 13.3284 2.67157 14 3.5 14H11C11.8284 14 12.5 13.3284 12.5 12.5V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 2H14V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7 9L14 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        )}

        <div className={styles.head}>
          <a
            className={styles.title}
            href={`/orders/custom/item/${item.id}`}
            target="_blank"
            rel="noreferrer"
            title="Открыть в отдельной вкладке"
          >
            {item.productName || 'без названия'}
          </a>
        </div>

        {current && (
          <div className={styles.viewer} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            {count > 1 && (
              <button className={`${styles.nav} ${styles.prev}`} onClick={() => go(-1)} aria-label="Назад">‹</button>
            )}
            <img className={styles.viewerImg} src={current.url} alt={current.filename || ''} />
            <button className={styles.download} onClick={() => downloadFile(current)} title="Скачать">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              скачать
            </button>
            {count > 1 && (
              <button className={`${styles.nav} ${styles.next}`} onClick={() => go(1)} aria-label="Вперёд">›</button>
            )}
            {count > 1 && (
              <span className={styles.counter}>{Math.min(idx, count - 1) + 1} / {count}</span>
            )}
          </div>
        )}

        {item.description && <p className={styles.description}>{item.description}</p>}

        {others.length > 0 && (
          <div className={styles.filesBlock}>
            <span className={styles.filesLabel}>файлы</span>
            <div className={styles.fileList}>
              {others.map((f) => (
                <button key={f.id} className={styles.fileChip} onClick={() => downloadFile(f)}>
                  <span className={styles.fileChipExt}>{fileExt(f)}</span>
                  <span className={styles.fileChipName}>{f.filename || 'файл'}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {files.length === 0 && <p className={styles.emptyFiles}>файлов нет</p>}

        <div className={styles.bottomInfo}>
          {item.status && (
            <span className={styles.status} style={CUSTOM_STATUS_STYLE[item.status]}>
              {CUSTOM_STATUS_LABELS[item.status] || item.status}
            </span>
          )}
          <span className={styles.qty}>{item.quantity} шт</span>
          {item.modeler && <span className={styles.modeler}>моделирует: {item.modeler}</span>}
          {createdLabel && <span className={styles.created}>создан: {createdLabel}</span>}
        </div>

        <div className={styles.footer}>
          <button className={styles.editBtn} onClick={onEdit}>изменить</button>
        </div>
      </div>
    </div>
  );
};

export default CustomItemViewModal;
