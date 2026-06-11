import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getItems } from '../../services/itemsService';
import ProductCard from '../ProductCard/ProductCard';
import CTAButton from '../shared/CTAButton/CTAButton';
import styles from './Marketplace.module.css';

const TG_ORDER_LINK = 'https://t.me/AnyFormsBot';
const TG_CHANNEL = 'https://t.me/anyforms';
const PHONE_E164 = '+79810403953';
const CONTACT_EMAIL = 'suvorov@anyforms.ru';
const PROMO_CODE = 'any-shop-10';

const formatPrice = (value) => `${value.toLocaleString('ru-RU')} ₽`;

const Marketplace = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [copied, setCopied] = useState(false);
  const photos = selectedItem?.photos?.length ? selectedItem.photos : [];

  const openPopup = (item) => {
    setSelectedItem(item);
  };

  const closePopup = () => {
    setSelectedItem(null);

    // Чтобы попап не открывался заново эффектом по query-параметру `id`.
    const params = new URLSearchParams(location.search);
    if (params.has('id')) {
      params.delete('id');
      const search = params.toString();
      navigate(
        {
          pathname: location.pathname,
          search: search ? `?${search}` : '',
        },
        { replace: true }
      );
    }
  };

  const stopPropagation = (e) => e.stopPropagation();

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

  useEffect(() => {
    if (!items.length) return;

    const idParam = new URLSearchParams(location.search).get('id');
    if (!idParam) return;

    const normalizedId = idParam.replace(/^['"]|['"]$/g, '').trim();
    if (!normalizedId) return;

    const matchingItem = items.find((item) => String(item.id) === normalizedId);
    if (!matchingItem) return;
    if (selectedItem?.id === matchingItem.id) return;

    openPopup(matchingItem);
  }, [items, location.search, selectedItem?.id]);

  if (loading) {
    return (
      <div className={styles.wrap}>
        <p className={styles.message}>Загрузка товаров...</p>
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
          <a className={styles.logoLink} href="#top" aria-label="AnyForms — наверх">
            <img
              className={styles.logo}
              src="/anyforms_logo_new_white.svg"
              alt=""
              width={180}
              height={41}
              decoding="async"
            />
          </a>
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
      <ul className={styles.grid}>
        {items.map((item) => (
          <li key={item.name} className={styles.gridItem}>
            <ProductCard item={item} onSelect={openPopup} />
          </li>
        ))}
      </ul>
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

      {selectedItem && (
        <div
          className={styles.popupOverlay}
          onClick={closePopup}
          role="dialog"
          aria-modal="true"
          aria-label="Карточка товара"
        >
          <div className={styles.popup} onClick={stopPropagation}>
            <button
              type="button"
              className={styles.popupClose}
              onClick={closePopup}
              aria-label="Закрыть"
            >
              ×
            </button>

            <div className={styles.popupGallery}>
              <div className={styles.popupGalleryTrack}>
                {photos.map((src, i) => (
                  <div key={i} className={styles.popupGallerySlide}>
                    <img
                      src={src}
                      alt={`${selectedItem.name} — фото ${i + 1}`}
                      className={styles.popupGalleryImg}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.popupBody}>
              <h2 className={styles.popupName}>{selectedItem.name}</h2>
              {selectedItem.description && (
                <div className={styles.popupDescription}>{selectedItem.description}</div>
              )}
              <div className={styles.popupPrices}>
                <span className={styles.popupPrice}>{formatPrice(selectedItem.price)}</span>
                {selectedItem.crossedPrice != null && selectedItem.crossedPrice > selectedItem.price && (
                  <span className={styles.popupCrossedPrice}>{formatPrice(selectedItem.crossedPrice)}</span>
                )}
              </div>
              <div className={styles.popupActions}>
                {selectedItem.tgLink && (
                  <a
                    href={selectedItem.tgLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.popupBtnDetails}
                  >
                    Подробнее
                  </a>
                )}
                <CTAButton href={TG_ORDER_LINK} target="_blank" rel="noopener noreferrer">
                  Заказать
                </CTAButton>
              </div>
            </div>
          </div>
        </div>
      )}

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
