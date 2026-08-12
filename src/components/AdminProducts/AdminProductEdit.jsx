import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import apiClient from '../../apiClient';
import { getShops } from '../../services/itemsService';
import AutoTextarea from '../CustomOrders/AutoTextarea';
import styles from './AdminProductEdit.module.css';

const DEFAULT_SHOP_SLUG = 'anyforms';
const NEW_ID = 'new';

const emptyForm = {
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
  shopSlugs: [DEFAULT_SHOP_SLUG],
  variants: [],
};

// Имя файла в S3-папке товара: последний сегмент пути presigned-URL.
export const fileNameFromUrl = (src) => {
  try {
    return decodeURIComponent(new URL(src).pathname.split('/').pop());
  } catch {
    return '';
  }
};

const formFromProduct = (p) => ({
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
  shopSlugs: Array.isArray(p.shops) ? p.shops.map((s) => s.slug) : [],
  variants: (p.variants ?? []).map((v) => ({ id: v.id ?? '', label: v.label ?? '', price: v.price ?? '' })),
});

const Section = ({ title, children, hint }) => (
  <section className={styles.card}>
    <h2 className={styles.cardTitle}>{title}</h2>
    {children}
    {hint && <p className={styles.hint}>{hint}</p>}
  </section>
);

const AdminProductEdit = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  // На статическом роуте /admin/products/new параметра в пути нет — это тоже создание товара.
  const isNew = !productId || productId === NEW_ID;

  const [product, setProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [shops, setShops] = useState([]);
  const [amoProducts, setAmoProducts] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [dragIndex, setDragIndex] = useState(null);
  const photos = product?.photos ?? [];

  const authHeaders = useCallback(() => {
    const token = apiClient.getToken ? apiClient.getToken() : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const loadProduct = useCallback(async () => {
    if (isNew) return;
    try {
      const res = await apiClient.instance.get(`/api/product/${productId}`, { headers: authHeaders() });
      setProduct(res.data);
      setForm(formFromProduct(res.data));
    } catch (err) {
      // Товар не загрузился — редактировать нечего, показываем заглушку вместо пустой формы.
      setNotFound(true);
      if (err?.response?.status !== 404) {
        toast.error(err?.response?.data?.error || 'Не удалось загрузить товар');
      }
    } finally {
      setLoading(false);
    }
  }, [productId, isNew, authHeaders]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  // Карточка открыта из середины списка — показываем её с начала.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [productId]);

  useEffect(() => {
    getShops()
      .then(setShops)
      .catch(() => toast.error('Не удалось загрузить магазины'));
    apiClient.instance
      .get('/api/amo/products', { headers: authHeaders() })
      .then((res) => setAmoProducts(Array.isArray(res.data) ? res.data : []))
      .catch(() => setAmoProducts([]));
  }, [authHeaders]);

  const setField = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const toggleShop = (slug) => {
    setForm((prev) => ({
      ...prev,
      shopSlugs: prev.shopSlugs.includes(slug)
        ? prev.shopSlugs.filter((s) => s !== slug)
        : [...prev.shopSlugs, slug],
    }));
  };

  const addVariant = () =>
    setForm((prev) => ({ ...prev, variants: [...prev.variants, { id: '', label: '', price: '' }] }));

  const changeVariant = (index, field, value) =>
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }));

  const removeVariant = (index) =>
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }));

  const handleAmoChange = (e) => {
    const id = e.target.value;
    const picked = amoProducts.find((p) => String(p.id) === String(id));
    setForm((prev) => ({ ...prev, amoProductId: id, amoProductName: picked?.name ?? '' }));
  };

  const buildPayload = () => {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: form.price.trim(),
      tgLink: form.tgLink.trim(),
      active: Boolean(form.active),
      preorder: Boolean(form.preorder),
      shopSlugs: form.shopSlugs,
      variants: form.variants
        .filter((v) => v.label.trim() || v.price.trim())
        .map((v) => ({ id: v.id || undefined, label: v.label.trim(), price: v.price.trim() })),
    };
    if (!isNew) payload.id = productId;
    if (form.folder?.trim()) payload.folder = form.folder.trim();
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
    if (!form.name.trim() || !form.price.trim()) {
      toast.error('Заполните название и цену');
      return;
    }
    setSaving(true);
    try {
      const res = await apiClient.api.saveOrUpdateProduct(buildPayload());
      const saved = res?.data ?? res;
      toast.success(isNew ? 'Товар создан' : 'Товар сохранён');
      if (isNew && saved?.id) {
        // Уходим на страницу созданного товара: там уже можно загрузить фото.
        navigate(`/admin/products/${saved.id}`, { replace: true });
        return;
      }
      setProduct(saved);
      setForm(formFromProduct(saved));
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Не удалось сохранить товар');
    } finally {
      setSaving(false);
    }
  };

  const uploadPhotos = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      const res = await apiClient.instance.post(`/api/product/${productId}/photos`, formData, {
        headers: authHeaders(),
      });
      setProduct(res.data);
      toast.success(files.length === 1 ? 'Фото загружено' : `Загружено фото: ${files.length}`);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Не удалось загрузить фото');
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (src) => {
    const fileName = fileNameFromUrl(src);
    if (!fileName || !window.confirm('Удалить это фото?')) return;
    try {
      const res = await apiClient.instance.delete(`/api/product/${productId}/photos`, {
        params: { file: fileName },
        headers: authHeaders(),
      });
      setProduct(res.data);
      setPreviewIndex(0);
      toast.success('Фото удалено');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Не удалось удалить фото');
    }
  };

  // Порядок задаём именами файлов: первое имя — главное фото на витрине.
  const saveOrder = async (orderedUrls) => {
    const previous = product;
    setProduct((prev) => ({ ...prev, photos: orderedUrls }));
    try {
      const res = await apiClient.instance.put(
        `/api/product/${productId}/photos/order`,
        { fileNames: orderedUrls.map(fileNameFromUrl) },
        { headers: authHeaders() }
      );
      setProduct(res.data);
    } catch (err) {
      setProduct(previous);
      toast.error(err?.response?.data?.error || 'Не удалось изменить порядок фото');
    }
  };

  const movePhoto = (from, to) => {
    if (to < 0 || to >= photos.length || from === to) return;
    const next = [...photos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setPreviewIndex(to);
    saveOrder(next);
  };

  const handleDrop = (targetIndex) => {
    const from = dragIndex;
    setDragIndex(null);
    if (from === null || from === targetIndex) return;
    movePhoto(from, targetIndex);
  };

  const uploadInputRef = useRef(null);
  const uploadInput = (
    <input
      ref={uploadInputRef}
      type="file"
      accept="image/*"
      multiple
      hidden
      disabled={uploading}
      onChange={(e) => {
        uploadPhotos(e.target.files);
        e.target.value = '';
      }}
    />
  );

  if (loading) {
    return <p className={styles.message}>Загрузка товара…</p>;
  }

  if (notFound) {
    return (
      <div className={styles.wrap}>
        <p className={styles.message}>Товар не найден.</p>
        <Link className={styles.backLink} to="/admin/products" state={{ backToList: true }}>← Все товары</Link>
      </div>
    );
  }

  const preview = photos.length > 0 ? Math.min(previewIndex, photos.length - 1) : 0;
  const shopList = shops.length > 0 ? shops : [{ slug: DEFAULT_SHOP_SLUG, name: 'anyforms' }];

  return (
    <div className={styles.wrap}>
      <Link className={styles.backLink} to="/admin/products" state={{ backToList: true }}>← Все товары</Link>

      <form onSubmit={handleSubmit}>
        <header className={styles.pageHead}>
          <div className={styles.headTitles}>
            <h1 className={styles.title}>{isNew ? 'Новый товар' : (form.name || 'Без названия')}</h1>
            <div className={styles.headBadges}>
              {form.shopSlugs.map((slug) => (
                <span
                  key={slug}
                  className={slug === DEFAULT_SHOP_SLUG
                    ? `${styles.badge} ${styles.badgeShopDefault}`
                    : `${styles.badge} ${styles.badgeShop}`}
                >
                  {slug}
                </span>
              ))}
              {form.shopSlugs.length === 0 && (
                <span className={`${styles.badge} ${styles.badgeOff}`}>не на витрине</span>
              )}
              {!form.active && <span className={`${styles.badge} ${styles.badgeOff}`}>выключен</span>}
              {form.preorder && <span className={`${styles.badge} ${styles.badgePreorder}`}>предзаказ</span>}
            </div>
          </div>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? 'Сохранение…' : isNew ? 'Создать товар' : 'Сохранить'}
          </button>
        </header>

        <Section
          title="Фотографии"
          hint={
            isNew
              ? 'Фото можно загрузить после создания товара.'
              : photos.length > 0
                ? 'Первая миниатюра — главное фото на витрине. Перетащите миниатюру или используйте стрелки, чтобы поменять порядок. Крестик удаляет фото.'
                : 'Нажмите на квадрат с плюсом, чтобы загрузить фото. Можно сразу несколько.'
          }
        >
          {isNew ? (
            <div className={styles.galleryEmpty}>Сначала создайте товар</div>
          ) : (
            <>
              {photos.length > 0 && (
                <div className={styles.galleryMain}>
                  <img src={photos[preview]} alt="" />
                  {preview === 0 && <span className={styles.mainTag}>главное фото</span>}
                </div>
              )}
              <div className={styles.thumbs}>
                {photos.map((src, index) => (
                  <div
                    key={fileNameFromUrl(src) || index}
                    className={`${styles.thumb} ${index === preview ? styles.thumbActive : ''} ${
                      index === dragIndex ? styles.thumbDragging : ''
                    }`}
                    draggable
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDrop(index)}
                    onDragEnd={() => setDragIndex(null)}
                    title="Перетащите, чтобы поменять порядок"
                  >
                    <img src={src} alt="" onClick={() => setPreviewIndex(index)} />
                    <button
                      type="button"
                      className={styles.thumbRemove}
                      title="Удалить фото"
                      onClick={() => deletePhoto(src)}
                    >
                      ×
                    </button>
                    <span className={styles.thumbMove}>
                      <button
                        type="button"
                        disabled={index === 0}
                        title="Левее"
                        onClick={() => movePhoto(index, index - 1)}
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        disabled={index === photos.length - 1}
                        title="Правее"
                        onClick={() => movePhoto(index, index + 1)}
                      >
                        ›
                      </button>
                    </span>
                  </div>
                ))}
                <button
                  type="button"
                  className={styles.thumbAdd}
                  title="Добавить фото"
                  disabled={uploading}
                  onClick={() => uploadInputRef.current?.click()}
                >
                  {uploading ? '…' : '+'}
                </button>
                {uploadInput}
              </div>
            </>
          )}
        </Section>

        <Section title="Основное">
          <div className={styles.row}>
            <label className={styles.label}>
              Название *
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={setField}
                className={styles.input}
                placeholder="Лилит"
              />
            </label>
            <label className={styles.label}>
              Порядок на витрине
              <input
                type="number"
                name="orderNumber"
                value={form.orderNumber}
                onChange={setField}
                className={styles.input}
                placeholder="0"
              />
            </label>
          </div>
          <label className={styles.label}>
            Описание
            <AutoTextarea
              name="description"
              minRows={7}
              value={form.description}
              onChange={setField}
              className={`${styles.input} ${styles.textarea}`}
            />
          </label>
        </Section>

        <Section title="Цена">
          <div className={styles.row3}>
            <label className={styles.label}>
              Цена *
              <input
                type="text"
                name="price"
                value={form.price}
                onChange={setField}
                className={styles.input}
                placeholder="890"
              />
            </label>
            <label className={styles.label}>
              Зачёркнутая
              <input
                type="text"
                name="crossedPrice"
                value={form.crossedPrice}
                onChange={setField}
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
                onChange={setField}
                className={styles.input}
                placeholder="26"
              />
            </label>
          </div>
        </Section>

        <Section
          title="Варианты (размер / объём — цена)"
          hint="Без вариантов товар продаётся по основной цене. С вариантами покупатель выбирает один из них, а в заказ позиция уходит как «Название + вариант» (например, «Лилит 20 см») с ценой варианта."
        >
          {form.variants.map((v, index) => (
            <div key={index} className={styles.variantRow}>
              <input
                type="text"
                value={v.label}
                onChange={(e) => changeVariant(index, 'label', e.target.value)}
                className={styles.input}
                placeholder="80 мл"
              />
              <input
                type="text"
                value={v.price}
                onChange={(e) => changeVariant(index, 'price', e.target.value)}
                className={styles.input}
                placeholder="1990"
              />
              <button
                type="button"
                className={styles.variantRemove}
                title="Удалить вариант"
                onClick={() => removeVariant(index)}
              >
                ×
              </button>
            </div>
          ))}
          <button type="button" className={styles.addBtn} onClick={addVariant}>
            + Добавить вариант
          </button>
        </Section>

        <Section title="Витрины и доступность">
          <div className={styles.shopChecks}>
            {shopList.map((shop) => (
              <label key={shop.slug} className={styles.checkLabel}>
                <input
                  type="checkbox"
                  checked={form.shopSlugs.includes(shop.slug)}
                  onChange={() => toggleShop(shop.slug)}
                />
                {shop.name} ({shop.slug})
              </label>
            ))}
          </div>
          {form.shopSlugs.length === 0 && (
            <p className={styles.hint}>Не выбран ни один магазин — товар не попадёт ни на одну витрину.</p>
          )}
          <label className={styles.checkLabel}>
            <input type="checkbox" name="active" checked={form.active} onChange={setField} />
            Активен (доступен к продаже)
          </label>
          <label className={styles.checkLabel}>
            <input type="checkbox" name="preorder" checked={form.preorder} onChange={setField} />
            Предзаказ (плашка и пояснение на витрине)
          </label>
        </Section>

        <Section title="Служебное">
          <label className={styles.label}>
            Товар в АМО
            <select
              name="amoProductId"
              value={form.amoProductId}
              onChange={handleAmoChange}
              className={styles.input}
            >
              <option value="">— не привязан —</option>
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
          </label>
          <div className={styles.row}>
            <label className={styles.label}>
              Ссылка TG
              <input
                type="text"
                name="tgLink"
                value={form.tgLink}
                onChange={setField}
                className={styles.input}
                placeholder="https://t.me/..."
              />
            </label>
            <label className={styles.label}>
              Папка в S3 (под shop/)
              <input
                type="text"
                name="folder"
                value={form.folder}
                onChange={setField}
                className={styles.input}
                placeholder="создастся сама при загрузке фото"
              />
            </label>
          </div>
          {!isNew && <p className={styles.idLine}>ID: <code>{productId}</code></p>}
        </Section>

        <div className={styles.footActions}>
          <Link className={styles.cancelBtn} to="/admin/products" state={{ backToList: true }}>К списку</Link>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? 'Сохранение…' : isNew ? 'Создать товар' : 'Сохранить'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProductEdit;
