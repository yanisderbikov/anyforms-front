import React, { useState, useEffect } from 'react';
import { getItems } from '../../services/itemsService';
import ProductCard from '../ProductCard/ProductCard';
import styles from './Marketplace.module.css';

const TG_ORDER_LINK = 'https://t.me/AnyFormsBot';

const formatPrice = (value) => `${value.toLocaleString('ru-RU')} ₽`;

const Marketplace = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [popupPhotoIndex, setPopupPhotoIndex] = useState(0);

  const openPopup = (item) => {
    setSelectedItem(item);
    setPopupPhotoIndex(0);
  };

  const closePopup = () => {
    setSelectedItem(null);
  };

  const stopPropagation = (e) => e.stopPropagation();

  useEffect(() => {
    getItems()
      .then(setItems)
      .catch((err) => setError(err?.message || 'Не удалось загрузить товары'))
      .finally(() => setLoading(false));
  }, []);

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

  const photos = selectedItem?.photos?.length ? selectedItem.photos : [];

  return (
    <div className={styles.wrap}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a className={styles.logoLink} href="#top" aria-label="AnyForms — наверх">
            <img
              className={styles.logo}
              src="/anyforms_logo_new_white.svg"
              alt=""
              width={200}
              height={46}
              decoding="async"
            />
          </a>
        </div>
      </header>
      <ul className={styles.grid}>
        {items.map((item) => (
          <li key={item.name} className={styles.gridItem}>
            <ProductCard item={item} onSelect={openPopup} />
          </li>
        ))}
      </ul>

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
              <div
                className={styles.popupGalleryTrack}
                style={{ transform: `translateX(-${popupPhotoIndex * 100}%)` }}
              >
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
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    className={styles.popupNavPrev}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPopupPhotoIndex((i) => (i === 0 ? photos.length - 1 : i - 1));
                    }}
                    aria-label="Предыдущее фото"
                  />
                  <button
                    type="button"
                    className={styles.popupNavNext}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPopupPhotoIndex((i) => (i === photos.length - 1 ? 0 : i + 1));
                    }}
                    aria-label="Следующее фото"
                  />
                  <div className={styles.popupDots}>
                    {photos.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        className={i === popupPhotoIndex ? styles.popupDotActive : styles.popupDot}
                        onClick={(e) => {
                          e.stopPropagation();
                          setPopupPhotoIndex(i);
                        }}
                        aria-label={`Фото ${i + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
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
                <a
                  href={TG_ORDER_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.popupBtnOrder}
                >
                  Заказать
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Marketplace;
