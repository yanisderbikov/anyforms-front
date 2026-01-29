import React, { useState, useEffect } from 'react';
import { getItems } from '../../services/itemsService';
import ProductCard from '../ProductCard/ProductCard';
import styles from './Marketplace.module.css';

const Marketplace = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Каталог</h1>
      <ul className={styles.grid}>
        {items.map((item) => (
          <li key={item.id} className={styles.gridItem}>
            <ProductCard item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Marketplace;
