import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import OrderList from './components/OrderList/OrderList';
import PDFViewer from './components/PDFViewer/PDFViewer';
import styles from './App.module.css';
import Marketplace from "./components/Marketplace/Marketplace";
import Login from "./components/Login/Login";
import AdminProducts from "./components/AdminProducts/AdminProducts";
import ChiefLanding from "./components/ChiefLanding/ChiefLanding";

function App() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isChiefPage = location.pathname === '/chief';
  const isOrdersPage = location.pathname.startsWith('/orders');
  const isLoginPage = location.pathname === '/login';
  const isAdminProductsPage = location.pathname === '/admin/products';

  useEffect(() => {
    if (isHomePage) {
      document.body.style.background = '#fff';
    } else {
      document.body.style.background = '#e5e5e5';
    }
  }, [isHomePage]);

  const fullscreen = isHomePage || isChiefPage;

  return (
    <div className={`${styles.app} ${fullscreen ? styles.appFullscreen : ''}`}>
      <main className={fullscreen ? styles.mainFullscreen : styles.main}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/chef" element={<Navigate to="/chief" replace />} />
          <Route path="/cheif" element={<Navigate to="/chief" replace />} />
          <Route path="/chief" element={<ChiefLanding />} />
          <Route path="/" element={<PDFViewer />} />
          <Route path="/pdf" element={<PDFViewer />} />
          <Route path="/shop" element={<Marketplace />} />
          <Route path="/orders" element={<Navigate to="/orders/without-tracker" replace />} />
          <Route path="/orders/without-tracker" element={<OrderList />} />
          <Route path="/orders/created" element={<OrderList />} />
          <Route path="/orders/delivering" element={<OrderList />} />
          <Route path="/admin/products" element={<AdminProducts />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;



