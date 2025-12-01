import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import OrderList from './components/OrderList/OrderList';
import PDFViewer from './components/PDFViewer/PDFViewer';
import styles from './App.module.css';

function App() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    if (isHomePage) {
      document.body.style.background = '#fff';
    } else {
      document.body.style.background = '#e5e5e5';
    }
  }, [isHomePage]);

  return (
    <div className={`${styles.app} ${isHomePage ? styles.appFullscreen : ''}`}>
      {!isHomePage && (
        <header className={styles.header}>
          <h1 className={styles.title}>any forms</h1>
        </header>
      )}
      <main className={isHomePage ? styles.mainFullscreen : styles.main}>
        <Routes>
          <Route path="/" element={<PDFViewer />} />
          <Route path="/orders" element={<OrderList />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;



