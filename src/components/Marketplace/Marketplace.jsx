import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getItems } from '../../services/itemsService';
import { trackProductOpen } from '../../services/analytics';
import { useCart } from '../../context/CartContext';
import { useLikes } from '../../hooks/useLikes';
import ProductCard from '../ProductCard/ProductCard';
import styles from './Marketplace.module.css';

const TG_ORDER_LINK = 'https://t.me/AnyFormsBot';
const TG_CHANNEL = 'https://t.me/anyforms';
const PHONE_E164 = '+79810403953';
const CONTACT_EMAIL = 'suvorov@anyforms.ru';
const PROMO_CODE = 'any-shop-10';

const Marketplace = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { count } = useCart();
  const { isLiked, count: likesCount } = useLikes();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showLiked, setShowLiked] = useState(false);

  const visibleItems = showLiked ? items.filter((item) => isLiked(item.id)) : items;

  const openProduct = (item) => {
    trackProductOpen(item);
    navigate(`/shop/product/${item.id}`);
  };

  const handlePromoCopy = async () => {
    try {
      await navigator.clipboard.writeText(PROMO_CODE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (e) {
      setCopied(false);
    }
  };

  useEffect(() => {
    getItems()
      .then(setItems)
      .catch((err) => setError(err?.message || 'Не удалось загрузить товары'))
      .finally(() => setLoading(false));
  }, []);

  // Совместимость со старыми ссылками вида /shop?id=<uuid>: уводим на страницу товара.
  useEffect(() => {
    if (!items.length) return;

    const idParam = new URLSearchParams(location.search).get('id');
    if (!idParam) return;

    const normalizedId = idParam.replace(/^['"]|['"]$/g, '').trim();
    if (!normalizedId) return;

    const matchingItem = items.find((item) => String(item.id) === normalizedId);
    if (!matchingItem) return;

    navigate(`/shop/product/${matchingItem.id}`, { replace: true });
  }, [items, location.search, navigate]);

  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.loader} role="status" aria-label="Загрузка товаров">
          <span className={styles.spinner} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.wrap}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className={styles.wrap}>
        <p className={styles.message}>Товаров пока нет.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.headerSafeArea} aria-hidden="true" />
      {copied && (
        <div className={styles.globalCopyToast} role="status">
          Скопировано
        </div>
      )}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a className={styles.logoLink} href="#top" aria-label="anyforms — наверх">
            <img
              className={styles.logo}
              src="/anyforms_logo_new_white.svg"
              alt=""
              width={180}
              height={41}
              decoding="async"
            />
          </a>
          <button
            type="button"
            className={`${styles.likesToggle} ${showLiked ? styles.likesToggleActive : ''}`}
            onClick={() => setShowLiked((prev) => !prev)}
            aria-label={showLiked ? 'Показать все товары' : 'Показать избранное'}
            aria-pressed={showLiked}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill={showLiked ? '#f0808f' : 'none'}
              stroke={showLiked ? '#f0808f' : '#fff'}
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
            </svg>
            {likesCount > 0 && <span className={styles.cartBadge}>{likesCount}</span>}
          </button>
          <Link
            className={styles.cartLink}
            to="/shop/cart"
            aria-label={`Корзина${count ? `, товаров: ${count}` : ''}`}
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {count > 0 && <span className={styles.cartBadge}>{count}</span>}
          </Link>
        </div>
      </header>
      <div className={styles.intro}>
        <h1 className={styles.subtitle}>
          Профессиональные молды для чистого изделия{' '}
          <strong className={styles.highlight}>без доработки</strong>. Если дефект
          появился из-за формы —{' '}
          <strong className={styles.highlight}>заменим молд или вернём деньги</strong>.
        </h1>
      </div>
      {showLiked && visibleItems.length === 0 ? (
        <p className={styles.message}>
          Пока ничего не выбрано — нажмите на сердечко у товара, чтобы сохранить его здесь.
        </p>
      ) : (
        <ul className={styles.grid}>
          {visibleItems.map((item) => (
            <li key={item.name} className={styles.gridItem}>
              <ProductCard item={item} onSelect={openProduct} />
            </li>
          ))}
        </ul>
      )}
      <p className={styles.promoNote}>
        По промокоду{' '}
        <button type="button" className={styles.promoCodeButton} onClick={handlePromoCopy}>
          {PROMO_CODE}
        </button>{' '}
        скидка 10% на первый заказ. Отправьте это сообщение{' '}
        <a href={TG_ORDER_LINK} target="_blank" rel="noopener noreferrer" className={styles.promoLink}>
          менеджеру в телеграм
        </a>
        .
      </p>

      <footer className={styles.siteFooter}>
        <div className={styles.footerGrid}>
          <div className={styles.footerBlock}>
            <h2 className={styles.footerHeading}>О компании</h2>
            <p className={styles.footerText}>
              ИП Суворов Дмитрий Игоревич
              <br />
              ИНН 590699241510
              <br />
              Юридический адрес: г. Санкт-Петербург, ул. Заречная, д. 36, корп. 1, кв. 404
            </p>
          </div>
          <div className={styles.footerBlock}>
            <h2 className={styles.footerHeading}>Контакты</h2>
            <p className={styles.footerText}>
              <a className={styles.footerLink} href={`tel:${PHONE_E164.replace(/\D/g, '')}`}>
                +7&nbsp;981&nbsp;040-39-53
              </a>
              <br />
              <a className={styles.footerLink} href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              <br />
              <a
                className={styles.footerLink}
                href={TG_CHANNEL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Telegram — канал
              </a>
              <br />
              <a
                className={styles.footerLink}
                href={TG_ORDER_LINK}
                target="_blank"
                rel="noopener noreferrer"
              >
                Связаться с менеджером
              </a>
            </p>
          </div>
        </div>
        <p className={styles.footerLegal}>
          <Link to="/chief/privacy" className={styles.footerLegalLink}>
            Политика конфиденциальности
          </Link>
        </p>
        <p className={styles.footerCopyright}>© anyforms, 2026. Все права защищены</p>
      </footer>
    </div>
  );
};

export default Marketplace;
