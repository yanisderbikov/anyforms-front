import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getOrder, getItemsByOrder, createItem, addItemFiles } from '../../services/customProducts';
import CustomItemCard from './CustomItemCard';
import CustomItemModal from './CustomItemModal';
import AutoTextarea from './AutoTextarea';
import styles from './CustomOrderFill.module.css';

const EMPTY = { productName: '', description: '', quantity: 1 };

const CustomOrderFill = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY);
  const [drafts, setDrafts] = useState([]); // [{ file, url }]
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [o, list] = await Promise.all([getOrder(orderId), getItemsByOrder(orderId)]);
        setOrder(o);
        setItems(list);
      } catch {
        toast.error('Не удалось загрузить заказ');
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  const setF = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  const clearDrafts = () =>
    setDrafts((prev) => {
      prev.forEach((d) => URL.revokeObjectURL(d.url));
      return [];
    });
  const onPick = (e) => {
    const picked = Array.from(e.target.files || []);
    if (picked.length) setDrafts((prev) => [...prev, ...picked.map((f) => ({ file: f, url: URL.createObjectURL(f) }))]);
    e.target.value = '';
  };
  const removeDraft = (i) =>
    setDrafts((prev) => {
      const d = prev[i];
      if (d) URL.revokeObjectURL(d.url);
      return prev.filter((_, j) => j !== i);
    });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.productName.trim() || Number(form.quantity) < 1) {
      toast.error('Заполните название и количество');
      return;
    }
    try {
      setSaving(true);
      const created = await createItem(orderId, {
        productName: form.productName.trim(),
        description: form.description.trim(),
        quantity: Number(form.quantity),
      });
      let result = created;
      const files = drafts.map((d) => d.file);
      if (files.length) {
        try {
          result = await addItemFiles(created.id, files);
        } catch {
          toast.error('Позиция создана, но файлы не загрузились');
        }
      }
      setItems((prev) => [...prev, result]);
      setForm(EMPTY);
      clearDrafts();
    } catch {
      toast.error('Не удалось создать позицию');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>загрузка…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerSafeArea} aria-hidden="true" />
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button className={styles.back} onClick={() => navigate('/orders/custom/create')}>← к заказам</button>
          <span className={styles.logoLink}>
            <img className={styles.logo} src="/anyforms_logo_new_white.svg" alt="anyforms" width={180} height={41} decoding="async" />
          </span>
        </div>
      </header>

      <div className={styles.orderInfo}>
        <h1 className={styles.orderTitle}>
          {order?.contactName || (order?.leadId ? `сделка #${order.leadId}` : `заказ #${orderId}`)}
        </h1>
        <div className={styles.orderMeta}>
          {order?.contactPhone && <span>{order.contactPhone}</span>}
          {order?.leadId && <span>amo #{order.leadId}</span>}
          <span>позиций: {items.length}</span>
        </div>
      </div>

      <form className={styles.form} onSubmit={submit}>
        <div className={styles.formTitle}>новая позиция</div>
        <input className={styles.input} placeholder="название продукта" value={form.productName} onChange={(e) => setF('productName', e.target.value)} />
        <AutoTextarea className={styles.textarea} placeholder="описание" value={form.description} onChange={(e) => setF('description', e.target.value)} />
        <input className={styles.inputNarrow} type="number" min={1} placeholder="кол-во" value={form.quantity} onChange={(e) => setF('quantity', e.target.value)} />

        <span className={styles.label}>файлы (любые: фото, чертёж, zip…)</span>
        <div className={styles.drafts}>
          {drafts.map((d, i) => (
            <div key={i} className={styles.draft}>
              {/^image\//.test(d.file.type) ? (
                <img src={d.url} alt="" />
              ) : (
                <span className={styles.draftExt}>{(d.file.name.split('.').pop() || 'FILE').toUpperCase()}</span>
              )}
              <button type="button" className={styles.draftDel} onClick={() => removeDraft(i)}>×</button>
            </div>
          ))}
          <label className={styles.addFile}>
            +<input ref={fileRef} type="file" multiple hidden onChange={onPick} />
          </label>
        </div>

        <button className={styles.submit} type="submit" disabled={saving}>
          {saving ? 'добавляю…' : 'добавить позицию'}
        </button>
      </form>

      {items.length > 0 && (
        <div className={styles.itemsGrid}>
          {items.map((it) => (
            <CustomItemCard key={it.id} item={it} hideStatus onOpen={() => setSelected(it)} />
          ))}
        </div>
      )}

      {selected && (
        <CustomItemModal
          item={selected}
          hideStatus
          onClose={() => setSelected(null)}
          onSaved={(updated) => setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)))}
          onDeleted={(id) => setItems((prev) => prev.filter((i) => i.id !== id))}
        />
      )}
    </div>
  );
};

export default CustomOrderFill;
