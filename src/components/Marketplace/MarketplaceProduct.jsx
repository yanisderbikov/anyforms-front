import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getItems } from '../../services/itemsService';
import { trackViewItem, trackAddToCart } from '../../services/analytics';
import { useCart, isPurchasable, DEFAULT_SHOP_SLUG } from '../../context/CartContext';
import LikeButton from '../shared/LikeButton/LikeButton';
import AspectPhoto from '../shared/AspectPhoto/AspectPhoto';
import { SHOP_THEMES } from './shopThemes';
import styles from './MarketplaceProduct.module.css';

const TG_ORDER_LINK = 'https://t.me/AnyFormsBot';

const formatPrice = (value) => `${Number(value ?? 0).toLocaleString('ru-RU')} ₽`;

const ChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 6l6 6-6 6" />
  </svg>
);

const MarketplaceProduct = () => {
  const { id, shopSlug } = useParams();
  const { add, count, items: cartItems, replaceCartShop } = useCart();
  // Витрина, с которой открыт товар: ей засчитывается продажа.
  const currentShop = shopSlug || DEFAULT_SHOP_SLUG;
  const shopBase = shopSlug ? `/shop/${shopSlug}` : '/shop';
  // Тема партнёрской витрины: карточка товара оформляется в её стиле.
  const theme = shopSlug ? SHOP_THEMES[shopSlug] : null;
  const pageClass = theme ? `${styles.page} ${theme.className}` : styles.page;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const thumbsRef = useRef(null);

  useEffect(() => {
    getItems(shopSlug)
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [shopSlug]);

  const product = useMemo(
    () => items.find((item) => String(item.id) === String(id)) ?? null,
    [items, id]
  );

  // view_item — один раз на открытие конкретного товара (ref гасит повтор
  // эффекта от StrictMode; переход на другой товар меняет id и шлёт заново).
  const viewedIdRef = useRef(null);
  useEffect(() => {
    if (!product || viewedIdRef.current === String(product.id)) return;
    viewedIdRef.current = String(product.id);
    trackViewItem(product);
  }, [product]);

  useEffect(() => {
    setActiveImage(0);
  }, [id]);

  // Активное превью подъезжает в середину ленты (и по вертикали, и по горизонтали)
  useEffect(() => {
    const container = thumbsRef.current;
    const active = container?.querySelector(`.${styles.thumbActive}`);
    if (!container || !active) return;
    container.scrollTo({
      top: active.offsetTop - container.clientHeight / 2 + active.clientHeight / 2,
      left: active.offsetLeft - container.clientWidth / 2 + active.clientWidth / 2,
      behavior: 'smooth',
    });
  }, [activeImage]);

  // Заказ = одна витрина: товар с другой витрины можно добавить, только очистив корзину.
  const handleAdd = (product) => {
    if (add(product, 1, currentShop)) {
      trackAddToCart(product, { quantity: 1, placement: 'product_page' });
      return;
    }
    const confirmed = window.confirm(
      'В корзине уже есть товары из другого магазина. Очистить корзину и добавить этот товар?'
    );
    if (!confirmed) return;
    replaceCartShop(currentShop, product, 1);
    trackAddToCart(product, { quantity: 1, placement: 'product_page' });
  };

  const cartLink = (
    <Link className={styles.cartLink} to="/shop/cart" aria-label={`Корзина${count ? `, товаров: ${count}` : ''}`}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
      </svg>
      {count > 0 && <span className={styles.cartBadge}>{count}</span>}
    </Link>
  );

  if (loading) {
    return (
      <div className={pageClass} id="top">
        <div className={styles.inner}>
          <div className={styles.loader} role="status" aria-label="Загрузка товара">
            <span className={styles.spinner} />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className={pageClass} id="top">
        <div className={styles.inner}>
          <div className={styles.topBar}>
            <Link className={styles.back} to={shopBase}>← В магазин</Link>
            {cartLink}
          </div>
          <div className={styles.centered}>
            <p className={styles.centeredText}>Товар не найден или больше не доступен.</p>
            <Link className={styles.primaryLink} to={shopBase}>
              <span>Перейти к товарам</span>
              <span className={styles.ctaArrow} aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const photos = product.photos?.length ? product.photos : [];
  const hasGallery = photos.length > 1;
  const image = photos[Math.min(activeImage, photos.length - 1)];
  const onSale = product.crossedPrice != null && Number(product.crossedPrice) > Number(product.price);
  const inCart = cartItems.find((item) => item.id === String(product.id))?.quantity ?? 0;

  return (
    <div className={pageClass} id="top">
      <div className={styles.inner}>
        <div className={styles.topBar}>
          <Link className={styles.back} to={shopBase}>← В магазин</Link>
          {cartLink}
        </div>

        <div className={styles.split}>
          <div className={styles.gallery}>
            {hasGallery && (
              <div className={styles.thumbsCol}>
                <div className={styles.thumbs} ref={thumbsRef}>
                  {photos.map((src, index) => (
                    <button
                      key={src ?? index}
                      type="button"
                      className={`${styles.thumb} ${index === activeImage ? styles.thumbActive : ''}`}
                      onClick={() => setActiveImage(index)}
                      onMouseEnter={() => setActiveImage(index)}
                      aria-label={`Фото ${index + 1}`}
                    >
                      <img src={src} alt="" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className={styles.main}>
              <LikeButton productId={product.id} product={product} placement="product_page" overlay />
              {product.discountPercent > 0 && (
                <span className={styles.discountBadge}>−{product.discountPercent}%</span>
              )}
              {product.preorder && <span className={styles.preorderBadge}>Предзаказ</span>}
              {image ? (
                <AspectPhoto src={image} alt={product.name} />
              ) : (
                <div className={styles.mainPlaceholder} />
              )}
              {hasGallery && (
                <div className={styles.arrows}>
                  <button
                    type="button"
                    className={styles.arrowBtn}
                    aria-label="Предыдущее фото"
                    onClick={() => setActiveImage((activeImage - 1 + photos.length) % photos.length)}
                  >
                    <ChevronLeft />
                  </button>
                  <button
                    type="button"
                    className={styles.arrowBtn}
                    aria-label="Следующее фото"
                    onClick={() => setActiveImage((activeImage + 1) % photos.length)}
                  >
                    <ChevronRight />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={styles.info}>
            <h1 className={styles.name}>{product.name}</h1>
            {product.description && <p className={styles.description}>{product.description}</p>}
            <div className={styles.prices}>
              <span className={styles.price}>{formatPrice(product.price)}</span>
              {onSale && <span className={styles.crossedPrice}>{formatPrice(product.crossedPrice)}</span>}
            </div>

            {product.preorder && (
              <div className={styles.preorderNote}>
                <p className={styles.preorderNoteTitle}>Это предзаказ</p>
                <p className={styles.preorderNoteText}>
                  Форма ещё в производстве, поэтому сразу после оплаты вы её не получите — отправим,
                  как только она будет готова. Если есть вопросы — напишите нам в Telegram{' '}
                  <a href={TG_ORDER_LINK} target="_blank" rel="noopener noreferrer">
                    @AnyFormsBot
                  </a>
                  .
                </p>
              </div>
            )}

            {isPurchasable(product) ? (
              <>
                <button
                  type="button"
                  className={`${styles.addBtn} ${inCart > 0 ? styles.addBtnAdded : ''}`}
                  onClick={() => handleAdd(product)}
                >
                  {inCart > 0 ? `В корзине ${inCart} шт · добавить ещё` : 'В корзину'}
                </button>
                {inCart > 0 && (
                  <Link to="/shop/cart" className={styles.goToCart}>
                    Перейти в корзину
                  </Link>
                )}
              </>
            ) : (
              <a className={styles.orderLink} href={TG_ORDER_LINK} target="_blank" rel="noopener noreferrer">
                Заказать
              </a>
            )}

            {product.tgLink && (
              <a className={styles.detailsLink} href={product.tgLink} target="_blank" rel="noopener noreferrer">
                Подробнее в Telegram
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketplaceProduct;
