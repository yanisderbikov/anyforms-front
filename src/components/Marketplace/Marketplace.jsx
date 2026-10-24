import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { SELLER, LEGAL_LINKS } from '../../shared/seller';
import { getItems, getShops } from '../../services/itemsService';
import { trackViewItemList, trackSelectItem } from '../../services/analytics';
import { useCart } from '../../context/CartContext';
import { useLikes } from '../../hooks/useLikes';
import { useListScrollMemory } from '../../hooks/useListScrollMemory';
import { DEFAULT_SUPPORT_TG, tgLink } from '../../hooks/useShopSupport';
import ProductCard from '../ProductCard/ProductCard';
import ProductCardSkeleton from '../ProductCard/ProductCardSkeleton';
import SiteHeader from '../shared/SiteHeader/SiteHeader';
import { useShopTheme } from './shopThemes';
import { isShopPreview, sendPreviewFocus, useShopPreviewDraft } from './shopPreview';
import PreviewText from './PreviewText';
import styles from './Marketplace.module.css';
const TG_CHANNEL = 'https://t.me/anyforms';
const PHONE_E164 = '+79810403953';
const CONTACT_EMAIL = 'suvorov@anyforms.ru';
// Карточек в скелетоне: ровные ряды при 2 и 4 колонках, на экран хватает.
const SKELETON_CARDS = 8;

// Перекраска общей шапки под палитру магазина: переменные темы (shopThemes)
// задаются на корне страницы, шапка читает их через tint.
const SHOP_HEADER_TINT = {
  background: 'var(--shop-header-tint, rgba(14, 14, 14, 0.7))',
  color: 'var(--shop-header-fg, #fff)',
  border: 'rgba(255, 255, 255, 0.22)',
  logoFont: 'var(--shop-title-font, inherit)',
};

const ANYFORMS_LOGO = {
  href: '#top',
  ariaLabel: 'anyforms — наверх',
  src: '/anyforms_logo_new_white.svg',
  width: 180,
  height: 41,
};

