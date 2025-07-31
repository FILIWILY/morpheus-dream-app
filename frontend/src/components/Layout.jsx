import React from 'react';
import { Outlet } from 'react-router-dom';
import styles from './Layout.module.css';
import BottomNav from './BottomNav';

const Layout = () => {
  return (
    <div className={styles.layoutContainer}>
      <main className={styles.mainContent}>
        <Outlet /> 
      </main>
      
      <nav className={styles.nav}>
        <BottomNav />
      </nav>
    </div>
  );
};

export default Layout;