import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import styles from './Layout.module.css';
import BottomNav from './BottomNav';
import SettingsDrawer from './SettingsDrawer';

const Layout = () => {
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Hide bottom nav on interpretation pages
  const shouldHideNav = location.pathname.startsWith('/interpretation');

  const mainContentClasses = `
    ${styles.mainContent} 
    ${shouldHideNav ? styles.mainContentNoNav : ''}
  `;

  return (
    <div className={styles.layoutContainer}>
      <SettingsDrawer open={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      
      <main className={mainContentClasses}>
        {/* Pass the drawer opener function to child routes */}
        <Outlet context={{ openDrawer: () => setIsDrawerOpen(true) }} /> 
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