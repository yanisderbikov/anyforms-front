import React, { Suspense, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { useCart } from './context/CartContext';
import OrderList from './components/OrderList/OrderList';
import PDFViewer from './components/PDFViewer/PDFViewer';
import styles from './App.module.css';
import Marketplace from "./components/Marketplace/Marketplace";
import MarketplaceProduct from "./components/Marketplace/MarketplaceProduct";
import MarketplaceCart from "./components/Marketplace/MarketplaceCart";
import MarketplaceCheckout from "./components/Marketplace/MarketplaceCheckout";
import MarketplaceSuccess from "./components/Marketplace/MarketplaceSuccess";
import Login from "./components/Login/Login";
import AdminProducts from "./components/AdminProducts/AdminProducts";
import AdminProductEdit from "./components/AdminProducts/AdminProductEdit";
import AdminInvoices from "./components/AdminInvoices/AdminInvoices";
import AdminPromoCodes from "./components/AdminPromoCodes/AdminPromoCodes";
import AdminTrainingInvoices from "./components/AdminInvoices/AdminTrainingInvoices";
import AdminYookassaReceipts from "./components/AdminInvoices/AdminYookassaReceipts";
import AdminLayout from "./components/AdminLayout/AdminLayout";
import AdminHome from "./components/AdminHome/AdminHome";
import ChiefLanding from "./components/ChiefLanding/ChiefLanding";
import ChiefPrivacy from "./components/ChiefLanding/ChiefPrivacy";
import MainLanding from "./components/MainLanding/MainLanding";
import Print3dLanding from "./components/Print3dLanding/Print3dLanding";
import GuideLanding from "./components/GuideLanding/GuideLanding";
import CourseLanding from "./components/CourseLanding/CourseLanding";
import { CourseOffer, CoursePrivacy } from "./components/CourseLanding/CourseLegal";
import CourseCheckout from "./components/CourseLanding/CourseCheckout";
import CourseSuccess from "./components/CourseLanding/CourseSuccess";
import FounderYuri from "./components/Founders/FounderYuri";
import { GuideOffer, GuidePrivacy } from "./components/GuideLanding/GuideLegal";
import GuideCheckout from "./components/GuideLanding/GuideCheckout";
import GuideSuccess from "./components/GuideLanding/GuideSuccess";
import NotFound from "./components/NotFound/NotFound";
import CustomOrders from "./components/CustomOrders/CustomOrders";
import CustomOrdersList from "./components/CustomOrders/CustomOrdersList";
import CustomOrderFill from "./components/CustomOrders/CustomOrderFill";
import CustomShipList from "./components/CustomOrders/CustomShipList";
import CustomItemPage from "./components/CustomOrders/CustomItemPage";
import { SHOP_THEMES } from "./components/Marketplace/shopThemes";
import { SITE_URL, PAGE_SEO, DEFAULT_OG_IMAGE } from './shared/pageSeo.mjs';

// three.js весит больше всего остального бандла — грузим его только на /stl.
const StlViewer = React.lazy(() => import('./components/StlViewer/StlViewer'));

const KNOWN_PATHS = new Set([
  '/',
  '/login',
  '/chief',
  '/chief/privacy',
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
  '/admin/promo-codes',
  '/admin/invoices',
  '/admin/invoices/training',
  '/admin/invoices/receipts',
]);

// Служебные разделы магазина: не могут быть slug'ом витрины партнёра.
const SHOP_RESERVED_SEGMENTS = new Set(['product', 'cart', 'checkout', 'success']);

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
  const isChiefPrivacyPage = normalizedPathname === '/chief/privacy';
  const isChiefPage = normalizedPathname === '/chief';
  const is3dPrintPage = normalizedPathname === '/3d-print';
  const isGuidePage = normalizedPathname === '/guide' || normalizedPathname.startsWith('/guide/');
  const isCoursePage = normalizedPathname === '/course' || normalizedPathname.startsWith('/course/');
  const isFounderPage = normalizedPathname.startsWith('/founders/');
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
    } else if (normalizedPathname === '/stl') {
      document.body.style.background = '#fff';
    } else if (isChiefPage || isChiefPrivacyPage || is3dPrintPage || (isNotFoundPage && !normalizedPathname.startsWith('/orders') && !normalizedPathname.startsWith('/admin'))) {
      document.body.style.background = '#000';
    } else if (shopThemeBg || cartThemeBg) {
      document.body.style.background = shopThemeBg || cartThemeBg;
    } else {
      document.body.style.background = '#e5e5e5';
    }
  }, [normalizedPathname, isHomePage, isChiefPage, isChiefPrivacyPage, is3dPrintPage, isGuidePage, isCoursePage, isFounderPage, isNotFoundPage, shopThemeBg, cartThemeBg]);

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
      <Routes>
        <Route path="/login" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<Login />} />
        <Route path="/chief" element={<ChiefLanding />} />
        <Route path="/chief/privacy" element={<ChiefPrivacy />} />
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
        <Route path="/founders/yuri" element={<FounderYuri />} />
        <Route path="/" element={<MainLanding />} />
        <Route path="/pdf" element={<PDFViewer />} />
        <Route
          path="/stl"
          element={
            <Suspense fallback={null}>
              <StlViewer />
            </Suspense>
          }
        />
        <Route path="/shop" element={<Marketplace />} />
        <Route path="/shop/product/:id" element={<MarketplaceProduct />} />
        <Route path="/shop/cart" element={<MarketplaceCart />} />
        <Route path="/shop/checkout" element={<MarketplaceCheckout />} />
        <Route path="/shop/success" element={<MarketplaceSuccess />} />
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
          {/* Карточка товара: productId = "new" — создание, uuid — редактирование. */}
          <Route path="/admin/products/:productId" element={<AdminProductEdit />} />
          <Route path="/admin/promo-codes" element={<AdminPromoCodes />} />
          <Route path="/admin/invoices" element={<AdminInvoices />} />
          <Route path="/admin/invoices/training" element={<AdminTrainingInvoices />} />
          <Route path="/admin/invoices/receipts" element={<AdminYookassaReceipts />} />
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
    </div>
  );
}

export default App;



