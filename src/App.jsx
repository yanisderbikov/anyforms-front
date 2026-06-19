import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import OrderList from './components/OrderList/OrderList';
import PDFViewer from './components/PDFViewer/PDFViewer';
import styles from './App.module.css';
import Marketplace from "./components/Marketplace/Marketplace";
import Login from "./components/Login/Login";
import AdminProducts from "./components/AdminProducts/AdminProducts";
import ChiefLanding from "./components/ChiefLanding/ChiefLanding";
import ChiefPrivacy from "./components/ChiefLanding/ChiefPrivacy";
import MainLanding from "./components/MainLanding/MainLanding";
import Print3dLanding from "./components/Print3dLanding/Print3dLanding";
import GuideLanding from "./components/GuideLanding/GuideLanding";

const SITE_URL = 'https://anyforms.ru';

const PAGE_SEO = {
  '/': {
    title: 'Силиконовые формы под заказ',
    description:
      'Силиконовые формы на заказ: рестораны, кондитерские, свечевары и производство. Подберём форму и рассчитаем под вашу задачу.',
  },
  '/chief': {
    title: 'AnyForms Chief - Инструменты для руководителя',
    description: 'Аналитика и управление процессом заказов для руководителей и команд.',
  },
  '/chief/privacy': {
    title: 'AnyForms - Политика конфиденциальности',
    description: 'Политика обработки и защиты персональных данных сервиса AnyForms.',
  },
  '/3d-print': {
    title: '3D-печать на заказ - AnyForms',
    description: 'Сервис заказа 3D-печати: быстрый расчёт, производство и доставка.',
  },
  '/guide': {
    title: 'Как продавать сложный продукт через короткие видео — гайд Юрия Суворова',
    description:
      'Пошаговый гайд для мастеров, производителей и экспертов: как получать заявки из Reels, Shorts, TikTok и Клипов, а не просто собирать просмотры.',
  },
  '/shop': {
    title: 'Маркетплейс - AnyForms',
    description: 'Каталог товаров и оформление заказов в маркетплейсе AnyForms.',
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
  const isGuidePage = normalizedPathname === '/guide';

  useEffect(() => {
    if (isHomePage) {
      document.body.style.background = '#fff';
    } else if (isGuidePage) {
      document.body.style.background = '#f5f1e8';
    } else if (isChiefPage || isChiefPrivacyPage || is3dPrintPage) {
      document.body.style.background = '#000';
    } else {
      document.body.style.background = '#e5e5e5';
    }
  }, [isHomePage, isChiefPage, isChiefPrivacyPage, is3dPrintPage, isGuidePage]);

  useEffect(() => {
    const seo = PAGE_SEO[normalizedPathname] || {
      title: 'AnyForms',
      description: 'AnyForms - сервис управления заказами.',
    };
    const pageUrl = `${SITE_URL}${normalizedPathname}`;
    const isPrivatePage =
      normalizedPathname === '/login' ||
      normalizedPathname.startsWith('/orders') ||
      normalizedPathname.startsWith('/admin') ||
      normalizedPathname === '/pdf';

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
    upsertMetaTag('meta[property="og:image"]', { property: 'og:image', content: `${SITE_URL}/anyforms-logo.svg` });
    upsertMetaTag('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMetaTag('meta[name="twitter:title"]', { name: 'twitter:title', content: seo.title });
    upsertMetaTag('meta[name="twitter:description"]', { name: 'twitter:description', content: seo.description });
    upsertMetaTag('meta[name="twitter:image"]', { name: 'twitter:image', content: `${SITE_URL}/anyforms-logo.svg` });
    upsertCanonical(pageUrl);
  }, [normalizedPathname]);

  if (location.pathname !== normalizedPathname) {
    return <Navigate to={normalizedPathname} replace />;
  }

  return (
    <div className={styles.app}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/chief" element={<ChiefLanding />} />
        <Route path="/chief/privacy" element={<ChiefPrivacy />} />
        <Route path="/3d-print" element={<Print3dLanding />} />
        <Route path="/guide" element={<GuideLanding />} />
        <Route path="/" element={<MainLanding />} />
        <Route path="/pdf" element={<PDFViewer />} />
        <Route path="/shop" element={<Marketplace />} />
        <Route path="/orders" element={<Navigate to="/orders/without-tracker" replace />} />
        <Route path="/orders/without-tracker" element={<OrderList />} />
        <Route path="/orders/created" element={<OrderList />} />
        <Route path="/orders/delivering" element={<OrderList />} />
        <Route path="/admin/products" element={<AdminProducts />} />
      </Routes>
    </div>
  );
}

export default App;



