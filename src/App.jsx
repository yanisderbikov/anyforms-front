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

function App() {
  const location = useLocation();
  const normalizedPathname =
    location.pathname.length > 1 ? location.pathname.replace(/\/+$/, '') : location.pathname;
  const isHomePage = normalizedPathname === '/';
  const isChiefPrivacyPage = normalizedPathname === '/chief/privacy';
  const isChiefPage = normalizedPathname === '/chief';

  useEffect(() => {
    if (isHomePage) {
      document.body.style.background = '#fff';
    } else if (isChiefPage || isChiefPrivacyPage) {
      document.body.style.background = '#000';
    } else {
      document.body.style.background = '#e5e5e5';
    }
  }, [isHomePage, isChiefPage, isChiefPrivacyPage]);

  if (location.pathname !== normalizedPathname) {
    return <Navigate to={normalizedPathname} replace />;
  }

  return (
    <div className={styles.app}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/chief" element={<ChiefLanding />} />
        <Route path="/chief/privacy" element={<ChiefPrivacy />} />
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



