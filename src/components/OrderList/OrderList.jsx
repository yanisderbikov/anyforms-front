import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { getOrdersWithoutTracker } from '../../services/api';
import OrderCard from '../OrderCard/OrderCard';
import TrackerModal from '../TrackerModal/TrackerModal';
import styles from './OrderList.module.css';

const OrderList = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await getOrdersWithoutTracker();
      setOrders(data);
    } catch (error) {
      toast.error('Ошибка при загрузке заказов');
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
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
    return (
      order.contactName.toLowerCase().includes(query) ||
      order.contactPhone.includes(query) ||
      order.leadId.toString().includes(query)
    );
  });

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Загрузка заказов...</p>
      </div>
    );
  }

  return (
    <div className={styles.orderList}>
      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Поиск по имени, телефону или ID сделки..."
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
            {searchQuery ? 'Заказы не найдены' : 'Нет заказов без трекера'}
          </p>
        </div>
      ) : (
        <div className={styles.cardsContainer}>
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.leadId}
              order={order}
              onAddTracker={() => handleOpenModal(order.leadId)}
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



