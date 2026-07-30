import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { getItems, getShops } from '../../services/itemsService';
import { trackViewItemList, trackSelectItem } from '../../services/analytics';
import { useCart } from '../../context/CartContext';
import { useLikes } from '../../hooks/useLikes';
import ProductCard from '../ProductCard/ProductCard';
import { SHOP_THEMES } from './shopThemes';
import styles from './Marketplace.module.css';

const TG_ORDER_LINK = 'https://t.me/AnyFormsBot';
const TG_CHANNEL = 'https://t.me/anyforms';
const PHONE_E164 = '+79810403953';
const CONTACT_EMAIL = 'suvorov@anyforms.ru';
const PROMO_CODE = 'any-shop-10';

const Marketplace = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // /shop — витрина anyforms, /shop/:shopSlug — витрина магазина. Товар виден там, где он отмечен.
  const { shopSlug } = useParams();
  const [shop, setShop] = useState(null);
  const [shopMissing, setShopMissing] = useState(false);
  // Базовый путь витрины: с него строятся ссылки на товары, чтобы покупка
  // засчиталась магазину, с витрины которого пришёл покупатель.
  const shopBase = shopSlug ? `/shop/${shopSlug}` : '/shop';
  // Тема партнёрской витрины (цвета/типографика); без темы — стиль anyforms.
  // Витрина с темой получает «бутиковую» подачу каталога: крупные фото без
  // рамок-карточек, только название и цена (описание живёт на странице товара).
  const theme = shopSlug ? SHOP_THEMES[shopSlug] : null;
  const boutique = Boolean(theme);
  const wrapClass = theme
    ? `${styles.wrap} ${styles.wrapBoutique} ${theme.className}`
    : styles.wrap;
  const shopName = shop?.name ?? shopSlug;
  const { count } = useCart();
  const { isLiked, count: likesCount } = useLikes();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showLiked, setShowLiked] = useState(false);
  const [heroVideoFailed, setHeroVideoFailed] = useState(false);

  const prefersReducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // Ролик-приветствие витрины: берём первый формат из темы, который умеет
  // играть браузер. Если подходящего нет (старый iPhone без webm) или файл
  // не загрузился — показываем обычный текстовый заголовок вместо видео.
  const heroVideoSrc = useMemo(() => {
    if (!theme?.heroVideo) return null;
    const probe = document.createElement('video');
    const sources = [
      { src: theme.heroVideo.webm, type: 'video/webm' },
      { src: theme.heroVideo.mp4, type: 'video/mp4' },
    ];
    return sources.find((s) => s.src && probe.canPlayType(s.type))?.src ?? null;
  }, [theme]);
  const showHeroVideo = Boolean(heroVideoSrc) && !heroVideoFailed;

  // Плавный скролл к каталогу; ссылка с #catalog остаётся рабочей и без JS.
  const scrollToCatalog = (e) => {
    const catalog = document.getElementById('catalog');
    if (!catalog) return;
    e.preventDefault();
    catalog.scrollIntoView({
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  const visibleItems = useMemo(
    () => (showLiked ? items.filter((item) => isLiked(item.id)) : items),
    [items, showLiked, isLiked]
  );

  // view_item_list — один раз на фактически показанный набор товаров.
  // Ключ по содержимому защищает от повторов при ре-рендерах и StrictMode.
  const lastListKeyRef = useRef(null);
  useEffect(() => {
    if (loading || !visibleItems.length) return;
    const key = `${showLiked ? 'liked' : 'all'}:${visibleItems.map((i) => i.id).join(',')}`;
    if (key === lastListKeyRef.current) return;
    lastListKeyRef.current = key;
    trackViewItemList(visibleItems, 'catalog');
  }, [visibleItems, showLiked, loading]);

  const openProduct = (item, index) => {
    trackSelectItem(item, index ?? undefined, 'catalog');
    navigate(`${shopBase}/product/${item.id}`);
  };

  const handlePromoCopy = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      setCopied(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    getItems(shopSlug)
      .then(setItems)
      .catch((err) => setError(err?.message || 'Не удалось загрузить товары'))
      .finally(() => setLoading(false));
  }, [shopSlug]);

  // Витрина магазина: проверяем, что такой магазин есть и включён.
  useEffect(() => {
    if (!shopSlug) {
      setShop(null);
      setShopMissing(false);
      return;
    }
    getShops()
      .then((shops) => {
        const found = shops.find((s) => s.slug === shopSlug) ?? null;
        setShop(found);
        setShopMissing(!found);
      })
      .catch(() => {
        setShop(null);
        setShopMissing(false);
      });
  }, [shopSlug]);

  // Совместимость со старыми ссылками вида /shop?id=<uuid>: уводим на страницу товара.
  useEffect(() => {
    if (!items.length) return;

    const idParam = new URLSearchParams(location.search).get('id');
    if (!idParam) return;

    const normalizedId = idParam.replace(/^['"]|['"]$/g, '').trim();
    if (!normalizedId) return;

    const matchingItem = items.find((item) => String(item.id) === normalizedId);
    if (!matchingItem) return;

    navigate(`${shopBase}/product/${matchingItem.id}`, { replace: true });
  }, [items, location.search, navigate, shopBase]);

  if (loading) {
    return (
      <div className={wrapClass}>
        <div className={styles.loader} role="status" aria-label="Загрузка товаров">
          <span className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={wrapClass}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  if (shopMissing) {
    return (
      <div className={wrapClass}>
        <p className={styles.message}>Такого магазина нет.</p>
        <p className={styles.message}>
          <Link to="/shop" className={styles.promoLink}>Перейти в общий магазин</Link>
        </p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className={wrapClass}>
        <p className={styles.message}>Товаров пока нет.</p>
      </div>
    );
  }

  return (
    <div className={wrapClass}>
      <div className={styles.headerSafeArea} aria-hidden="true" />
      {copied && (
        <div className={styles.globalCopyToast} role="status">
          Скопировано
        </div>
      )}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          {theme ? (
            <a className={styles.brandLink} href="#top" aria-label={`${shopName} — наверх`}>
              {theme.headerLogo ? (
                <img
                  className={styles.brandLogo}
                  src={theme.headerLogo.src}
                  alt={shopName}
                  width={theme.headerLogo.width}
                  height={theme.headerLogo.height}
                  decoding="async"
                />
              ) : (
                <span className={styles.brandName}>{shopName}</span>
              )}
            </a>
          ) : (
            <a className={styles.logoLink} href="#top" aria-label="anyforms — наверх">
              <img
                className={styles.logo}
                src="/anyforms_logo_new_white.svg"
                alt=""
                width={180}
                height={41}
                decoding="async"
              />
            </a>
          )}
          <button
            type="button"
            className={`${styles.likesToggle} ${showLiked ? styles.likesToggleActive : ''}`}
            onClick={() => setShowLiked((prev) => !prev)}
            aria-label={showLiked ? 'Показать все товары' : 'Показать избранное'}
            aria-pressed={showLiked}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={showLiked ? '#f0808f' : 'none'}
              stroke={showLiked ? '#f0808f' : '#fff'}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
            {likesCount > 0 && <span className={styles.cartBadge}>{likesCount}</span>}
          </button>
          <Link
            className={styles.cartLink}
            to="/shop/cart"
            aria-label={`Корзина${count ? `, товаров: ${count}` : ''}`}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {count > 0 && <span className={styles.cartBadge}>{count}</span>}
          </Link>
        </div>
      </header>
      {showHeroVideo ? (
        <section className={styles.hero}>
          <div className={styles.heroTitleBlock}>
            <h1 className={styles.shopTitle}>{theme.tagline ?? shopName}</h1>
            <span className={styles.shopDivider} aria-hidden="true" />
            {theme.description && (
              <p className={styles.heroDescription}>{theme.description}</p>
            )}
          </div>
          <div className={styles.heroMedia}>
            <video
              className={styles.heroVideo}
              src={heroVideoSrc}
              autoPlay={!prefersReducedMotion}
              muted
              loop
              playsInline
              preload="auto"
              disablePictureInPicture
              onError={() => setHeroVideoFailed(true)}
            />
          </div>
          <a className={styles.heroCta} href="#catalog" onClick={scrollToCatalog}>
            Смотреть каталог
          </a>
        </section>
      ) : (
        <div className={styles.intro}>
          {theme ? (
            <>
              <h1 className={styles.shopTitle}>{theme.tagline ?? shopName}</h1>
              <span className={styles.shopDivider} aria-hidden="true" />
            </>
          ) : (
            <>
              {shopSlug && <p className={styles.shopBadge}>Магазин {shopName}</p>}
              <h1 className={styles.subtitle}>
                Профессиональные молды для чистого изделия{' '}
                <strong className={styles.highlight}>без доработки</strong>. Если дефект
                появился из-за формы —{' '}
                <strong className={styles.highlight}>заменим молд или вернём деньги</strong>.
              </h1>
            </>
          )}
        </div>
      )}
      {showHeroVideo && (
        <div className={styles.catalogHead} id="catalog">
          <h2 className={styles.catalogTitle}>Каталог</h2>
          <span className={styles.shopDivider} aria-hidden="true" />
        </div>
      )}
      {showLiked && visibleItems.length === 0 ? (
        <p id={showHeroVideo ? undefined : 'catalog'} className={styles.message}>
          Пока ничего не выбрано — нажмите на сердечко у товара, чтобы сохранить его здесь.
        </p>
      ) : (
        <ul
          id={showHeroVideo ? undefined : 'catalog'}
          className={boutique ? `${styles.grid} ${styles.gridBoutique}` : styles.grid}
        >
          {visibleItems.map((item, index) => (
            <li key={item.name} className={styles.gridItem}>
              <ProductCard item={item} index={index} onSelect={openProduct} boutique={boutique} />
            </li>
          ))}
        </ul>
      )}
      {!shopSlug && (
      <p className={styles.promoNote}>
        По промокоду{' '}
        <button type="button" className={styles.promoCodeButton} onClick={handlePromoCopy}>
          {PROMO_CODE}
        </button>{' '}
        скидка 10% на первый заказ. Отправьте это сообщение{' '}
        <a href={TG_ORDER_LINK} target="_blank" rel="noopener noreferrer" className={styles.promoLink}>
          менеджеру в телеграм
        </a>
        .
      </p>
      )}

      <footer className={styles.siteFooter}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBlock}>
            <h2 className={styles.footerHeading}>О компании</h2>
            <p className={styles.footerText}>
              ИП Суворов Дмитрий Игоревич
              <br />
              ИНН 590699241510
              <br />
              Юридический адрес: г. Санкт-Петербург, ул. Заречная, д. 36, корп. 1, кв. 404
            </p>
          </div>
          <div className={styles.footerBlock}>
            <h2 className={styles.footerHeading}>Контакты</h2>
            <p className={styles.footerText}>
              <a className={styles.footerLink} href={`tel:${PHONE_E164.replace(/\D/g, '')}`}>
                +7&nbsp;981&nbsp;040-39-53
              </a>
              <br />
              <a className={styles.footerLink} href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              <br />
              <a
                className={styles.footerLink}
                href={TG_CHANNEL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram — канал
              </a>
              <br />
              <a
                className={styles.footerLink}
                href={TG_ORDER_LINK}
                target="_blank"
                rel="noopener noreferrer"
              >
                Связаться с менеджером
              </a>
            </p>
          </div>
        </div>
        <p className={styles.footerLegal}>
          <Link to="/chief/privacy" className={styles.footerLegalLink}>
            Политика конфиденциальности
          </Link>
        </p>
        <p className={styles.footerCopyright}>© anyforms, 2026. Все права защищены</p>
      </footer>
    </div>
  );
};

export default Marketplace;
