import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../apiClient';
import { getShops } from '../../services/itemsService';
import styles from './AdminProducts.module.css';

// Магазин по умолчанию: витрина anyforms.
const DEFAULT_SHOP_SLUG = 'anyforms';

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

const AdminProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [shops, setShops] = useState([]);
  // Фильтры списка: магазин ('' — все), статус, поиск по названию.
  const [shopFilter, setShopFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [nameFilter, setNameFilter] = useState('');

  const authHeaders = () => {
    const token = apiClient.getToken ? apiClient.getToken() : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadProducts = async () => {
    try {
      // /api/product/all — админский список: включает и выключенные товары.
      const res = await apiClient.instance.get('/api/product/all', { headers: authHeaders() });
      setProducts(Array.isArray(res.data) ? res.data : []);
      setPageError('');
    } catch (err) {
      setPageError(err?.response?.data?.error || err?.message || 'Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    getShops()
      .then(setShops)
      .catch((err) => setPageError(err?.message || 'Не удалось загрузить магазины'));
  }, []);

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
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => navigate('/admin/products/new')}
          >
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
            const openProduct = () => p.id && navigate(`/admin/products/${p.id}`);
            return (
              <li key={p.id ?? `item-${i}`} className={styles.item} onClick={openProduct}>
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
                      openProduct();
                    }}
                  >
                    Открыть
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default AdminProducts;
