import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { isMarketplaceCheckoutEnabled, MARKETPLACE_ORDER_TG_LINK } from '../../config/features';
import styles from './checkout.module.css';

const formatPrice = (value) => `${value.toLocaleString('ru-RU')} ₽`;

const MarketplaceCart = () => {
  const { items, setQty, remove, total, count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const checkoutEnabled = isMarketplaceCheckoutEnabled(location.search);

  return (
    <div className={styles.page} id="top">
      <div className={styles.inner}>
        <div className={styles.topBar}>
          <Link className={styles.back} to="/shop">
            ← В магазин
          </Link>
        </div>
        <span className={styles.eyebrow}>Корзина</span>
        <h1 className={styles.title}>Ваш заказ</h1>

        {items.length === 0 ? (
          <div className={styles.centered}>
            <p className={styles.centeredText}>В корзине пока пусто.</p>
            <Link className={styles.primaryLink} to="/shop">
              <span>Перейти к товарам</span>
              <span className={styles.ctaArrow} aria-hidden="true">→</span>
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.cartList}>
              {items.map((item) => (
                <div key={item.id} className={styles.cartRow}>
                  {item.photo ? (
                    <img className={styles.cartPhoto} src={item.photo} alt={item.name} />
                  ) : (
                    <div className={styles.cartPhoto} />
                  )}
                  <div className={styles.cartInfo}>
                    <p className={styles.cartName}>{item.name}</p>
                    <div className={styles.cartUnit}>{formatPrice(item.price)} / шт</div>
                  </div>
                  <div className={styles.qty}>
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      onClick={() => setQty(item.id, item.quantity - 1)}
                      aria-label="Уменьшить количество"
                    >
                      −
                    </button>
                    <span className={styles.qtyVal}>{item.quantity}</span>
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      onClick={() => setQty(item.id, item.quantity + 1)}
                      aria-label="Увеличить количество"
                    >
                      +
                    </button>
                  </div>
                  <div className={styles.rowPrice}>{formatPrice(item.price * item.quantity)}</div>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => remove(item.id)}
                    aria-label="Удалить из корзины"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>Товары ({count})</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Доставка СДЭК</span>
                <span>на ПВЗ при получении</span>
              </div>
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                <span>К оплате сейчас</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            {checkoutEnabled ? (
              <button
                type="button"
                className={styles.payBtn}
                onClick={() => navigate(`/shop/checkout${location.search}`)}
              >
                <span>Оформить заказ</span>
                <span className={styles.ctaArrow} aria-hidden="true">→</span>
              </button>
            ) : (
              <>
                <a
                  className={styles.payBtn}
                  href={MARKETPLACE_ORDER_TG_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>Заказать в Telegram</span>
                  <span className={styles.ctaArrow} aria-hidden="true">→</span>
                </a>
                <p className={styles.support}>
                  Онлайн-оплата скоро появится. Пока напишите менеджеру в Telegram — он оформит заказ.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MarketplaceCart;
