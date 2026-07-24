import React, { useState, useEffect } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../apiClient';
import { SECTIONS, getAllowedSections, sectionForPath } from '../../permissions';
import styles from './AdminLayout.module.css';

const MENU = [
  {
    title: 'под заказ',
    section: SECTIONS.CUSTOM_ORDERS,
    items: [
      { to: '/admin/orders/custom', label: 'В работе' },
      { to: '/admin/orders/custom/create', label: 'Клиенты' },
      { to: '/admin/orders/custom/ship', label: 'Доставка' },
    ],
  },
  {
    title: 'розница',
    section: SECTIONS.RETAIL,
    items: [
      { to: '/admin/orders/without-tracker', label: 'Без трекера' },
      { to: '/admin/orders/created', label: 'К отправке' },
      { to: '/admin/orders/delivering', label: 'Доставляются' },
    ],
  },
  {
    title: 'управление товарами',
    section: SECTIONS.PRODUCTS,
    items: [{ to: '/admin/products', label: 'Товары розницы' }],
  },
  {
    title: 'деньги',
    section: SECTIONS.INVOICES,
    items: [
      { to: '/admin/invoices', label: 'Обычный счёт', section: SECTIONS.INVOICES },
      { to: '/admin/invoices/training', label: 'Счета на обучение', section: SECTIONS.TRAINING_INVOICES },
    ],
  },
];

const AdminLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const jwtMeta = apiClient.getJwtMetadata();
  const role = jwtMeta?.role;
  const userName = jwtMeta?.name;
  const allowedSections = getAllowedSections(role);
  // Пункт меню может иметь свою секцию (иначе берётся секция группы); пустые группы скрываем.
  const visibleMenu = MENU.map((section) => ({
    ...section,
    items: section.items.filter((item) => allowedSections.includes(item.section || section.section)),
  })).filter((section) => section.items.length > 0);

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
      {visibleMenu.map((section) => (
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

  // Без живого токена в админке делать нечего — на логин с возвратом обратно.
  if (!apiClient.hasLiveToken()) {
    const from = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/admin/login?from=${from}`} replace />;
  }

  // Прямая ссылка на секцию, которая роли недоступна, — уводим на домашнюю.
  const currentSection = sectionForPath(location.pathname);
  if (role && currentSection && !allowedSections.includes(currentSection)) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className={styles.layout}>
      <div className={styles.headerSafeArea} aria-hidden="true" />
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.headerLeft}>
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
            {userName && <span className={styles.userName}>{userName}</span>}
          </div>
          <span
            className={styles.logoLink}
            onClick={() => navigate('/admin')}
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
