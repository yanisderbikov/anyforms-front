import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  getCustomItem,
  CUSTOM_STATUS_LABELS,
  CUSTOM_STATUS_STYLE,
  isImageFile,
  fileExt,
} from '../../services/customProducts';
import CustomItemModal from './CustomItemModal';
import LinkText from './LinkText';
import OrderGallery from './OrderGallery';
import apiClient from '../../apiClient';
import styles from './CustomItemPage.module.css';

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

const fmtDate = (v) => {
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
};

const CustomItemPage = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const isAuthed = !!(apiClient.getToken && apiClient.getToken());
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setNotFound(false);
        const data = await getCustomItem(itemId);
        if (alive) setItem(data);
      } catch (e) {
        if (e?.response?.status === 404) {
          if (alive) setNotFound(true);
        } else {
          toast.error('Ошибка загрузки');
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [itemId]);

  const images = useMemo(() => (item?.files || []).filter(isImageFile), [item]);
  const others = useMemo(() => (item?.files || []).filter((f) => !isImageFile(f)), [item]);

  const back = () => navigate('/orders/custom');
  const createdLabel = item ? fmtDate(item.createdAt) : null;

  return (
    <div className={styles.page}>
      <div className={styles.headerSafeArea} aria-hidden="true" />
      <header className={styles.header}>
        <div className={styles.headerInner}>
          {isAuthed && <button className={styles.back} onClick={back}>← назад</button>}
          <span className={styles.logoLink} onClick={() => navigate(isAuthed ? '/orders/custom' : '/')} role="button" aria-label="anyforms">
            <img className={styles.logo} src="/anyforms_logo_new_white.svg" alt="anyforms" width={180} height={41} decoding="async" />
          </span>
          {isAuthed && item?.leadId && (
            <a
              className={styles.amoLink}
              href={`https://anyforms.amocrm.ru/leads/detail/${item.leadId}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Открыть сделку в AmoCRM"
              aria-label="Открыть сделку в AmoCRM"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6.5 3.5H3.5C2.67157 3.5 2 4.17157 2 5V12.5C2 13.3284 2.67157 14 3.5 14H11C11.8284 14 12.5 13.3284 12.5 12.5V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 2H14V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M7 9L14 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )}
        </div>
      </header>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>загрузка…</p>
        </div>
      ) : notFound || !item ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>позиция не найдена</p>
        </div>
      ) : (
        <div className={styles.content}>
          <h1 className={styles.title}>{item.productName || 'без названия'}</h1>

          {images.length > 0 && <OrderGallery images={images} onDownload={downloadFile} />}

          {item.description && <LinkText className={styles.description} text={item.description} />}

          {others.length > 0 && (
            <div className={styles.filesBlock}>
              <span className={styles.filesLabel}>файлы</span>
              <div className={styles.fileList}>
                {others.map((f) => (
                  <button key={f.id} className={styles.fileChip} onClick={() => downloadFile(f)}>
                    <span className={styles.fileChipExt}>{fileExt(f)}</span>
                    <span className={styles.fileChipName}>{f.filename || 'файл'}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

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

          {isAuthed && (
            <button className={styles.editBtn} onClick={() => setEditing(true)}>изменить</button>
          )}
        </div>
      )}

      {editing && item && (
        <CustomItemModal
          item={item}
          onClose={() => setEditing(false)}
          onSaved={(updated) => setItem(updated)}
          onDeleted={() => navigate('/orders/custom')}
        />
      )}
    </div>
  );
};

export default CustomItemPage;
