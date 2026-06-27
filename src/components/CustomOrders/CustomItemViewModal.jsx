import React, { useEffect, useMemo, useState } from 'react';
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

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(i + 1, images.length - 1));
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(i - 1, 0));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [images.length, onClose]);

  const current = images[idx];

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

        <div className={styles.head}>
          <h2 className={styles.title}>{item.productName || 'без названия'}</h2>
        </div>

        {images.length > 0 && (
          <div className={styles.viewer}>
            {images.length > 1 && (
              <button className={`${styles.nav} ${styles.prev}`} onClick={() => setIdx((i) => Math.max(i - 1, 0))} disabled={idx === 0}>‹</button>
            )}
            <img className={styles.viewerImg} src={current.url} alt={current.filename || ''} />
            <button className={styles.download} onClick={() => downloadFile(current)} title="Скачать">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 21h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              скачать
            </button>
            {images.length > 1 && (
              <button className={`${styles.nav} ${styles.next}`} onClick={() => setIdx((i) => Math.min(i + 1, images.length - 1))} disabled={idx === images.length - 1}>›</button>
            )}
            {images.length > 1 && (
              <span className={styles.counter}>{idx + 1} / {images.length}</span>
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
