import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from './Layout.module.css';
import BottomNav from './BottomNav';

const Layout = () => {
  return (
    <div className={styles.layoutContainer}>
      {/* Эта секция будет растягиваться, занимая все свободное место */}
      <main className={styles.mainContent}>
        <Outlet /> 
      </main>
      
      {/* Эта секция будет всегда внизу */}
      <nav className={styles.nav}>
        <BottomNav />
      </nav>
    </div>
  );
};

export default Layout;