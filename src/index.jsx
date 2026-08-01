import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { CartProvider } from './context/CartContext';
import { initAnalytics } from './services/analytics';
import './index.css';

// Подключаем GTM: на прод-домене — боевой контейнер, иначе выключено
// (управление — VITE_ANALYTICS_ENABLED / VITE_GTM_ID, см. services/analytics.js).
initAnalytics();

// Обработка редиректа с 404.html для SPA роутинга на GitHub Pages
if (sessionStorage.getItem('spaRedirect')) {
    const redirectPath = sessionStorage.getItem('spaRedirect');
    sessionStorage.removeItem('spaRedirect');
    window.history.replaceState(null, '', redirectPath);
}

const routerBasename =
  import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '');

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter basename={routerBasename}>
      <CartProvider>
        <App />
        <Toaster position="top-right" />
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>
);
