import React, { Suspense, useEffect, useRef } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useCart, DEFAULT_SHOP_SLUG } from './context/CartContext';
import styles from './App.module.css';
import Marketplace from "./components/Marketplace/Marketplace";
import MarketplaceProduct from "./components/Marketplace/MarketplaceProduct";
import MainLanding from "./components/MainLanding/MainLanding";
import Print3dLanding from "./components/Print3dLanding/Print3dLanding";
import NotFound from "./components/NotFound/NotFound";
import { SHOP_THEMES } from "./components/Marketplace/shopThemes";
import { SITE_URL, PAGE_SEO, DEFAULT_OG_IMAGE } from './shared/pageSeo.mjs';
import { setAnalyticsShop, trackPageView } from './services/analytics';
import PromoPopupHost from './components/PromoPopup/PromoPopupHost';

// Код-сплиттинг по роутам. В основном бандле остаются только:
// - витрина и карточка товара (/shop, /shop/<slug>, …/product/:id) — ~65% просмотров;
// - главная и /3d-print — они пререндерятся (scripts/prerender.mjs), а клиент
//   монтируется через createRoot().render(), который очищает #root: ленивый
//   компонент показал бы пустой fallback поверх уже готовой разметки;
// - NotFound — крошечный и нужен для любого опечатанного адреса.
// Остальное (админка, курс, гайд, чекаут, юр-тексты) грузится при заходе на
// страницу. Переходы внутри SPA обёрнуты в startTransition (index.jsx), поэтому
// на время загрузки чанка остаётся текущая страница, а не пустой fallback.
const lazyNamed = (loader, name) =>
  React.lazy(() => loader().then((module) => ({ default: module[name] })));

const StlViewer = React.lazy(() => import('./components/StlViewer/StlViewer'));
const PDFViewer = React.lazy(() => import('./components/PDFViewer/PDFViewer'));
const Login = React.lazy(() => import('./components/Login/Login'));
const ChiefLanding = React.lazy(() => import('./components/ChiefLanding/ChiefLanding'));
const GuideLanding = React.lazy(() => import('./components/GuideLanding/GuideLanding'));
const GuideCheckout = React.lazy(() => import('./components/GuideLanding/GuideCheckout'));
const GuideSuccess = React.lazy(() => import('./components/GuideLanding/GuideSuccess'));
const loadGuideLegal = () => import('./components/GuideLanding/GuideLegal');
const GuideOffer = lazyNamed(loadGuideLegal, 'GuideOffer');
const GuidePrivacy = lazyNamed(loadGuideLegal, 'GuidePrivacy');
const CourseLanding = React.lazy(() => import('./components/CourseLanding/CourseLanding'));
const CourseCheckout = React.lazy(() => import('./components/CourseLanding/CourseCheckout'));
const CourseSuccess = React.lazy(() => import('./components/CourseLanding/CourseSuccess'));
const loadCourseLegal = () => import('./components/CourseLanding/CourseLegal');
const CourseOffer = lazyNamed(loadCourseLegal, 'CourseOffer');
const CoursePrivacy = lazyNamed(loadCourseLegal, 'CoursePrivacy');
const SellerRequisites = React.lazy(() => import('./components/Founders/SellerRequisites'));
const loadSiteLegal = () => import('./components/shared/legal/SiteLegalPages');
const SitePrivacyPage = lazyNamed(loadSiteLegal, 'SitePrivacyPage');
const ShopOfferPage = lazyNamed(loadSiteLegal, 'ShopOfferPage');
const SitePdConsentPage = lazyNamed(loadSiteLegal, 'SitePdConsentPage');
const SiteAdConsentPage = lazyNamed(loadSiteLegal, 'SiteAdConsentPage');
// Корзина и чекаут — продолжение витрины: их чанки догружаем заранее в простое,
// как только покупатель оказался на витрине (см. эффект ниже).
const loadMarketplaceCart = () => import('./components/Marketplace/MarketplaceCart');
const loadMarketplaceCheckout = () => import('./components/Marketplace/MarketplaceCheckout');
const MarketplaceCart = React.lazy(loadMarketplaceCart);
const MarketplaceCheckout = React.lazy(loadMarketplaceCheckout);
const MarketplaceSuccess = React.lazy(() => import('./components/Marketplace/MarketplaceSuccess'));
const CustomItemPage = React.lazy(() => import('./components/CustomOrders/CustomItemPage'));
const AdminLayout = React.lazy(() => import('./components/AdminLayout/AdminLayout'));
const AdminHome = React.lazy(() => import('./components/AdminHome/AdminHome'));
const OrderList = React.lazy(() => import('./components/OrderList/OrderList'));
const CustomOrders = React.lazy(() => import('./components/CustomOrders/CustomOrders'));
const CustomOrdersList = React.lazy(() => import('./components/CustomOrders/CustomOrdersList'));
const CustomShipList = React.lazy(() => import('./components/CustomOrders/CustomShipList'));
const CustomOrderFill = React.lazy(() => import('./components/CustomOrders/CustomOrderFill'));
const AdminProducts = React.lazy(() => import('./components/AdminProducts/AdminProducts'));
const AdminProductEdit = React.lazy(() => import('./components/AdminProducts/AdminProductEdit'));
const ShopSalesReport = React.lazy(() => import('./components/AdminProducts/ShopSalesReport'));
const AdminPromoCodes = React.lazy(() => import('./components/AdminPromoCodes/AdminPromoCodes'));
const AdminPromoPopups = React.lazy(() => import('./components/AdminPromoPopups/AdminPromoPopups'));
const AdminFreeDelivery = React.lazy(() => import('./components/AdminFreeDelivery/AdminFreeDelivery'));
const AdminInvoices = React.lazy(() => import('./components/AdminInvoices/AdminInvoices'));
const AdminTrainingInvoices = React.lazy(() => import('./components/AdminInvoices/AdminTrainingInvoices'));
const AdminYookassaReceipts = React.lazy(() => import('./components/AdminInvoices/AdminYookassaReceipts'));
const AdminSalesbot = React.lazy(() => import('./components/AdminSalesbot/AdminSalesbot'));
const AdminSalesbotManualRun = React.lazy(() => import('./components/AdminSalesbot/AdminSalesbotManualRun'));
const AdminSalesbotAnalytics = React.lazy(() => import('./components/AdminSalesbot/AdminSalesbotAnalytics'));
const AdminUsers = React.lazy(() => import('./components/AdminUsers/AdminUsers'));

