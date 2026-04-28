import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

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
      <App />
      <Toaster position="top-right" />
    </BrowserRouter>
  </React.StrictMode>
);
