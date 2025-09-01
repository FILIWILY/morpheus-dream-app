import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import styles from './Layout.module.css';
import BottomNav from './BottomNav';

const Layout = () => {
  const location = useLocation();

  // Hide bottom nav on interpretation pages
  const shouldHideNav = location.pathname.startsWith('/interpretation');

  const mainContentClasses = `
    ${styles.mainContent} 
    ${shouldHideNav ? styles.mainContentNoNav : ''}
  `;

  return (
    <div className={styles.layoutContainer}>
      <main className={mainContentClasses}>
        <Outlet /> 
      </main>
      
      {!shouldHideNav && (
        <nav className={styles.nav}>
          <BottomNav />
        </nav>
      )}
    </div>
  );
};

export default Layout;