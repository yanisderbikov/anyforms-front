import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../apiClient';
import styles from './AdminLayout.module.css';

const MENU = [
  {
    title: 'под заказ',
    items: [
      { to: '/admin/orders/custom', label: 'В работе' },
      { to: '/admin/orders/custom/create', label: 'Клиенты' },
      { to: '/admin/orders/custom/ship', label: 'Доставка' },
    ],
  },
  {
    title: 'розница',
    items: [
      { to: '/admin/orders/without-tracker', label: 'Без трекера' },
      { to: '/admin/orders/created', label: 'К отправке' },
      { to: '/admin/orders/delivering', label: 'Доставляются' },
    ],
  },
  {
    title: 'управление товарами',
    items: [{ to: '/admin/products', label: 'Товары розницы' }],
  },
  {
    title: 'деньги',
    items: [{ to: '/admin/invoices', label: 'Выставить счёт' }],
  },
];

const AdminLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Закрываем мобильное меню при переходе на другую страницу.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Блокируем скролл фона, пока открыт мобильный drawer.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const handleLogout = () => {
    apiClient.clearToken();
    navigate('/admin/login', { replace: true });
  };

  const nav = (
    <nav className={styles.nav}>
      {MENU.map((section) => (
        <div key={section.title} className={styles.section}>
          <p className={styles.sectionTitle}>{section.title}</p>
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}
      <button type="button" className={styles.logout} onClick={handleLogout}>
        Выйти
      </button>
    </nav>
  );

  return (
    <div className={styles.layout}>
      <div className={styles.headerSafeArea} aria-hidden="true" />
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <button
            type="button"
            className={styles.burger}
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerLineTop : ''}`} />
            <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerLineHidden : ''}`} />
            <span className={`${styles.burgerLine} ${menuOpen ? styles.burgerLineBottom : ''}`} />
          </button>
          <img
            className={styles.catImg}
            src="https://cataas.com/cat?width=82&height=82"
            alt="Случайный котик"
            width={41}
            height={41}
            loading="lazy"
            decoding="async"
          />
          <span
            className={styles.logoLink}
            onClick={() => navigate('/admin/orders/custom')}
            role="button"
            aria-label="anyforms"
          >
            <img
              className={styles.logo}
              src="/anyforms_logo_new_white.svg"
              alt=""
              width={180}
              height={41}
              decoding="async"
            />
          </span>
        </div>
      </header>

      <aside className={styles.sidebar}>{nav}</aside>

      {menuOpen && (
        <>
          <div className={styles.backdrop} onClick={() => setMenuOpen(false)} />
          <aside className={styles.drawer}>{nav}</aside>
        </>
      )}

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