const KNOWN_PATHS = new Set([
  '/',
  '/login',
  '/chief',
  '/chief/privacy',
  '/privacy',
  '/consent',
  '/ad-consent',
  '/requisites',
  '/shop/offer',
  '/3d-print',
  '/guide',
  '/course',
  '/course/offer',
  '/course/privacy',
  '/course/checkout',
  '/course/success',
  '/guide/offer',
  '/guide/privacy',
  '/guide/checkout',
  '/guide/success',
  '/founders/dmitry',
  '/founders/yuri',
  '/pdf',
  '/stl',
  '/shop',
  '/orders',
  '/orders/without-tracker',
  '/orders/created',
  '/orders/delivering',
  '/orders/custom',
  '/orders/custom/create',
  '/orders/custom/ship',
  '/admin',
  '/admin/login',
  '/admin/orders',
  '/admin/orders/without-tracker',
  '/admin/orders/created',
  '/admin/orders/delivering',
  '/admin/orders/custom',
  '/admin/orders/custom/create',
  '/admin/orders/custom/ship',
  '/admin/products',
  '/admin/products/analytics',
  '/admin/promo-codes',
  '/admin/promo-popups',
  '/admin/free-delivery',
  '/admin/invoices',
  '/admin/invoices/training',
  '/admin/invoices/receipts',
  '/admin/salesbot',
  '/admin/salesbot/manual',
  '/admin/salesbot/analytics',
  '/admin/users',
]);

const SHOP_RESERVED_SEGMENTS = new Set(['product', 'cart', 'checkout', 'success', 'offer']);

const upsertMetaTag = (selector, attributes) => {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    document.head.appendChild(tag);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    tag.setAttribute(key, value);
  });
};

const upsertCanonical = (href) => {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', href);
};

