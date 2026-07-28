import React, { Suspense, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
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
import AdminInvoices from "./components/AdminInvoices/AdminInvoices";
import AdminTrainingInvoices from "./components/AdminInvoices/AdminTrainingInvoices";
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

// three.js весит больше всего остального бандла — грузим его только на /stl.
const StlViewer = React.lazy(() => import('./components/StlViewer/StlViewer'));

const SITE_URL = 'https://anyforms.ru';

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
  '/admin/invoices',
  '/admin/invoices/training',
]);

// Служебные разделы магазина: не могут быть slug'ом витрины партнёра.
const SHOP_RESERVED_SEGMENTS = new Set(['product', 'cart', 'checkout', 'success']);

const PAGE_SEO = {
  '/': {
    title: 'Силиконовые формы под заказ',
    description:
      'Силиконовые формы на заказ: рестораны, кондитерские, свечевары и производство. Подберём форму и рассчитаем под вашу задачу.',
  },
  '/chief': {
    title: 'anyforms Chief - Инструменты для руководителя',
    description: 'Аналитика и управление процессом заказов для руководителей и команд.',
  },
  '/chief/privacy': {
    title: 'anyforms - Политика конфиденциальности',
    description: 'Политика обработки и защиты персональных данных сервиса anyforms.',
  },
  '/3d-print': {
    title: 'Корпуса для электроники на заказ — 3D-печать от 1 шт | anyforms',
    description:
      'Изготовим корпус для вашей электроники без пресс-формы: от образца за 3–7 рабочих дней до серии в тысячи штук. PETG, ABS GF, PA12. Расчёт за 15 минут.',
    image: `${SITE_URL}/og-3d-print.png`,
  },
  '/guide': {
    title: 'Как продавать сложный продукт через короткие видео — гайд Юрия Суворова',
    description:
      'Пошаговый гайд для мастеров, производителей и экспертов: как получать заявки из Reels, Shorts, TikTok и Клипов, а не просто собирать просмотры.',
  },
  '/course': {
    title: 'Курс по производству силиконовых форм — anyforms',
    description:
      'Видео-курс из 4 модулей: полный цикл производства силиконовых форм от идеи до рабочей формы на примере дизайнерской контейнерной свечи.',
  },
  '/course/offer': {
    title: 'Публичная оферта — курс anyforms',
    description: 'Условия предзаказа и покупки видео-курса по производству силиконовых форм.',
  },
  '/course/privacy': {
    title: 'Политика конфиденциальности — курс anyforms',
    description: 'Как обрабатываются персональные данные при покупке курса anyforms.',
  },
  '/course/checkout': {
    title: 'Предзаказ курса — anyforms',
    description: 'Оформление и оплата предзаказа видео-курса по производству силиконовых форм.',
  },
  '/course/success': {
    title: 'Предзаказ оформлен — доступ к курсу пришлём на почту',
    description: 'Спасибо за оплату. Доступ к курсу откроется в день старта и придёт на вашу почту.',
  },
  '/founders/yuri': {
    title: 'Реквизиты — Суворов Юрий Игоревич (самозанятый)',
    description: 'Реквизиты продавца: Суворов Юрий Игоревич, самозанятый (плательщик НПД), ИНН 590621081613.',
  },
  '/guide/offer': {
    title: 'Публичная оферта — гайд Юрия Суворова',
    description: 'Условия покупки электронного гайда «Как продавать сложный продукт через короткие видео».',
  },
  '/guide/privacy': {
    title: 'Политика конфиденциальности — гайд Юрия Суворова',
    description: 'Как обрабатываются персональные данные при покупке электронного гайда.',
  },
  '/guide/checkout': {
    title: 'Оплата гайда — anyforms',
    description: 'Оформление и оплата электронного гайда «Как продавать сложный продукт через короткие видео».',
  },
  '/guide/success': {
    title: 'Оплата прошла успешно — гайд отправлен на почту',
    description: 'Спасибо за покупку. Гайд отправлен на вашу электронную почту.',
  },
  '/shop': {
    title: 'Маркетплейс - anyforms',
    description: 'Каталог товаров и оформление заказов в маркетплейсе anyforms.',
  },
};

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
  const normalizedPathname =
    location.pathname.length > 1 ? location.pathname.replace(/\/+$/, '') : location.pathname;
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
    } else if (shopThemeBg) {
      document.body.style.background = shopThemeBg;
    } else {
      document.body.style.background = '#e5e5e5';
    }
  }, [normalizedPathname, isHomePage, isChiefPage, isChiefPrivacyPage, is3dPrintPage, isGuidePage, isCoursePage, isFounderPage, isNotFoundPage, shopThemeBg]);

  useEffect(() => {
    const shopPageSeo = isShopPage
      ? {
          title: `Магазин ${shopSlugMatch[1]} — anyforms`,
          description: `Товары магазина ${shopSlugMatch[1]} на anyforms.`,
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

    const ogImage = seo.image || `${SITE_URL}/anyforms-logo.svg`;

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
        to={{ pathname: normalizedPathname, search: location.search, hash: location.hash }}
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
          <Route path="/admin/invoices" element={<AdminInvoices />} />
          <Route path="/admin/invoices/training" element={<AdminTrainingInvoices />} />
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



