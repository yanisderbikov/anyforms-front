import React, { useState, useEffect } from 'react';
import { Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../../apiClient';
import { SECTIONS, getAllowedSections, sectionForPath } from '../../permissions';
import SiteHeader from '../shared/SiteHeader/SiteHeader';
import styles from './AdminLayout.module.css';

const MENU = [
  {
    // Подразделы (в работе/клиенты/доставка, без трекера/к отправке/доставляются)
    // живут вкладками внутри самих страниц, в меню — только вход в группу.
    // `match` — префиксы путей, на которых пункт считается активным.
    title: 'заказы',
    section: SECTIONS.CUSTOM_ORDERS,
    items: [
      {
        to: '/admin/orders/custom',
        label: 'Под заказ',
        section: SECTIONS.CUSTOM_ORDERS,
        match: ['/admin/orders/custom'],
      },
      {
        to: '/admin/orders/without-tracker',
        label: 'Розница',
        section: SECTIONS.RETAIL,
        match: ['/admin/orders/without-tracker', '/admin/orders/created', '/admin/orders/delivering'],
      },
    ],
  },
  {
    title: 'управление товарами',
    section: SECTIONS.PRODUCTS,
    items: [
      { to: '/admin/products', label: 'Товары розницы' },
      { to: '/admin/products/analytics', label: 'Аналитика' },
    ],
  },
  {
    title: 'деньги',
    section: SECTIONS.INVOICES,
    items: [
      { to: '/admin/invoices', label: 'Обычный счёт', section: SECTIONS.INVOICES },
      { to: '/admin/invoices/training', label: 'Счета на обучение', section: SECTIONS.TRAINING_INVOICES },
      { to: '/admin/invoices/receipts', label: 'Чеки Юра', section: SECTIONS.YOOKASSA_RECEIPTS },
      { to: '/admin/promo-codes', label: 'Промокоды', section: SECTIONS.PROMO_CODES },
    ],
  },
  {
    title: 'боты amocrm',
    section: SECTIONS.SALESBOT,
    items: [
      { to: '/admin/salesbot', label: 'Цепочки' },
      { to: '/admin/salesbot/manual', label: 'Ручной запуск' },
      { to: '/admin/salesbot/analytics', label: 'Аналитика' },
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
          {section.items.map((item) => {
            const matched = item.match?.some((prefix) => location.pathname.startsWith(prefix));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={!item.match}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive || matched ? styles.navLinkActive : ''}`
                }
              >
                {item.label}
              </NavLink>
            );
          })}
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
      <SiteHeader
        logo={{
          to: '/admin',
          ariaLabel: 'anyforms',
          src: '/anyforms_logo_new_white.svg',
          width: 180,
          height: 41,
        }}
        logoAlign="center"
        left={(
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
        )}
        right={(
          <>
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
          </>
        )}
      />

      <aside className={styles.sidebar}>{nav}</aside>

      {/* Всегда в DOM: открытие/закрытие анимируется классом (см. .drawer в CSS). */}
      <div
        className={`${styles.backdrop} ${menuOpen ? styles.backdropOpen : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden="true"
      />
      <aside className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ''}`} aria-hidden={!menuOpen}>
        {nav}
      </aside>

      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
