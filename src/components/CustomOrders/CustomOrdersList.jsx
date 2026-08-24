import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getCustomOrders, createCustomOrder, searchContacts, isPickup, PICKUP_BADGE_STYLE } from '../../services/customProducts';
import CustomTabs from './CustomTabs';
import styles from './CustomOrdersList.module.css';

const EMPTY_FORM = { contactName: '', contactPhone: '', pvzSdekCity: '', pvzSdekStreet: '', pickup: false };

const fmtDate = (s) => {
  try {
    return s ? new Date(s).toLocaleDateString('ru-RU') : '';
  } catch {
    return '';
  }
};

const CustomOrdersList = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('empty'); // 'empty' | 'all'
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setOrders(await getCustomOrders());
    } catch {
      toast.error('Ошибка при загрузке заказов');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Поиск клиента по ФИО/телефону (debounce).
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        setSuggestions(await searchContacts(q));
      } catch {
        /* тихо игнорируем */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const cnt = (o) => o.customItemsCount || 0;
  const filtered = orders.filter((o) => {
    if (filter !== 'all' && cnt(o) !== 0) return false;
    const q = search.trim().toLowerCase();
    if (!q) return true;
    const haystack = [o.contactName, o.contactPhone, o.pvzSdekCity, o.pvzSdekStreet, o.id, o.leadId]
      .filter((v) => v != null && v !== '')
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setQuery('');
    setSuggestions([]);
    setCreating(true);
  };
  const closeCreate = () => {
    if (!saving) setCreating(false);
  };

  const pickSuggestion = (s) => {
    setForm((p) => ({
      ...p,
      contactName: s.contactName || '',
      contactPhone: s.contactPhone || '',
      pvzSdekCity: s.pvzSdekCity || '',
      pvzSdekStreet: s.pvzSdekStreet || '',
    }));
    setQuery('');
    setSuggestions([]);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const created = await createCustomOrder({
        contactName: form.contactName.trim() || null,
        contactPhone: form.contactPhone.trim() || null,
        pvzSdekCity: form.pvzSdekCity.trim() || null,
        pvzSdekStreet: form.pvzSdekStreet.trim() || null,
        deliveryMethod: form.pickup ? 'PICKUP' : 'CDEK',
      });
      navigate(`/admin/orders/custom/order/${created.id}`);
    } catch {
      toast.error('Не удалось создать заказ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.tabsWrap}>
        <CustomTabs />
      </div>

      <div className={styles.controls}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="поиск: ФИО, телефон, город, адрес, № заказа…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.subTabs}>
        <button className={`${styles.subTab} ${filter === 'empty' ? styles.subActive : ''}`} onClick={() => setFilter('empty')}>
          не оформленные
        </button>
        <button className={`${styles.subTab} ${filter === 'all' ? styles.subActive : ''}`} onClick={() => setFilter('all')}>
          все
        </button>
        <button className={styles.plusBtn} onClick={openCreate} title="Создать заказ с нуля">+</button>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>загрузка…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>
            {search ? 'ничего не найдено' : filter === 'empty' ? 'нет не оформленных заказов' : 'под-заказов нет'}
          </p>
        </div>
      ) : (
        <div className={styles.cards}>
          {filtered.map((o) => (
            <div key={o.id} className={styles.card} onClick={() => navigate(`/admin/orders/custom/order/${o.id}`)}>
              <div className={styles.cardHead}>
                <span className={styles.cardTitle}>
                  {o.contactName || (o.publicId ? `#${o.publicId}` : `заказ #${o.id}`)}
                </span>
                <span className={styles.headBadges}>
                  {isPickup(o) && (
                    <span className={styles.badge} style={PICKUP_BADGE_STYLE}>самовывоз</span>
                  )}
                  <span className={`${styles.badge} ${cnt(o) === 0 ? styles.badgeEmpty : ''}`}>
                    {cnt(o) === 0 ? 'не оформлен' : `${cnt(o)} поз.`}
                  </span>
                </span>
              </div>
              <div className={styles.cardMeta}>
                {o.contactPhone && <span>{o.contactPhone}</span>}
                {o.leadId && <span>amo #{o.leadId}</span>}
                {o.purchaseDate && <span>{fmtDate(o.purchaseDate)}</span>}
              </div>
              <div className={styles.fillHint}>заполнить →</div>
            </div>
          ))}
        </div>
      )}

      {creating && (
        <div className={styles.modalOverlay} onClick={closeCreate}>
          <form className={styles.modal} onClick={(e) => e.stopPropagation()} onSubmit={handleCreate}>
            <div className={styles.modalTitle}>новый заказ</div>

            <div className={styles.searchWrap}>
              <input
                className={styles.modalInput}
                placeholder="найти клиента (ФИО / телефон)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              {suggestions.length > 0 && (
                <div className={styles.suggestions}>
                  {suggestions.map((s, i) => (
                    <button type="button" key={i} className={styles.suggestion} onClick={() => pickSuggestion(s)}>
                      <span className={styles.sugName}>{s.contactName || '—'}</span>
                      <span className={styles.sugMeta}>
                        {[s.contactPhone, [s.pvzSdekCity, s.pvzSdekStreet].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <input className={styles.modalInput} placeholder="ФИО" value={form.contactName} onChange={(e) => setF('contactName', e.target.value)} />
            <input className={styles.modalInput} placeholder="телефон" value={form.contactPhone} onChange={(e) => setF('contactPhone', e.target.value)} />
            <input className={styles.modalInput} placeholder="город" value={form.pvzSdekCity} onChange={(e) => setF('pvzSdekCity', e.target.value)} />
            <input className={styles.modalInput} placeholder="улица / адрес" value={form.pvzSdekStreet} onChange={(e) => setF('pvzSdekStreet', e.target.value)} />

            <label className={styles.pickupCheck}>
              <input type="checkbox" checked={form.pickup} onChange={(e) => setF('pickup', e.target.checked)} />
              <span>самовывоз (клиент заберёт лично, без СДЭК)</span>
            </label>

            <div className={styles.modalActions}>
              <button type="button" className={styles.modalCancel} onClick={closeCreate} disabled={saving}>
                отмена
              </button>
              <button type="submit" className={styles.modalCreate} disabled={saving}>
                {saving ? 'создаю…' : 'создать'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default CustomOrdersList;
