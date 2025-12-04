import React, { useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import OrderList from './components/OrderList/OrderList';
import PDFViewer from './components/PDFViewer/PDFViewer';
import styles from './App.module.css';

function App() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';
  const isOrdersPage = location.pathname.startsWith('/orders');

  useEffect(() => {
    if (isHomePage) {
      document.body.style.background = '#fff';
    } else {
      document.body.style.background = '#e5e5e5';
    }
  }, [isHomePage]);

  return (
    <div className={`${styles.app} ${isHomePage ? styles.appFullscreen : ''}`}>
      {!isHomePage && !isOrdersPage && (
        <header className={styles.header}>
          <h1 className={styles.title}>any forms</h1>
        </header>
      )}
      <main className={isHomePage ? styles.mainFullscreen : styles.main}>
        <Routes>
          <Route path="/" element={<PDFViewer />} />
          <Route path="/orders" element={<Navigate to="/orders/without-tracker" replace />} />
          <Route path="/orders/without-tracker" element={<OrderList />} />
          <Route path="/orders/created" element={<OrderList />} />
          <Route path="/orders/delivering" element={<OrderList />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;