function App() {
  const location = useLocation();
  // Магазин, с витрины которого набрана корзина: страницы чекаут-флоу
  // (/shop/cart|checkout|success) красят фон body в цвет его темы.
  const { shopSlug: cartShopSlug } = useCart();
  // Ссылки из соцсетей иногда приходят с закодированным якорем в пути
  // (/shop/di_gips%23top): возвращаем '#' на место — путь /shop/di_gips, якорь #top.
  const encodedHashIndex = location.pathname.indexOf('%23');
  const pathnameWithoutEncodedHash =
    encodedHashIndex === -1 ? location.pathname : location.pathname.slice(0, encodedHashIndex);
  const recoveredHash =
    encodedHashIndex === -1 ? location.hash : `#${location.pathname.slice(encodedHashIndex + 3)}`;
  const normalizedPathname =
    pathnameWithoutEncodedHash.length > 1
      ? pathnameWithoutEncodedHash.replace(/\/+$/, '')
      : pathnameWithoutEncodedHash;
  const isHomePage = normalizedPathname === '/';
  // Общие юр-страницы сайта: нейтральная белая раскладка (LegalPage)
  const isLegalPage = ['/privacy', '/consent', '/ad-consent', '/shop/offer'].includes(normalizedPathname);
  const isChiefPage = normalizedPathname === '/chief';
  const is3dPrintPage = normalizedPathname === '/3d-print';
  const isGuidePage = normalizedPathname === '/guide' || normalizedPathname.startsWith('/guide/');
  const isCoursePage = normalizedPathname === '/course' || normalizedPathname.startsWith('/course/');
  const isFounderPage = normalizedPathname.startsWith('/founders/') || normalizedPathname === '/requisites';
  const isShopProductPage = /^\/shop(\/[^/]+)?\/product\/[^/]+$/.test(normalizedPathname);
  // Витрина магазина: /shop/<slug>, кроме служебных путей магазина (/shop/cart и т.п.).
  const shopSlugMatch = normalizedPathname.match(/^\/shop\/([^/]+)$/);
  const isShopPage = Boolean(shopSlugMatch) && !SHOP_RESERVED_SEGMENTS.has(shopSlugMatch[1]);
  // Slug витрины и на странице списка, и на карточке товара — для фона body в цвет темы.
  const shopPathSlug = isShopPage
    ? shopSlugMatch[1]
    : normalizedPathname.match(/^\/shop\/([^/]+)\/product\//)?.[1] ?? null;
  const shopThemeBg = shopPathSlug ? SHOP_THEMES[shopPathSlug]?.pageBackground ?? null : null;
  const isCartFlowPage = ['/shop/cart', '/shop/checkout', '/shop/success'].includes(normalizedPathname);
  const cartThemeBg = isCartFlowPage ? SHOP_THEMES[cartShopSlug]?.pageBackground ?? null : null;
  const isNotFoundPage = !KNOWN_PATHS.has(normalizedPathname) && !isShopProductPage && !isShopPage;

  useEffect(() => {
    if (isHomePage) {
      document.body.style.background = '#fff';
    } else if (isGuidePage) {
      document.body.style.background = '#f1f0ec';
    } else if (normalizedPathname === '/course') {
      document.body.style.background = '#151515';
    } else if (normalizedPathname === '/course/checkout' || normalizedPathname === '/course/success') {
      document.body.style.background = '#fff';
    } else if (isCoursePage) {
      document.body.style.background = '#f1f0ec';
    } else if (isFounderPage) {
      document.body.style.background = '#f5f1e8';
    } else if (normalizedPathname === '/stl' || isLegalPage) {
      document.body.style.background = '#fff';
    } else if (isChiefPage || is3dPrintPage || (isNotFoundPage && !normalizedPathname.startsWith('/orders') && !normalizedPathname.startsWith('/admin'))) {
      document.body.style.background = '#000';
    } else if (shopThemeBg || cartThemeBg) {
      document.body.style.background = shopThemeBg || cartThemeBg;
    } else {
      document.body.style.background = '#e5e5e5';
    }
  }, [normalizedPathname, isHomePage, isChiefPage, isLegalPage, is3dPrintPage, isGuidePage, isCoursePage, isFounderPage, isNotFoundPage, shopThemeBg, cartThemeBg]);

  useEffect(() => {
    // Партнёрская витрина живёт под своим брендом — anyforms в заголовок не добавляем.
    const shopPageSeo = isShopPage
      ? {
          title: `Магазин ${shopSlugMatch[1]}`,
          description: `Товары магазина ${shopSlugMatch[1]}.`,
        }
      : null;
    const seo = PAGE_SEO[normalizedPathname] || shopPageSeo || (isNotFoundPage
      ? {
          title: 'Страница не найдена — anyforms',
          description: 'Запрашиваемая страница не найдена. Вернитесь на главную anyforms.',
        }
      : {
          title: 'anyforms',
          description: 'anyforms - сервис управления заказами.',
        });
    const pageUrl = `${SITE_URL}${normalizedPathname}`;
    const isPrivatePage =
      isNotFoundPage ||
      normalizedPathname === '/login' ||
      normalizedPathname.startsWith('/orders') ||
      normalizedPathname.startsWith('/admin') ||
      normalizedPathname === '/pdf' ||
      normalizedPathname === '/stl' ||
      normalizedPathname === '/guide/checkout' ||
      normalizedPathname === '/guide/success' ||
      normalizedPathname === '/course/checkout' ||
      normalizedPathname === '/course/success';

    const ogImage = seo.image || DEFAULT_OG_IMAGE;

    document.title = seo.title;
    upsertMetaTag('meta[name="description"]', { name: 'description', content: seo.description });
    upsertMetaTag('meta[name="robots"]', {
      name: 'robots',
      content: isPrivatePage ? 'noindex,nofollow' : 'index,follow,max-image-preview:large',
    });
    upsertMetaTag('meta[property="og:title"]', { property: 'og:title', content: seo.title });
    upsertMetaTag('meta[property="og:description"]', { property: 'og:description', content: seo.description });
    upsertMetaTag('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    upsertMetaTag('meta[property="og:url"]', { property: 'og:url', content: pageUrl });
    upsertMetaTag('meta[property="og:image"]', { property: 'og:image', content: ogImage });
    upsertMetaTag('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMetaTag('meta[name="twitter:title"]', { name: 'twitter:title', content: seo.title });
    upsertMetaTag('meta[name="twitter:description"]', { name: 'twitter:description', content: seo.description });
    upsertMetaTag('meta[name="twitter:image"]', { name: 'twitter:image', content: ogImage });
    upsertCanonical(pageUrl);
  }, [normalizedPathname, isNotFoundPage, isShopPage, shopSlugMatch]);

  // Аналитика: витрина, на которой находится покупатель. На витрине и карточке
  // товара — из пути, на страницах корзины/чекаута/успеха — та, с которой
  // набрана корзина. Уходит параметром в каждое событие и в визит Метрики.
  const isDefaultShopPage =
    normalizedPathname === '/shop' || normalizedPathname.startsWith('/shop/product/');
  useEffect(() => {
    if (shopPathSlug) {
      setAnalyticsShop(shopPathSlug);
    } else if (isDefaultShopPage) {
      setAnalyticsShop(DEFAULT_SHOP_SLUG);
    } else if (isCartFlowPage) {
      setAnalyticsShop(cartShopSlug);
    } else {
      setAnalyticsShop(null);
    }
  }, [shopPathSlug, isDefaultShopPage, isCartFlowPage, cartShopSlug]);

  // Корзина и чекаут лежат в отдельных чанках; покупателю на витрине они
  // понадобятся следующим шагом — догружаем их в простое, чтобы переход был мгновенным.
  const isStorefrontPage = isShopPage || isShopProductPage || normalizedPathname === '/shop';
  useEffect(() => {
    if (!isStorefrontPage) return undefined;
    const prefetch = () => {
      loadMarketplaceCart();
      loadMarketplaceCheckout();
    };
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(prefetch, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(prefetch, 1500);
    return () => window.clearTimeout(id);
  }, [isStorefrontPage]);

  // Аналитика: просмотры страниц при SPA-переходах. Первую страницу счётчики
  // считают сами при загрузке, дальше сообщаем о каждой смене пути вручную.
  // Эффект стоит после SEO-эффекта, чтобы document.title был уже обновлён.
  const initialPageTrackedRef = useRef(false);
  useEffect(() => {
    if (location.pathname !== normalizedPathname) return;
    const url = `${window.location.origin}${normalizedPathname}${location.search}`;
    if (!initialPageTrackedRef.current) {
      initialPageTrackedRef.current = true;
      trackPageView(url, { initial: true });
      return;
    }
    trackPageView(url);
  }, [location.pathname, normalizedPathname, location.search]);
  if (location.pathname !== normalizedPathname) {
    return (
      <Navigate
        to={{ pathname: normalizedPathname, search: location.search, hash: recoveredHash }}
        replace
      />
    );
  }

  return (
    <div className={styles.app}>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/login" element={<Navigate to="/admin/login" replace />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/chief" element={<ChiefLanding />} />
          {/* Единая политика и реквизиты для всего сайта; старые адреса ведут туда же */}
          <Route path="/privacy" element={<SitePrivacyPage />} />
          <Route path="/consent" element={<SitePdConsentPage />} />
          <Route path="/ad-consent" element={<SiteAdConsentPage />} />
          <Route path="/chief/privacy" element={<Navigate to="/privacy" replace />} />
          <Route path="/requisites" element={<SellerRequisites />} />
          <Route path="/3d-print" element={<Print3dLanding />} />
          <Route path="/guide" element={<GuideLanding />} />
          <Route path="/course" element={<CourseLanding />} />
          <Route path="/course/offer" element={<CourseOffer />} />
          <Route path="/course/privacy" element={<CoursePrivacy />} />
          <Route path="/course/checkout" element={<CourseCheckout />} />
          <Route path="/course/success" element={<CourseSuccess />} />
          <Route path="/guide/offer" element={<GuideOffer />} />
          <Route path="/guide/privacy" element={<GuidePrivacy />} />
          <Route path="/guide/checkout" element={<GuideCheckout />} />
          <Route path="/guide/success" element={<GuideSuccess />} />
          <Route path="/founders/dmitry" element={<SellerRequisites />} />
          {/* Старый адрес реквизитов (продавцом был Суворов Ю. И.) — ведёт на те же реквизиты. */}
          <Route path="/founders/yuri" element={<SellerRequisites />} />
          <Route path="/" element={<MainLanding />} />
          <Route path="/pdf" element={<PDFViewer />} />
          <Route path="/stl" element={<StlViewer />} />
          <Route path="/shop" element={<Marketplace />} />
          <Route path="/shop/product/:id" element={<MarketplaceProduct />} />
          <Route path="/shop/cart" element={<MarketplaceCart />} />
          <Route path="/shop/checkout" element={<MarketplaceCheckout />} />
          <Route path="/shop/success" element={<MarketplaceSuccess />} />
          <Route path="/shop/offer" element={<ShopOfferPage />} />
          {/* Витрина отдельного магазина: /shop/af_pastry и его карточки товаров.
              Статические пути выше (/shop/cart и др.) матчатся раньше. */}
          <Route path="/shop/:shopSlug" element={<Marketplace />} />
          <Route path="/shop/:shopSlug/product/:id" element={<MarketplaceProduct />} />
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminHome />} />
            <Route path="/admin/orders" element={<Navigate to="/admin/orders/custom" replace />} />
            <Route path="/admin/orders/without-tracker" element={<OrderList />} />
            <Route path="/admin/orders/created" element={<OrderList />} />
            <Route path="/admin/orders/delivering" element={<OrderList />} />
            <Route path="/admin/orders/custom" element={<CustomOrders />} />
            <Route path="/admin/orders/custom/create" element={<CustomOrdersList />} />
            <Route path="/admin/orders/custom/ship" element={<CustomShipList />} />
            <Route path="/admin/orders/custom/order/:orderId" element={<CustomOrderFill />} />
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/admin/products/analytics" element={<ShopSalesReport />} />
            {/* Карточка товара: productId = "new" — создание, uuid — редактирование. */}
            <Route path="/admin/products/:productId" element={<AdminProductEdit />} />
            <Route path="/admin/promo-codes" element={<AdminPromoCodes />} />
            <Route path="/admin/promo-popups" element={<AdminPromoPopups />} />
            <Route path="/admin/free-delivery" element={<AdminFreeDelivery />} />
            <Route path="/admin/invoices" element={<AdminInvoices />} />
            <Route path="/admin/invoices/training" element={<AdminTrainingInvoices />} />
            <Route path="/admin/invoices/receipts" element={<AdminYookassaReceipts />} />
            <Route path="/admin/salesbot" element={<AdminSalesbot />} />
            <Route path="/admin/salesbot/manual" element={<AdminSalesbotManualRun />} />
            <Route path="/admin/salesbot/analytics" element={<AdminSalesbotAnalytics />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
          {/* Старые адреса админки → новые под /admin */}
          <Route path="/orders" element={<Navigate to="/admin/orders/custom" replace />} />
          <Route path="/orders/without-tracker" element={<Navigate to="/admin/orders/without-tracker" replace />} />
          <Route path="/orders/created" element={<Navigate to="/admin/orders/created" replace />} />
          <Route path="/orders/delivering" element={<Navigate to="/admin/orders/delivering" replace />} />
          <Route path="/orders/custom" element={<Navigate to="/admin/orders/custom" replace />} />
          <Route path="/orders/custom/create" element={<Navigate to="/admin/orders/custom/create" replace />} />
          <Route path="/orders/custom/ship" element={<Navigate to="/admin/orders/custom/ship" replace />} />
          {/* Страница позиции доступна без логина (публичная ссылка для клиента) — вне админского layout и вне /admin. */}
          <Route path="/orders/custom/item/:itemId" element={<CustomItemPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
      <PromoPopupHost pathname={normalizedPathname} search={location.search} />
    </div>
  );
}

export default App;


