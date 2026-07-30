import React, { useState, useEffect } from 'react';
import apiClient from '../../apiClient';
import { getShops } from '../../services/itemsService';
import styles from './AdminProducts.module.css';

// Магазин по умолчанию: витрина anyforms.
const DEFAULT_SHOP_SLUG = 'anyforms';

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
  shopSlugs: [DEFAULT_SHOP_SLUG],
  // Варианты товара (размер/объём — цена); пусто — товар продаётся по основной цене.
  variants: [],
};

// Слаги магазинов товара; поддерживаем и старый формат ответа с одним shopSlug.
const productShopSlugs = (p) =>
  Array.isArray(p.shops) ? p.shops.map((s) => s.slug) : (p.shopSlug ? [p.shopSlug] : []);

const pluralVariants = (n) => {
  const tail10 = n % 10;
  const tail100 = n % 100;
  if (tail10 === 1 && tail100 !== 11) return 'вариант';
  if (tail10 >= 2 && tail10 <= 4 && (tail100 < 12 || tail100 > 14)) return 'варианта';
  return 'вариантов';
};

const Fieldset = ({ title, children }) => (
  <section className={styles.fieldset}>
    <h3 className={styles.fieldsetTitle}>{title}</h3>
    {children}
  </section>
);

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // Сообщения страницы (загрузка данных, результат сохранения после закрытия редактора).
  const [pageError, setPageError] = useState('');
  const [pageMessage, setPageMessage] = useState('');
  // Сообщения внутри редактора (неудачное сохранение, работа с фото).
  const [formError, setFormError] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [form, setForm] = useState(initialForm);
  const [editorOpen, setEditorOpen] = useState(false);
  const [amoProducts, setAmoProducts] = useState([]);
  const [amoError, setAmoError] = useState('');
  const [uploadingId, setUploadingId] = useState(null);
  const [shops, setShops] = useState([]);
  // Фильтры списка: магазин ('' — все), статус, поиск по названию.
  const [shopFilter, setShopFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [nameFilter, setNameFilter] = useState('');
  const descRef = React.useRef(null);

  // Описание: минимум 7 строк, дальше высота подстраивается под текст.
  React.useEffect(() => {
    const el = descRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`;
  }, [form.description, editorOpen]);

  // Пока редактор открыт: Escape закрывает, фон не скроллится.
  useEffect(() => {
    if (!editorOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setEditorOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [editorOpen]);

  // Сообщение об успехе на странице живёт недолго — дальше не мешает работе.
  useEffect(() => {
    if (!pageMessage) return undefined;
    const timer = setTimeout(() => setPageMessage(''), 4000);
    return () => clearTimeout(timer);
  }, [pageMessage]);

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
      setPageError('');
    } catch (err) {
      setPageError(err?.response?.data?.error || err?.message || 'Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  };

  const loadShops = async () => {
    try {
      setShops(await getShops());
    } catch (err) {
      setPageError(err?.response?.data?.error || err?.message || 'Не удалось загрузить магазины');
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
    loadShops();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Галочки магазинов: в каких витринах продаётся товар.
  const toggleShop = (slug) => {
    setForm((prev) => ({
      ...prev,
      shopSlugs: prev.shopSlugs.includes(slug)
        ? prev.shopSlugs.filter((s) => s !== slug)
        : [...prev.shopSlugs, slug],
    }));
  };

  const addVariant = () => {
    setForm((prev) => ({ ...prev, variants: [...prev.variants, { id: '', label: '', price: '' }] }));
  };

  const changeVariant = (index, field, value) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }));
  };

  const removeVariant = (index) => {
    setForm((prev) => ({ ...prev, variants: prev.variants.filter((_, i) => i !== index) }));
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
      // Полный набор витрин товара; пустой список — товар нигде не показывается.
      shopSlugs: form.shopSlugs,
      // Полный набор вариантов; вариант с id обновляется (не ломает корзины), пустые строки не шлём.
      variants: form.variants
        .filter((v) => v.label.trim() || v.price.trim())
        .map((v) => ({ id: v.id || undefined, label: v.label.trim(), price: v.price.trim() })),
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
    setFormError('');
    setFormMessage('');
    setSaving(true);
    const isUpdate = Boolean(form.id);
    try {
      await apiClient.api.saveOrUpdateProduct(buildPayload());
      await loadProducts();
      setEditorOpen(false);
      setForm(initialForm);
      setPageMessage(isUpdate ? 'Товар обновлён' : 'Товар добавлен');
    } catch (err) {
      // Редактор оставляем открытым: заполненные поля не должны потеряться.
      setFormError(err?.response?.data?.error || err?.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const openCreate = () => {
    setForm({
      ...initialForm,
      // Новый товар сразу попадает в магазин, по которому отфильтрован список.
      shopSlugs: [shopFilter || DEFAULT_SHOP_SLUG],
    });
    setFormError('');
    setFormMessage('');
    setEditorOpen(true);
  };

  const openEdit = (p) => {
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
      shopSlugs: productShopSlugs(p),
      variants: (p.variants ?? []).map((v) => ({ id: v.id ?? '', label: v.label ?? '', price: v.price ?? '' })),
    });
    setFormError('');
    setFormMessage('');
    setEditorOpen(true);
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
    setFormError('');
    setFormMessage('');
    try {
      await apiClient.instance.delete(`/api/product/${id}/photos`, {
        params: { file: fileName },
        headers: authHeaders(),
      });
      setFormMessage('Фото удалено');
      await loadProducts();
    } catch (err) {
      setFormError(err?.response?.data?.error || err?.message || 'Не удалось удалить фото');
    }
  };

  const handleUpload = async (id, fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploadingId(id);
    setFormError('');
    setFormMessage('');
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      await apiClient.instance.post(`/api/product/${id}/photos`, formData, {
        headers: authHeaders(),
      });
      setFormMessage(`Загружено фото: ${files.length}`);
      await loadProducts();
    } catch (err) {
      setFormError(err?.response?.data?.error || err?.message || 'Не удалось загрузить фото');
    } finally {
      setUploadingId(null);
    }
  };

  const nameQuery = nameFilter.trim().toLowerCase();
  const visibleProducts = products
    .filter((p) => {
      if (shopFilter && !productShopSlugs(p).includes(shopFilter)) return false;
      if (statusFilter === 'active' && p.active === false) return false;
      if (statusFilter === 'off' && p.active !== false) return false;
      if (nameQuery && !(p.name ?? '').toLowerCase().includes(nameQuery)) return false;
      return true;
    })
    // Порядок витрины, а внутри — по алфавиту: у товаров без orderNumber бэкенд
    // порядок не задаёт, и без этого строка прыгала по списку после сохранения.
    .sort((a, b) => {
      const orderA = a.orderNumber ?? Number.MAX_SAFE_INTEGER;
      const orderB = b.orderNumber ?? Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) return orderA - orderB;
      return (a.name ?? '').localeCompare(b.name ?? '', 'ru');
    });

  const onSaleCount = products.filter(
    (p) => p.active !== false && productShopSlugs(p).length > 0
  ).length;
  const isFiltered = Boolean(shopFilter || nameQuery || statusFilter !== 'all');
  // Фото товара, который сейчас в редакторе: приходят с сервера вместе со списком.
  const editingProduct = form.id ? products.find((p) => p.id === form.id) : null;

  const shopLinkHref =
    shopFilter && shopFilter !== DEFAULT_SHOP_SLUG ? `/shop/${shopFilter}` : '/shop';

  if (loading) {
    return (
      <div className={styles.wrap}>
        <p className={styles.message}>Загрузка товаров…</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <header className={styles.pageHead}>
        <div>
          <h1 className={styles.title}>Товары розницы</h1>
          <p className={styles.subtitle}>
            {products.length} всего · {onSaleCount} на витрине
          </p>
        </div>
        <div className={styles.headActions}>
          <a
            className={styles.shopLink}
            href={shopLinkHref}
            target="_blank"
            rel="noopener noreferrer"
            title="Открыть витрину магазина"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M6.5 3.5H3.5C2.67157 3.5 2 4.17157 2 5V12.5C2 13.3284 2.67157 14 3.5 14H11C11.8284 14 12.5 13.3284 12.5 12.5V9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 2H14V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 9L14 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Витрина</span>
          </a>
          <button type="button" className={styles.addBtn} onClick={openCreate}>
            + Добавить товар
          </button>
        </div>
      </header>

      <div className={styles.toolbar}>
        <input
          type="search"
          className={styles.search}
          placeholder="Поиск по названию"
          value={nameFilter}
          onChange={(e) => setNameFilter(e.target.value)}
          aria-label="Поиск по названию"
        />
        <select
          className={styles.shopFilter}
          value={shopFilter}
          onChange={(e) => setShopFilter(e.target.value)}
          aria-label="Фильтр по магазину"
        >
          <option value="">Все магазины</option>
          {shops.map((shop) => (
            <option key={shop.slug} value={shop.slug}>
              {shop.name}
            </option>
          ))}
        </select>
        <div className={styles.statusTabs} role="group" aria-label="Фильтр по статусу">
          {[
            { key: 'all', label: 'Все' },
            { key: 'active', label: 'Активные' },
            { key: 'off', label: 'Выключенные' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={statusFilter === tab.key ? `${styles.tab} ${styles.tabActive}` : styles.tab}
              aria-pressed={statusFilter === tab.key}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {pageError && <p className={`${styles.banner} ${styles.bannerError}`}>{pageError}</p>}
      {pageMessage && <p className={`${styles.banner} ${styles.bannerSuccess}`}>{pageMessage}</p>}

      <p className={styles.listCount}>
        Найдено: {visibleProducts.length}
        {isFiltered && visibleProducts.length !== products.length && ` из ${products.length}`}
      </p>

      {visibleProducts.length === 0 ? (
        <p className={styles.message}>
          {products.length === 0
            ? 'Товаров пока нет — добавьте первый.'
            : 'Ничего не нашлось — измените поиск или фильтры.'}
        </p>
      ) : (
        <ul className={styles.list}>
          {visibleProducts.map((p, i) => {
            const slugs = productShopSlugs(p);
            const photo = p.photos?.[0];
            const variants = p.variants ?? [];
            return (
              <li
                key={p.id ?? `item-${i}`}
                className={styles.item}
                onClick={() => p.id && openEdit(p)}
              >
                {photo ? (
                  <img className={styles.itemPhoto} src={photo} alt="" />
                ) : (
                  <div className={`${styles.itemPhoto} ${styles.itemPhotoEmpty}`} aria-hidden="true">
                    нет фото
                  </div>
                )}
                <div className={styles.itemBody}>
                  <span className={styles.itemName}>{p.name ?? '—'}</span>
                  <span className={styles.itemBadges}>
                    {slugs.map((slug) => (
                      <span
                        key={slug}
                        className={
                          slug === DEFAULT_SHOP_SLUG
                            ? `${styles.badge} ${styles.badgeShopDefault}`
                            : `${styles.badge} ${styles.badgeShop}`
                        }
                      >
                        {slug}
                      </span>
                    ))}
                    {slugs.length === 0 && (
                      <span className={`${styles.badge} ${styles.badgeOff}`}>не на витрине</span>
                    )}
                    {p.active === false && (
                      <span className={`${styles.badge} ${styles.badgeOff}`}>выключен</span>
                    )}
                    {p.preorder && (
                      <span className={`${styles.badge} ${styles.badgePreorder}`}>предзаказ</span>
                    )}
                  </span>
                  {variants.length > 0 && (
                    <span className={styles.itemMeta}>
                      {variants.length} {pluralVariants(variants.length)}:{' '}
                      {variants.map((v) => `${v.label} — ${v.price} ₽`).join(' · ')}
                    </span>
                  )}
                </div>
                <span className={styles.itemPrice}>{p.price ?? '—'} ₽</span>
                {p.id && (
                  <button
                    type="button"
                    className={styles.editBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(p);
                    }}
                  >
                    Изменить
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {editorOpen && (
        <>
          <div
            className={styles.overlay}
            onClick={() => setEditorOpen(false)}
            aria-hidden="true"
          />
          <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Редактор товара">
            <div className={styles.drawerHead}>
              <div>
                <h2 className={styles.drawerTitle}>
                  {form.id ? 'Изменение товара' : 'Новый товар'}
                </h2>
                {form.id && <code className={styles.drawerId}>{form.id}</code>}
              </div>
              <button
                type="button"
                className={styles.drawerClose}
                onClick={() => setEditorOpen(false)}
                title="Закрыть"
                aria-label="Закрыть редактор"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.drawerForm}>
              <div className={styles.drawerBody}>
                <Fieldset title="Основное">
                  <label className={styles.label}>
                    Название *
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className={styles.input}
                      placeholder="Лилит"
                    />
                  </label>
                  <label className={styles.label}>
                    Описание
                    <textarea
                      name="description"
                      ref={descRef}
                      value={form.description}
                      onChange={handleChange}
                      className={`${styles.textarea} ${styles.textareaAuto}`}
                      rows={7}
                    />
                  </label>
                </Fieldset>

                <Fieldset title="Цена">
                  <div className={styles.row3}>
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
                      Зачёркнутая
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
                  </div>
                </Fieldset>

                <Fieldset title="Варианты (размер / объём — цена)">
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
                  <button type="button" className={styles.variantAdd} onClick={addVariant}>
                    + Добавить вариант
                  </button>
                  <p className={styles.hintText}>
                    Без вариантов товар продаётся по основной цене. С вариантами покупатель выбирает
                    один из них, а в заказ позиция уходит как «Название + вариант» (например,
                    «Лилит 20 см») с ценой варианта.
                  </p>
                </Fieldset>

                <Fieldset title="Витрины и доступность">
                  <div className={styles.shopChecks}>
                    {shops.length === 0 && (
                      <label className={styles.checkLabel}>
                        <input
                          type="checkbox"
                          checked={form.shopSlugs.includes(DEFAULT_SHOP_SLUG)}
                          onChange={() => toggleShop(DEFAULT_SHOP_SLUG)}
                        />
                        anyforms
                      </label>
                    )}
                    {shops.map((shop) => (
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
                    <p className={styles.hintText}>
                      Не выбран ни один магазин — товар не попадёт ни на одну витрину.
                    </p>
                  )}
                  <label className={styles.checkLabel}>
                    <input
                      type="checkbox"
                      name="active"
                      checked={form.active}
                      onChange={handleChange}
                    />
                    Активен (доступен к продаже)
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
                </Fieldset>

                <Fieldset title="Фото">
                  {form.id ? (
                    <div className={styles.uploadRow}>
                      {editingProduct?.photos?.length > 0 && (
                        <div className={styles.photosList}>
                          {editingProduct.photos.map((src, j) => (
                            <div key={j} className={styles.photoWrap}>
                              <a
                                href={src}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.photoThumb}
                              >
                                <img src={src} alt="" />
                              </a>
                              <button
                                type="button"
                                className={styles.photoDelete}
                                title="Удалить фото"
                                onClick={() => handleDeletePhoto(editingProduct.id, src)}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
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
                      Фото можно загрузить после сохранения товара — вернитесь в эту секцию,
                      открыв товар из списка.
                    </p>
                  )}
                </Fieldset>

                <Fieldset title="Служебное">
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
                    {amoError && <span className={styles.formError}>{amoError}</span>}
                  </label>
                  <div className={styles.row2}>
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
                      Порядок на витрине
                      <input
                        type="number"
                        name="orderNumber"
                        value={form.orderNumber}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="0"
                      />
                    </label>
                  </div>
                  <label className={styles.label}>
                    Папка в S3 (под shop/) — создастся сама при загрузке фото
                    <input
                      type="text"
                      name="folder"
                      value={form.folder}
                      onChange={handleChange}
                      className={styles.input}
                      placeholder="heart"
                    />
                  </label>
                </Fieldset>
              </div>

              <div className={styles.drawerFoot}>
                {formError && <p className={styles.formError}>{formError}</p>}
                {formMessage && <p className={styles.formSuccess}>{formMessage}</p>}
                <div className={styles.footActions}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => setEditorOpen(false)}
                  >
                    Отмена
                  </button>
                  <button type="submit" className={styles.submit} disabled={saving}>
                    {saving ? 'Сохранение…' : form.id ? 'Сохранить' : 'Добавить товар'}
                  </button>
                </div>
              </div>
            </form>
          </aside>
        </>
      )}
    </div>
  );
};

export default AdminProducts;
