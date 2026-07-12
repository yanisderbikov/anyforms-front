import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  getReadyToShipGroups,
  getInDeliveryGroups,
  shipOrder,
  completeOrder,
  isImageFile,
  isPickup,
  PICKUP_BADGE_STYLE,
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
  const [mode, setMode] = useState('ship');
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shipping, setShipping] = useState(null);
  const [tracker, setTracker] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async (m) => {
    try {
      setLoading(true);
      setGroups(m === 'ship' ? await getReadyToShipGroups() : await getInDeliveryGroups());
    } catch {
      toast.error('Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(mode);
  }, [mode]);

  const openShip = (g) => {
    setShipping(g);
    setTracker(mode === 'delivery' ? g.order.tracker || '' : '');
  };
  const closeShip = () => {
    if (!saving) {
      setShipping(null);
      setTracker('');
    }
  };

  const handleShip = async (e) => {
    e.preventDefault();
    const pickup = isPickup(shipping.order);
    if (pickup && mode === 'ship') {
      if (!window.confirm('Точно ли заказ готов? Клиенту будет отправлено уведомление, что его можно забрать.')) {
        return;
      }
    }
    if (!pickup && !tracker.trim()) {
      toast.error('Введите трекер');
      return;
    }
    try {
      setSaving(true);
      await shipOrder(shipping.order.id, pickup ? null : tracker.trim());
      if (mode === 'ship') {
        setGroups((prev) => prev.filter((g) => g.order.id !== shipping.order.id));
        toast.success(pickup ? 'Заказ готов к выдаче' : 'Заказ отправлен');
      } else {
        setGroups((prev) =>
          prev.map((g) =>
            g.order.id === shipping.order.id ? { ...g, order: { ...g.order, tracker: tracker.trim() } } : g
          )
        );
        toast.success('Трекер обновлён');
      }
      setShipping(null);
      setTracker('');
    } catch {
      toast.error(mode === 'ship' ? 'Не удалось отправить заказ' : 'Не удалось обновить трекер');
    } finally {
      setSaving(false);
    }
  };

  const title = (o = {}) => o.contactName || (o.leadId ? `сделка #${o.leadId}` : `заказ #${o.id}`);

  const handleComplete = async () => {
    const g = shipping;
    if (!window.confirm(`Завершить заказ «${title(g.order)}»? Он пропадёт из списка.`)) return;
    try {
      setSaving(true);
      await completeOrder(g.order.id);
      setGroups((prev) => prev.filter((x) => x.order.id !== g.order.id));
      setShipping(null);
      setTracker('');
      toast.success('Заказ завершён');
    } catch {
      toast.error('Не удалось завершить заказ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <CustomHeader />
      <div className={styles.tabsWrap}>
        <CustomTabs />
      </div>

      <div className={styles.subTabs}>
        <button className={`${styles.subTab} ${mode === 'ship' ? styles.subActive : ''}`} onClick={() => setMode('ship')}>
          к отправке
        </button>
        <button className={`${styles.subTab} ${mode === 'delivery' ? styles.subActive : ''}`} onClick={() => setMode('delivery')}>
          доставляются
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>загрузка…</p>
        </div>
      ) : groups.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>
            {mode === 'ship' ? 'нет заказов к отправке' : 'нет заказов в доставке'}
          </p>
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
                {n > 0 ? (
                  <div className={`${styles.collage} ${collageCls}`} onClick={() => openShip(g)}>
                    {images.slice(0, 4).map((img, i) => (
                      <div key={i} className={styles.collageCell}>
                        <img src={img.url} alt="" loading="lazy" />
                        {i === 3 && n > 4 && <span className={styles.more}>+{n - 4}</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.noPhoto} onClick={() => openShip(g)}>нет фотографии</div>
                )}

                <div className={styles.groupBody}>
                  {isPickup(o) && (
                    <span className={styles.pickupBadge} style={PICKUP_BADGE_STYLE}>
                      самовывоз
                    </span>
                  )}
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
                    {mode === 'delivery' && !isPickup(o) && (
                      <Field label="Трекер" value={o.tracker} onCopy={() => copyText(o.tracker, 'Трекер скопирован')} />
                    )}
                    {mode === 'delivery' && o.deliveryStatus && (
                      <Field label="Статус доставки" value={o.deliveryStatus} />
                    )}
                    {o.comment && <Field label="Комментарий" value={o.comment} comment />}
                  </div>

                  {mode === 'ship' ? (
                    <button className={styles.shipBtn} onClick={() => openShip(g)}>
                      {isPickup(o) ? 'готов к выдаче' : 'добавить трекер'}
                    </button>
                  ) : (
                    <button className={styles.completeBtn} onClick={() => openShip(g)}>
                      изменить
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {shipping && (
        <div className={styles.overlay} onClick={closeShip}>
          <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleShip}>
            <div className={styles.modalTitleRow}>
              <div className={styles.modalTitle}>{title(shipping.order)}</div>
              {isPickup(shipping.order) && (
                <span className={styles.pickupBadge} style={PICKUP_BADGE_STYLE}>
                  самовывоз
                </span>
              )}
              {shipping.order.leadId && (
                <a
                  className={styles.crmLink}
                  href={`https://anyforms.amocrm.ru/leads/detail/${shipping.order.leadId}`}
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
            </div>
            {mode === 'delivery' && (
              <div className={styles.contactInfo}>
                <Field label="ФИО" value={shipping.order.contactName} onCopy={() => copyText(shipping.order.contactName, 'ФИО скопировано')} />
                <Field label="Телефон" value={shipping.order.contactPhone} onCopy={() => copyText(shipping.order.contactPhone, 'Телефон скопирован')} />
                {shipping.order.pvzSdekStreet && (
                  <Field label="ПВЗ СДЭК улица" value={shipping.order.pvzSdekStreet} onCopy={() => copyText(shipping.order.pvzSdekStreet, 'ПВЗ улица скопировано')} />
                )}
                {shipping.order.pvzSdekCity && (
                  <Field label="ПВЗ СДЭК город" value={shipping.order.pvzSdekCity} onCopy={() => copyText(shipping.order.pvzSdekCity, 'ПВЗ город скопировано')} />
                )}
                {shipping.order.purchaseDate && <Field label="Дата оплаты" value={formatDate(shipping.order.purchaseDate)} />}
                {shipping.order.deliveryStatus && <Field label="Статус доставки" value={shipping.order.deliveryStatus} />}
                {shipping.order.comment && <Field label="Комментарий" value={shipping.order.comment} comment />}
              </div>
            )}
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
            {!isPickup(shipping.order) && (
              <input
                className={styles.trackerInput}
                placeholder="номер трекера"
                value={tracker}
                onChange={(e) => setTracker(e.target.value)}
                autoFocus
              />
            )}
            {mode === 'delivery' && (
              <button type="button" className={styles.completeModalBtn} onClick={handleComplete} disabled={saving}>
                завершить заказ
              </button>
            )}
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancel} onClick={closeShip} disabled={saving}>
                отмена
              </button>
              {!(mode === 'delivery' && isPickup(shipping.order)) && (
                <button type="submit" className={styles.save} disabled={saving}>
                  {saving
                    ? 'сохраняю…'
                    : mode === 'delivery'
                      ? 'сохранить'
                      : isPickup(shipping.order)
                        ? 'заказ готов'
                        : 'отправить'}
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CustomShipList;
