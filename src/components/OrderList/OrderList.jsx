import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getOrdersWithoutTracker, getDeliveringOrders, getCreatedOrders, readyForPickup } from '../../services/api';
import { isPickup } from '../../services/customProducts';
import OrderCard from '../OrderCard/OrderCard';
import TrackerModal from '../TrackerModal/TrackerModal';
import styles from './OrderList.module.css';

const OrderList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isCommentModal, setIsCommentModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  // Определяем активный режим из URL
  const getActiveModeFromPath = () => {
    const path = location.pathname;
    if (path === '/orders/without-tracker') return 'without-tracker';
    if (path === '/orders/created') return 'created';
    if (path === '/orders/delivering') return 'delivering';
    // Дефолтно для /orders
    return 'without-tracker';
  };

  const activeMode = getActiveModeFromPath();

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      let data;
      if (activeMode === 'without-tracker') {
        data = await getOrdersWithoutTracker();
      } else if (activeMode === 'created') {
        data = await getCreatedOrders();
      } else if (activeMode === 'delivering') {
        data = await getDeliveringOrders();
      }
      setOrders(data);
    } catch (error) {
      toast.error('Ошибка при загрузке заказов');
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  }, [activeMode]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest(`.${styles.menuContainer}`)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  const handleModeChange = (mode) => {
    setMenuOpen(false);
    if (mode === 'without-tracker') {
      navigate('/orders/without-tracker');
    } else if (mode === 'created') {
      navigate('/orders/created');
    } else if (mode === 'delivering') {
      navigate('/orders/delivering');
    }
  };

  const handleOpenModal = (leadId, isComment = false) => {
    setSelectedOrder(leadId);
    setIsCommentModal(isComment);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
    setIsCommentModal(false);
  };

  const handleTrackerSet = () => {
    loadOrders();
    handleCloseModal();
  };

  const handlePickupReady = async (order) => {
    if (!window.confirm('Точно ли заказ готов? Клиенту будет отправлено уведомление, что его можно забрать.')) {
      return;
    }
    try {
      await readyForPickup(order.leadId);
      toast.success('Заказ готов к выдаче, клиент получит уведомление');
      loadOrders();
    } catch (error) {
      toast.error(error.message || 'Не удалось отметить самовывоз');
    }
  };

  const filteredOrders = orders.filter((order) => {
    const query = searchQuery.toLowerCase();
    const matchesBasicInfo = 
      order.contactName?.toLowerCase().includes(query) ||
      order.contactPhone?.includes(query) ||
      order.leadId?.toString().includes(query);
    
    const matchesProductType = order.items.some((item) =>
      item.productName.toLowerCase().includes(query)
    );
    
    return matchesBasicInfo || matchesProductType;
  });

  // Подсчет количества товаров по типам
  const getProductCounts = () => {
    const counts = {};
    filteredOrders.forEach((order) => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item) => {
          if (item.productName && item.quantity) {
            const productName = item.productName;
            counts[productName] = (counts[productName] || 0) + item.quantity;
          }
        });
      }
    });
    return counts;
  };

  const productCounts = getProductCounts();

  const getModeTitle = () => {
    switch (activeMode) {
      case 'without-tracker':
        return 'без трекера';
      case 'created':
        return 'к отправке (накладные)';
      case 'delivering':
        return 'доставляются';
      default:
        return 'без трекера';
    }
  };

  return (
    <div className={styles.orderList}>
      <div className={styles.headerSafeArea} aria-hidden="true" />
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <img
            className={styles.catImg}
            src="https://cataas.com/cat?width=82&height=82"
            alt="Случайный котик"
            width={41}
            height={41}
            loading="lazy"
            decoding="async"
          />
          <span className={styles.logoLink} aria-label="anyforms">
            <img
              className={styles.logo}
              src="/anyforms_logo_new_white.svg"
              alt=""
              width={180}
              height={41}
              decoding="async"
            />
          </span>
          <button className={styles.customLink} onClick={() => navigate('/orders/custom')}>
            под заказ →
          </button>
        </div>
      </header>

      <div className={styles.modeTabsWrap}>
        <div className={styles.modeTabs}>
          <button
            className={`${styles.modeTab} ${activeMode === 'without-tracker' ? styles.modeTabActive : ''}`}
            onClick={() => handleModeChange('without-tracker')}
          >
            без трекера
          </button>
          <button
            className={`${styles.modeTab} ${activeMode === 'created' ? styles.modeTabActive : ''}`}
            onClick={() => handleModeChange('created')}
          >
            к отправке
          </button>
          <button
            className={`${styles.modeTab} ${activeMode === 'delivering' ? styles.modeTabActive : ''}`}
            onClick={() => handleModeChange('delivering')}
          >
            доставляются
          </button>
        </div>
      </div>

      {!loading && Object.keys(productCounts).length > 0 && (
        <div className={styles.summaryBox}>
          <h2 className={styles.summaryTitle}>Саммари: {getModeTitle()}</h2>
          <div className={styles.summaryContent}>
            {Object.entries(productCounts).map(([productName, count]) => (
              <div key={productName} className={styles.summaryItem}>
                <span className={styles.summaryProductName}>{productName}</span>
                <span className={styles.summaryCount}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Поиск по имени, телефону, ID сделки или типу товара..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Загрузка заказов...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>
            {searchQuery ? 'Заказы не найдены' : `Нет заказов: ${getModeTitle()}`}
          </p>
        </div>
      ) : (
        <div className={styles.cardsContainer}>
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.leadId}
              order={order}
              onAddTracker={activeMode === 'without-tracker' && !isPickup(order) ? () => handleOpenModal(order.leadId, false) : null}
              onPickupReady={activeMode === 'without-tracker' && isPickup(order) ? () => handlePickupReady(order) : null}
              onAddComment={activeMode === 'created' || activeMode === 'delivering' ? () => handleOpenModal(order.leadId, true) : null}
            />
          ))}
        </div>
      )}

      {showModal && (
        <TrackerModal
          leadId={selectedOrder}
          onClose={handleCloseModal}
          onSuccess={handleTrackerSet}
          commentOnly={isCommentModal}
        />
      )}
    </div>
  );
};

export default OrderList;
