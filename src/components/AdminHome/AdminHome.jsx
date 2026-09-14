import React from 'react';
import { useOutletContext } from 'react-router-dom';
import styles from './AdminHome.module.css';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Доброе утро';
  if (hour >= 12 && hour < 17) return 'Добрый день';
  if (hour >= 17 && hour < 23) return 'Добрый вечер';
  return 'Доброй ночи';
};

const AdminHome = () => {
  const name = useOutletContext()?.name;
  return (
  <div className={styles.wrap}>
    <h1 className={styles.greeting}>
      {getGreeting()}
      {name ? `, ${name}` : ''}
    </h1>
    <img
      className={styles.cat}
      src="https://cataas.com/cat?width=480&height=480"
      alt="Случайный котик"
      width={240}
      height={240}
      decoding="async"
    />
  </div>
  );
};

export default AdminHome;
