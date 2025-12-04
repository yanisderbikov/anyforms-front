import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getOrdersWithoutTracker, getDeliveringOrders, getCreatedOrders } from '../../services/api';
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

  const handleOpenModal = (leadId) => {
    setSelectedOrder(leadId);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const handleTrackerSet = () => {
    loadOrders();
    handleCloseModal();
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

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Загрузка заказов...</p>
      </div>
    );
  }

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
      <header className={styles.header}>
        <h1 className={styles.title}>any forms</h1>
        <div className={styles.menuContainer}>
          <button
            className={`${styles.burgerButton} ${menuOpen ? styles.burgerButtonOpen : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Меню"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
          {menuOpen && (
            <div className={styles.dropdownMenu}>
              <button
                className={`${styles.menuItem} ${activeMode === 'without-tracker' ? styles.menuItemActive : ''}`}
                onClick={() => handleModeChange('without-tracker')}
              >
                1 - без трекера
              </button>
              <button
                className={`${styles.menuItem} ${activeMode === 'created' ? styles.menuItemActive : ''}`}
                onClick={() => handleModeChange('created')}
              >
                2 - к отправке (накладные)
              </button>
              <button
                className={`${styles.menuItem} ${activeMode === 'delivering' ? styles.menuItemActive : ''}`}
                onClick={() => handleModeChange('delivering')}
              >
                3 - доставляются
              </button>
            </div>
          )}
        </div>
      </header>

      {Object.keys(productCounts).length > 0 && (
        <div className={styles.summaryBox}>
          <h2 className={styles.summaryTitle}>Саммари</h2>
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
        <button onClick={loadOrders} className={styles.refreshButton}>
          Обновить
        </button>
      </div>

      {filteredOrders.length === 0 ? (
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
              onAddTracker={activeMode === 'without-tracker' ? () => handleOpenModal(order.leadId) : null}
            />
          ))}
        </div>
      )}

      {showModal && (
        <TrackerModal
          leadId={selectedOrder}
          onClose={handleCloseModal}
          onSuccess={handleTrackerSet}
        />
      )}
    </div>
  );
};

export default OrderList;



