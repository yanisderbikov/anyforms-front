import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  getReadyToShipGroups,
  shipOrder,
  isImageFile,
  CUSTOM_STATUS_STYLE,
  CUSTOM_STATUS_LABELS,
} from '../../services/customProducts';
import CustomHeader from './CustomHeader';
import CustomTabs from './CustomTabs';
import styles from './CustomShipList.module.css';

const copyText = (text, msg) => {
  if (!text) return;
  navigator.clipboard
    .writeText(String(text))
    .then(() => toast.success(msg, { position: 'top-right', duration: 1500 }))
    .catch(() => toast.error('Ошибка копирования'));
};

const formatDate = (v) => {
  if (v == null || v === '') return '-';
  try {
    const parts = Array.isArray(v) ? v.map(Number) : null;
    let d;
    if (parts && parts.length >= 3 && parts.every((n) => !Number.isNaN(n))) {
      const [y, m, day, h = 0, min = 0] = parts;
      d = new Date(Date.UTC(y, m - 1, day, h, min));
    } else {
      d = new Date(v);
    }
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return '-';
  }
};

const firstImage = (item) => (item.files || []).find(isImageFile) || null;

const Field = ({ label, value, onCopy, comment }) => (
  <div className={`${styles.contactItem} ${comment ? styles.commentItem : ''}`}>
    <span className={styles.fieldLabel}>{label}:</span>
    <span
      className={`${styles.fieldValue} ${onCopy ? styles.clickable : ''}`}
      onClick={onCopy}
      title={onCopy ? 'Нажмите для копирования' : undefined}
    >
      {value || '-'}
    </span>
  </div>
);

const CustomShipList = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shipping, setShipping] = useState(null);
  const [tracker, setTracker] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setGroups(await getReadyToShipGroups());
    } catch {
      toast.error('Не удалось загрузить заказы к отправке');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openShip = (g) => {
    setShipping(g);
    setTracker('');
  };
  const closeShip = () => {
    if (!saving) {
      setShipping(null);
      setTracker('');
    }
  };

  const handleShip = async (e) => {
    e.preventDefault();
    if (!tracker.trim()) {
      toast.error('Введите трекер');
      return;
    }
    try {
      setSaving(true);
      await shipOrder(shipping.order.id, tracker.trim());
      setGroups((prev) => prev.filter((g) => g.order.id !== shipping.order.id));
      setShipping(null);
      setTracker('');
      toast.success('Заказ отправлен');
    } catch {
      toast.error('Не удалось отправить заказ');
    } finally {
      setSaving(false);
    }
  };

  const title = (o = {}) => o.contactName || (o.leadId ? `сделка #${o.leadId}` : `заказ #${o.id}`);

  return (
    <div className={styles.page}>
      <CustomHeader />
      <div className={styles.tabsWrap}>
        <CustomTabs />
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>загрузка…</p>
        </div>
      ) : groups.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>нет заказов к отправке</p>
        </div>
      ) : (
        <div className={styles.groups}>
          {groups.map((g) => {
            const o = g.order || {};
            const images = g.items.map(firstImage).filter(Boolean);
            const n = images.length;
            const collageCls = n >= 4 ? styles.c4 : n === 3 ? styles.c3 : n === 2 ? styles.c2 : styles.c1;
            return (
              <div key={o.id} className={styles.group}>
                {n > 0 && (
                  <div className={`${styles.collage} ${collageCls}`}>
                    {images.slice(0, 4).map((img, i) => (
                      <div key={i} className={styles.collageCell}>
                        <img src={img.url} alt="" loading="lazy" />
                        {i === 3 && n > 4 && <span className={styles.more}>+{n - 4}</span>}
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.groupBody}>
                  <div className={styles.contactInfo}>
                    <Field label="ФИО" value={o.contactName} onCopy={() => copyText(o.contactName, 'ФИО скопировано')} />
                    <Field label="Телефон" value={o.contactPhone} onCopy={() => copyText(o.contactPhone, 'Телефон скопирован')} />
                    {o.pvzSdekStreet && (
                      <Field label="ПВЗ СДЭК улица" value={o.pvzSdekStreet} onCopy={() => copyText(o.pvzSdekStreet, 'ПВЗ улица скопировано')} />
                    )}
                    {o.pvzSdekCity && (
                      <Field label="ПВЗ СДЭК город" value={o.pvzSdekCity} onCopy={() => copyText(o.pvzSdekCity, 'ПВЗ город скопировано')} />
                    )}
                    {o.purchaseDate && <Field label="Дата оплаты" value={formatDate(o.purchaseDate)} />}
                    {o.comment && <Field label="Комментарий" value={o.comment} comment />}
                  </div>

                  <button className={styles.shipBtn} onClick={() => openShip(g)}>
                    добавить трекер
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {shipping && (
        <div className={styles.overlay} onClick={closeShip}>
          <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleShip}>
            <div className={styles.modalTitle}>{title(shipping.order)}</div>
            <div className={styles.modalPosList}>
              {shipping.items.map((it) => (
                <div key={it.id} className={styles.posRow}>
                  <span className={styles.posName}>{it.productName}</span>
                  <div className={styles.posMeta}>
                    {it.status && (
                      <span className={styles.posStatus} style={CUSTOM_STATUS_STYLE[it.status]}>
                        {CUSTOM_STATUS_LABELS[it.status] || it.status}
                      </span>
                    )}
                    <span className={styles.posQty}>{it.quantity} шт</span>
                  </div>
                </div>
              ))}
            </div>
            <input
              className={styles.trackerInput}
              placeholder="номер трекера"
              value={tracker}
              onChange={(e) => setTracker(e.target.value)}
              autoFocus
            />
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancel} onClick={closeShip} disabled={saving}>
                отмена
              </button>
              <button type="submit" className={styles.save} disabled={saving}>
                {saving ? 'сохраняю…' : 'отправить'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CustomShipList;
