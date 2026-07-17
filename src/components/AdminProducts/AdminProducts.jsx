import React, { useState, useEffect } from 'react';
import apiClient from '../../apiClient';
import styles from './AdminProducts.module.css';

const initialForm = {
  id: '',
  name: '',
  description: '',
  folder: '',
  price: '',
  crossedPrice: '',
  discountPercent: '',
  tgLink: '',
  orderNumber: '',
  amoProductId: '',
  amoProductName: '',
  active: true,
  preorder: false,
};

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState(initialForm);
  const [expandedId, setExpandedId] = useState(null);
  const [amoProducts, setAmoProducts] = useState([]);
  const [amoError, setAmoError] = useState('');
  const [uploadingId, setUploadingId] = useState(null);
  const formRef = React.useRef(null);

  const authHeaders = () => {
    const token = apiClient.getToken ? apiClient.getToken() : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadProducts = async () => {
    try {
      // /api/product/all — админский список: включает и выключенные товары.
      const res = await apiClient.instance.get('/api/product/all', { headers: authHeaders() });
      const data = Array.isArray(res.data) ? res.data : [];
      setProducts(data);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  };

  const loadAmoProducts = async () => {
    try {
      // /api/amo/products под ADMIN — токен добавляем сами (securityWorker работает
      // только для сгенерированных вызовов apiClient.api.*).
      const token = apiClient.getToken ? apiClient.getToken() : null;
      const res = await apiClient.instance.get('/api/amo/products', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setAmoProducts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setAmoError(err?.response?.data?.error || err?.message || 'Не удалось загрузить товары АМО');
    }
  };

  useEffect(() => {
    loadProducts();
    loadAmoProducts();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // При выборе товара АМО запоминаем и id, и имя (имя уходит в позиции заказа).
  const handleAmoProductChange = (e) => {
    const id = e.target.value;
    const picked = amoProducts.find((p) => String(p.id) === String(id));
    setForm((prev) => ({
      ...prev,
      amoProductId: id,
      amoProductName: picked?.name ?? '',
    }));
  };

  const buildPayload = () => {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: form.price.trim(),
      tgLink: form.tgLink.trim(),
      active: Boolean(form.active),
      preorder: Boolean(form.preorder),
    };
    // Папку шлём только если заполнена: при обновлении пустое поле не меняет текущую папку.
    if (form.folder?.trim()) payload.folder = form.folder.trim();
    if (form.id?.trim()) payload.id = form.id.trim();
    if (form.crossedPrice?.trim()) payload.crossedPrice = form.crossedPrice.trim();
    if (form.discountPercent?.trim()) payload.discountPercent = form.discountPercent.trim();
    const orderNum = parseInt(form.orderNumber, 10);
    if (!Number.isNaN(orderNum)) payload.orderNumber = orderNum;
    const amoId = parseInt(String(form.amoProductId).trim(), 10);
    if (!Number.isNaN(amoId)) {
      payload.amoProductId = amoId;
      if (form.amoProductName?.trim()) payload.amoProductName = form.amoProductName.trim();
    }
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const payload = buildPayload();
      await apiClient.api.saveOrUpdateProduct(payload);
      setMessage(form.id ? 'Товар обновлён' : 'Товар добавлен');
      setForm(initialForm);
      await loadProducts();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const fillForm = (p) => {
    setForm({
      id: p.id ?? '',
      name: p.name ?? '',
      description: p.description ?? '',
      folder: p.folder ?? '',
      price: p.price ?? '',
      crossedPrice: p.crossedPrice ?? '',
      discountPercent: p.discountPercent ?? '',
      tgLink: p.tgLink ?? '',
      orderNumber: p.orderNumber ?? '',
      amoProductId: p.amoProductId ?? '',
      amoProductName: p.amoProductName ?? '',
      active: p.active !== false,
      preorder: Boolean(p.preorder),
    });
    setMessage('');
    setError('');
    setExpandedId(null);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleDeletePhoto = async (id, src) => {
    let fileName = null;
    try {
      fileName = decodeURIComponent(new URL(src).pathname.split('/').pop());
    } catch {
      /* некорректный URL — кнопку просто игнорируем */
    }
    if (!fileName) return;
    if (!window.confirm('Удалить это фото?')) return;
    setError('');
    setMessage('');
    try {
      await apiClient.instance.delete(`/api/product/${id}/photos`, {
        params: { file: fileName },
        headers: authHeaders(),
      });
      setMessage('Фото удалено');
      await loadProducts();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Не удалось удалить фото');
    }
  };

  // Превью фото с крестиком удаления — используется и в форме, и в раскрытом товаре.
  const renderPhotos = (productId, photos) => (
    <div className={styles.photosList}>
      {photos.map((src, j) => (
        <div key={j} className={styles.photoWrap}>
          <a href={src} target="_blank" rel="noopener noreferrer" className={styles.photoThumb}>
            <img src={src} alt="" />
          </a>
          <button
            type="button"
            className={styles.photoDelete}
            title="Удалить фото"
            onClick={() => handleDeletePhoto(productId, src)}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );

  const handleUpload = async (id, fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploadingId(id);
    setError('');
    setMessage('');
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      await apiClient.instance.post(`/api/product/${id}/photos`, formData, {
        headers: authHeaders(),
      });
      setMessage(`Загружено фото: ${files.length}`);
      await loadProducts();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Не удалось загрузить фото');
    } finally {
      setUploadingId(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.wrap}>
        <p className={styles.message}>Загрузка товаров...</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Управление товарами</h1>

      <form ref={formRef} onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGrid}>
          <label className={styles.label}>
            ID (для обновления, оставьте пустым для нового)
            <input
              type="text"
              name="id"
              value={form.id}
              onChange={handleChange}
              className={styles.input}
              placeholder="uuid"
            />
          </label>
          <label className={styles.label}>
            Название *
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className={styles.input}
            />
          </label>
          <label className={styles.label}>
            Описание
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className={styles.textarea}
              rows={3}
            />
          </label>
          <label className={styles.label}>
            Папка (S3, под shop/) — можно не заполнять, создастся сама при загрузке фото
            <input
              type="text"
              name="folder"
              value={form.folder}
              onChange={handleChange}
              className={styles.input}
              placeholder="heart"
            />
          </label>
          <label className={styles.label}>
            Цена *
            <input
              type="text"
              name="price"
              value={form.price}
              onChange={handleChange}
              className={styles.input}
              placeholder="890"
            />
          </label>
          <label className={styles.label}>
            Зачёркнутая цена
            <input
              type="text"
              name="crossedPrice"
              value={form.crossedPrice}
              onChange={handleChange}
              className={styles.input}
              placeholder="1190"
            />
          </label>
          <label className={styles.label}>
            Скидка %
            <input
              type="text"
              name="discountPercent"
              value={form.discountPercent}
              onChange={handleChange}
              className={styles.input}
              placeholder="26"
            />
          </label>
          <label className={styles.label}>
            Ссылка TG
            <input
              type="text"
              name="tgLink"
              value={form.tgLink}
              onChange={handleChange}
              className={styles.input}
              placeholder="https://t.me/..."
            />
          </label>
          <label className={styles.label}>
            Порядок
            <input
              type="number"
              name="orderNumber"
              value={form.orderNumber}
              onChange={handleChange}
              className={styles.input}
              placeholder="0"
            />
          </label>
          <label className={styles.label}>
            Товар в АМО
            <select
              name="amoProductId"
              value={form.amoProductId}
              onChange={handleAmoProductChange}
              className={styles.input}
            >
              <option value="">— не привязан —</option>
              {/* Если у товара сохранён ID, которого нет в загруженном списке — показываем как есть. */}
              {form.amoProductId &&
                !amoProducts.some((p) => String(p.id) === String(form.amoProductId)) && (
                  <option value={form.amoProductId}>
                    {form.amoProductName || `ID ${form.amoProductId}`}
                  </option>
                )}
              {amoProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name || `ID ${p.id}`}
                </option>
              ))}
            </select>
            {amoError && <span className={styles.error}>{amoError}</span>}
          </label>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              name="active"
              checked={form.active}
              onChange={handleChange}
            />
            Товар активен (доступен к продаже)
          </label>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              name="preorder"
              checked={form.preorder}
              onChange={handleChange}
            />
            Предзаказ (плашка и пояснение на витрине)
          </label>
        </div>
        {form.id?.trim() ? (
          <div className={styles.uploadRow}>
            {(() => {
              const formProduct = products.find((p) => p.id === form.id.trim());
              return formProduct?.photos?.length > 0 ? renderPhotos(formProduct.id, formProduct.photos) : null;
            })()}
            <label className={styles.uploadBtn}>
              {uploadingId === form.id ? 'Загрузка…' : '+ Загрузить фото'}
              <input
                type="file"
                multiple
                accept="image/*"
                hidden
                disabled={uploadingId === form.id}
                onChange={(e) => {
                  handleUpload(form.id.trim(), e.target.files);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        ) : (
          <p className={styles.hintText}>
            Фото можно загрузить после сохранения товара — кнопка появится здесь и в «Подробнее» у товара в списке.
          </p>
        )}
        {error && <p className={styles.error}>{error}</p>}
        {message && <p className={styles.success}>{message}</p>}
        <button type="submit" className={styles.submit} disabled={saving}>
          {saving ? 'Сохранение…' : form.id ? 'Обновить товар' : 'Добавить товар'}
        </button>
      </form>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Товары ({products.length})</h2>
        {products.length === 0 ? (
          <p className={styles.message}>Товаров пока нет.</p>
        ) : (
          <ul className={styles.list}>
            {products.map((p, i) => {
              const isExpanded = expandedId === (p.id ?? i);
              return (
                <li key={p.id ?? `item-${i}`} className={styles.item}>
                  <div className={styles.itemMain}>
                    <span className={styles.itemName}>
                      {p.name ?? '—'}
                      {p.active === false && <span className={styles.badgeOff}>Выключен</span>}
                      {p.preorder && <span className={styles.badgePreorder}>Предзаказ</span>}
                    </span>
                    <span className={styles.itemPrice}>{p.price ?? '—'} ₽</span>
                  </div>
                  <div className={styles.itemActions}>
                    <button
                      type="button"
                      className={styles.viewBtn}
                      onClick={() => toggleExpand(p.id ?? i)}
                    >
                      {isExpanded ? 'Свернуть' : 'Подробнее'}
                    </button>
                    {p.id && (
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={() => fillForm(p)}
                      >
                        Изменить
                      </button>
                    )}
                  </div>
                  {isExpanded && (
                    <div className={styles.itemExpand}>
                      {p.id && (
                        <p className={styles.itemRow}>
                          <span className={styles.itemLabel}>ID:</span>{' '}
                          <code className={styles.itemId}>{p.id}</code>
                        </p>
                      )}
                      {p.description && (
                        <p className={styles.itemRow}>
                          <span className={styles.itemLabel}>Описание:</span>{' '}
                          {p.description}
                        </p>
                      )}
                      <p className={styles.itemRow}>
                        <span className={styles.itemLabel}>Цена:</span>{' '}
                        {p.price ?? '—'} ₽
                        {p.crossedPrice && (
                          <> · зачёркнутая {p.crossedPrice} ₽</>
                        )}
                        {p.discountPercent != null && p.discountPercent !== '' && (
                          <> · скидка {p.discountPercent}%</>
                        )}
                      </p>
                      {p.tgLink && (
                        <p className={styles.itemRow}>
                          <span className={styles.itemLabel}>TG:</span>{' '}
                          <a href={p.tgLink} target="_blank" rel="noopener noreferrer" className={styles.link}>
                            {p.tgLink}
                          </a>
                        </p>
                      )}
                      {p.photos?.length > 0 && (
                        <div className={styles.itemPhotos}>
                          <span className={styles.itemLabel}>Фото:</span>
                          {renderPhotos(p.id, p.photos)}
                        </div>
                      )}
                      {p.id && (
                        <div className={styles.uploadRow}>
                          <label className={styles.uploadBtn}>
                            {uploadingId === p.id ? 'Загрузка…' : '+ Загрузить фото'}
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              hidden
                              disabled={uploadingId === p.id}
                              onChange={(e) => {
                                handleUpload(p.id, e.target.files);
                                e.target.value = '';
                              }}
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

export default AdminProducts;
