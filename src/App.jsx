import React from 'react';
import OrderList from './components/OrderList/OrderList';
import styles from './App.module.css';

function App() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>any forms</h1>
      </header>
      <main className={styles.main}>
        <OrderList />
      </main>
    </div>
  );
}

export default App;