const Marketplace = () => {
  const location = useLocation();
  const navigate = useNavigate();
  // /shop — витрина anyforms, /shop/:shopSlug — витрина магазина. Товар виден там, где он отмечен.
  const { shopSlug } = useParams();
  const [loadedShop, setShop] = useState(null);
  const [loadedShopMissing, setShopMissing] = useState(false);
  const previewDraft = useShopPreviewDraft();
  const shop = isShopPreview ? previewDraft ?? loadedShop : loadedShop;
  const shopMissing = isShopPreview ? false : loadedShopMissing;
  // Базовый путь витрины: с него строятся ссылки на товары, чтобы покупка
  // засчиталась магазину, с витрины которого пришёл покупатель.
  const shopBase = shopSlug ? `/shop/${shopSlug}` : '/shop';
  // Тема партнёрской витрины (цвета/типографика); без темы — стиль anyforms.
  // Витрина с темой получает «бутиковую» подачу каталога: крупные фото без
  // рамок-карточек, только название и цена (описание живёт на странице товара).
  const theme = useShopTheme(shopSlug);
  const branding = shopSlug ? shop : null;
  const boutique = Boolean(theme);
  const wrapClass = [
    styles.wrap,
    theme && styles.wrapBoutique,
    theme?.className,
    isShopPreview && styles.previewMode,
  ].filter(Boolean).join(' ');
  const wrapStyle = theme?.style;
  const gridClass = boutique ? `${styles.grid} ${styles.gridBoutique}` : styles.grid;
  const shopName = shop?.name ?? shopSlug;
  // Логотип магазина в шапке: логотип из настроек магазина, на узких экранах —
  // знак, если он есть; без картинок — название текстом.
  const shopLogo = branding?.logoUrl || branding?.logoMarkUrl || null;
  const headerLogo = theme || shopLogo
    ? {
        href: '#top',
        ariaLabel: `${shopName} — наверх`,
        alt: shopName,
        text: shop ? shopName : '',
        src: shopLogo ?? undefined,
        compactSrc: branding?.logoUrl && branding?.logoMarkUrl ? branding.logoMarkUrl : undefined,
      }
    : ANYFORMS_LOGO;
  const tagline = branding?.tagline || shopName;
  const description = branding?.description || null;
  // Связь с менеджером/поддержкой — бот магазина; общая витрина — AnyFormsBot.
  const supportTgLink = tgLink(shop?.supportTelegram || DEFAULT_SUPPORT_TG);
  const { count } = useCart();
  const { isLiked, count: likesCount } = useLikes();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Возврат из карточки товара — на то же место каталога, а не в начало.
  useListScrollMemory(`shop-scroll:${shopBase}`, !loading);
  const [showLiked, setShowLiked] = useState(false);
  const [heroVideoFailed, setHeroVideoFailed] = useState(false);

  const prefersReducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  );

  // Ролик-приветствие витрины: показываем, только если браузер умеет его
  // играть. Если формат не поддерживается (старый iPhone без webm) или файл
  // не загрузился — показываем фото или обычный текстовый заголовок.
  const heroVideoUrl = branding?.heroVideoUrl || null;
  const heroVideoSrc = useMemo(() => {
    if (!heroVideoUrl) return null;
    const type = /\.webm(\?|$)/i.test(heroVideoUrl) ? 'video/webm' : 'video/mp4';
    return document.createElement('video').canPlayType(type) ? heroVideoUrl : null;
  }, [heroVideoUrl]);
  const showHeroVideo = Boolean(heroVideoSrc) && !heroVideoFailed;

  // Фото-приветствие — как видео, но статичное: если в теме есть и видео,
  // и фото, видео важнее, а фото остаётся запасным вариантом при ошибке.
  const [heroImageFailed, setHeroImageFailed] = useState(false);
  const heroImage = !heroImageFailed && branding?.heroImageUrl
    ? { src: branding.heroImageUrl, alt: branding.heroImageAlt }
    : null;
  const showHero = showHeroVideo || Boolean(heroImage);

  const focusInEditor = (field) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    sendPreviewFocus(field);
  };

  const titleNode = isShopPreview ? (
    <PreviewText
      as="h1"
      field="tagline"
      value={tagline}
      placeholder="Заголовок витрины"
      className={styles.shopTitle}
    />
  ) : (
    <h1 className={styles.shopTitle}>{tagline}</h1>
  );

  const descriptionNode = isShopPreview ? (
    <PreviewText
      as="p"
      field="description"
      value={description || ''}
      placeholder="Нажмите, чтобы добавить описание магазина"
      className={styles.heroDescription}
      multiline
    />
  ) : (
    description && <p className={styles.heroDescription}>{description}</p>
  );

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

  useEffect(() => {
    setLoading(true);
    getItems(shopSlug)
      .then((list) => (isShopPreview && !list.length ? getItems() : list))
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

  if (error) {
    return (
      <div className={wrapClass} style={wrapStyle}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  if (shopMissing) {
    return (
      <div className={wrapClass} style={wrapStyle}>
        <p className={styles.message}>Такого магазина нет.</p>
        <p className={styles.message}>
          <Link to="/shop" className={styles.promoLink}>Перейти в общий магазин</Link>
        </p>
      </div>
    );
  }

  if (!loading && !items.length) {
    return (
      <div className={wrapClass} style={wrapStyle}>
        <p className={styles.message}>Товаров пока нет.</p>
      </div>
    );
  }

  return (
    <div className={wrapClass} style={wrapStyle}>
      <div onClickCapture={isShopPreview ? focusInEditor('logoUrl') : undefined}>
      <SiteHeader
        logo={headerLogo}
        logoSize={theme ? 'large' : 'default'}
        tint={theme ? SHOP_HEADER_TINT : undefined}
        right={(
          <>
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
          </>
        )}
      />
      </div>
      {showHero ? (
        <section className={styles.hero}>
          <div className={styles.heroTitleBlock}>
            {titleNode}
            <span className={styles.shopDivider} aria-hidden="true" />
            {descriptionNode}
          </div>
          <div
            className={styles.heroMedia}
            onClickCapture={isShopPreview ? focusInEditor(showHeroVideo ? 'heroVideoUrl' : 'heroImageUrl') : undefined}
          >
            {showHeroVideo ? (
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
            ) : (
              <img
                className={styles.heroImage}
                src={heroImage.src}
                alt={heroImage.alt ?? ''}
                onError={() => setHeroImageFailed(true)}
              />
            )}
          </div>
          <a className={styles.heroCta} href="#catalog" onClick={scrollToCatalog}>
            Смотреть каталог
          </a>
        </section>
      ) : (
        <div className={styles.intro}>
          {theme || branding?.tagline || isShopPreview ? (
            <>
              {titleNode}
              <span className={styles.shopDivider} aria-hidden="true" />
              {descriptionNode}
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
      {showHero && (
        <div className={styles.catalogHead} id="catalog">
          <h2 className={styles.catalogTitle}>Каталог</h2>
          <span className={styles.shopDivider} aria-hidden="true" />
        </div>
      )}
      {loading ? (
        // Шапка и первый экран не зависят от товаров и видны сразу, а вместо
        // сетки — скелетон в той же раскладке.
        <div role="status" aria-label="Загрузка товаров">
          <ul className={gridClass} aria-hidden="true">
            {Array.from({ length: SKELETON_CARDS }, (_, index) => (
              <li key={index} className={styles.gridItem}>
                <ProductCardSkeleton index={index} boutique={boutique} />
              </li>
            ))}
          </ul>
        </div>
      ) : showLiked && visibleItems.length === 0 ? (
        <p id={showHeroVideo ? undefined : 'catalog'} className={styles.message}>
          Пока ничего не выбрано — нажмите на сердечко у товара, чтобы сохранить его здесь.
        </p>
      ) : (
        <ul id={showHeroVideo ? undefined : 'catalog'} className={gridClass}>
          {visibleItems.map((item, index) => (
            <li key={item.name} className={styles.gridItem}>
              <ProductCard item={item} index={index} onSelect={openProduct} boutique={boutique} />
            </li>
          ))}
        </ul>
      )}
      {!loading && (
        <footer className={styles.siteFooter}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBlock}>
              <h2 className={styles.footerHeading}>О компании</h2>
              <p className={styles.footerText}>
                {SELLER.shortName}
                <br />
                ИНН {SELLER.inn}
                <br />
                ОГРНИП {SELLER.ogrnip}
                <br />
                Юридический адрес: {SELLER.address}
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
                  href={supportTgLink}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Связаться с менеджером
                </a>
              </p>
            </div>
          </div>
          <p className={styles.footerLegal}>
            <Link to={LEGAL_LINKS.shopOffer} className={styles.footerLegalLink}>
              Публичная оферта магазина
            </Link>
            {' · '}
            <Link to={LEGAL_LINKS.privacy} className={styles.footerLegalLink}>
              Политика конфиденциальности
            </Link>
            {' · '}
            <Link to={LEGAL_LINKS.requisites} className={styles.footerLegalLink}>
              Реквизиты
            </Link>
          </p>
          <p className={styles.footerCopyright}>© anyforms, 2026. Все права защищены</p>
        </footer>
      )}
    </div>
  );
};

export default Marketplace;
