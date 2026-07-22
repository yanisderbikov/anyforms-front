import React, { useEffect } from 'react';
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
  '/shop',
  '/orders',
  '/orders/without-tracker',
  '/orders/created',
  '/orders/delivering',
  '/orders/custom',
  '/orders/custom/create',
  '/orders/custom/ship',
  '/admin/products',
  '/admin/invoices',
]);

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
  const isShopProductPage = /^\/shop\/product\/[^/]+$/.test(normalizedPathname);
  const isNotFoundPage = !KNOWN_PATHS.has(normalizedPathname) && !isShopProductPage;

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
    } else if (isChiefPage || isChiefPrivacyPage || is3dPrintPage || (isNotFoundPage && !normalizedPathname.startsWith('/orders'))) {
      document.body.style.background = '#000';
    } else {
      document.body.style.background = '#e5e5e5';
    }
  }, [normalizedPathname, isHomePage, isChiefPage, isChiefPrivacyPage, is3dPrintPage, isGuidePage, isCoursePage, isFounderPage, isNotFoundPage]);

  useEffect(() => {
    const seo = PAGE_SEO[normalizedPathname] || (isNotFoundPage
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
  }, [normalizedPathname, isNotFoundPage]);
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
        <Route path="/login" element={<Login />} />
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
        <Route path="/shop" element={<Marketplace />} />
        <Route path="/shop/product/:id" element={<MarketplaceProduct />} />
        <Route path="/shop/cart" element={<MarketplaceCart />} />
        <Route path="/shop/checkout" element={<MarketplaceCheckout />} />
        <Route path="/shop/success" element={<MarketplaceSuccess />} />
        <Route path="/orders" element={<Navigate to="/orders/without-tracker" replace />} />
        <Route path="/orders/without-tracker" element={<OrderList />} />
        <Route path="/orders/created" element={<OrderList />} />
        <Route path="/orders/delivering" element={<OrderList />} />
        <Route path="/orders/custom" element={<CustomOrders />} />
        <Route path="/orders/custom/create" element={<CustomOrdersList />} />
        <Route path="/orders/custom/ship" element={<CustomShipList />} />
        <Route path="/orders/custom/item/:itemId" element={<CustomItemPage />} />
        <Route path="/orders/custom/order/:orderId" element={<CustomOrderFill />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/invoices" element={<AdminInvoices />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;



