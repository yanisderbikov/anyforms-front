import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import {
  CUSTOM_EDIT_STATUSES,
  CUSTOM_STATUS_LABELS,
  isImageFile,
  fileExt,
  updateItem,
  updateItemStatus,
  addItemFiles,
  deleteFile,
  deleteItem,
  getModelers,
} from '../../services/customProducts';
import AutoTextarea from './AutoTextarea';
import ModelerSelect from './ModelerSelect';
import UploadProgress from '../shared/UploadProgress';
import styles from './CustomItemModal.module.css';

const CustomItemModal = ({ item, onClose, onSaved, onDeleted, hideStatus }) => {
  const [form, setForm] = useState({
    productName: item.productName || '',
    description: item.description || '',
    quantity: item.quantity ?? 1,
    status: item.status || 'MODELING',
    modeler: item.modeler || '',
  });
  const [modelers, setModelers] = useState([]);
  const [existing, setExisting] = useState(item.files || []);
  const [removedIds, setRemovedIds] = useState(() => new Set());
  const [drafts, setDrafts] = useState([]); // [{ file, url }]
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // { percent, index, count, filename }
  const fileRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (hideStatus) return;
    getModelers()
      .then((list) => setModelers(Array.isArray(list) ? list : []))
      .catch(() => {});
  }, [hideStatus]);

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

  const toggleRemoveExisting = (id) =>
    setRemovedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  const visibleExisting = existing.filter((f) => !removedIds.has(f.id));

  const save = async () => {
    if (!form.productName.trim() || Number(form.quantity) < 1) {
      toast.error('Заполните название и количество');
      return;
    }
    try {
      setSaving(true);
      let latest = await updateItem(item.id, {
        productName: form.productName.trim(),
        description: form.description.trim(),
        quantity: Number(form.quantity),
        modeler: form.modeler ? form.modeler.trim() : null,
      });
      if (!hideStatus && form.status !== item.status) {
        latest = await updateItemStatus(item.id, form.status);
      }
      for (const fid of removedIds) {
        latest = await deleteFile(fid);
      }
      const files = drafts.map((d) => d.file);
      if (files.length) {
        latest = await addItemFiles(item.id, files, (percent, meta) =>
          setUploadProgress({ percent, ...meta })
        );
      }
      clearDrafts();
      onSaved?.(latest);
      toast.success('Сохранено');
      onClose();
    } catch {
      toast.error('Не удалось сохранить');
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  const removePosition = async () => {
    if (!window.confirm('Удалить позицию целиком?')) return;
    try {
      await deleteItem(item.id);
      onDeleted?.(item.id);
      onClose();
    } catch {
      toast.error('Не удалось удалить');
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <button className={styles.close} onClick={onClose} aria-label="Закрыть">×</button>

        <input
          className={styles.titleInput}
          value={form.productName}
          placeholder="название продукта"
          onChange={(e) => setF('productName', e.target.value)}
        />

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>кол-во</span>
            <input className={styles.input} type="number" min={1} value={form.quantity} onChange={(e) => setF('quantity', e.target.value)} />
          </label>
          {!hideStatus && (
            <label className={styles.field}>
              <span className={styles.label}>статус</span>
              <select className={styles.select} value={form.status} onChange={(e) => setF('status', e.target.value)}>
                {!CUSTOM_EDIT_STATUSES.some((s) => s.value === form.status) && (
                  <option value={form.status} disabled>
                    {CUSTOM_STATUS_LABELS[form.status] || form.status}
                  </option>
                )}
                {CUSTOM_EDIT_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        {!hideStatus && (
          <label className={styles.field}>
            <span className={styles.label}>кто моделирует</span>
            <ModelerSelect value={form.modeler} options={modelers} onChange={(v) => setF('modeler', v || '')} />
          </label>
        )}

        <label className={styles.field}>
          <span className={styles.label}>описание</span>
          <AutoTextarea className={styles.textarea} minRows={3} value={form.description} onChange={(e) => setF('description', e.target.value)} />
        </label>

        <span className={styles.label}>файлы</span>
        <div className={styles.files}>
          {visibleExisting.map((f) => (
            <div key={f.id} className={styles.file}>
              {isImageFile(f) ? (
                <a href={f.url} target="_blank" rel="noreferrer"><img src={f.url} alt="" /></a>
              ) : (
                <a className={styles.fileLink} href={f.url} target="_blank" rel="noreferrer"><span className={styles.fileExt}>{fileExt(f)}</span></a>
              )}
              <button type="button" className={styles.fileDel} onClick={() => toggleRemoveExisting(f.id)} title="убрать">×</button>
            </div>
          ))}
          {drafts.map((d, i) => (
            <div key={`d${i}`} className={`${styles.file} ${styles.draft}`}>
              {/^image\//.test(d.file.type) ? <img src={d.url} alt="" /> : <span className={styles.fileExt}>{(d.file.name.split('.').pop() || 'FILE').toUpperCase()}</span>}
              <button type="button" className={styles.fileDel} onClick={() => removeDraft(i)} title="убрать">×</button>
            </div>
          ))}
          <label className={styles.addFile} title="добавить файл">
            +<input ref={fileRef} type="file" multiple hidden onChange={onPick} />
          </label>
        </div>

        {saving && uploadProgress && <UploadProgress progress={uploadProgress} />}

        <div className={styles.footer}>
          <button className={styles.deletePos} onClick={removePosition}>удалить позицию</button>
          <button className={styles.save} onClick={save} disabled={saving}>{saving ? 'сохраняю…' : 'сохранить'}</button>
        </div>
      </div>
    </div>
  );
};

export default CustomItemModal;
