import React from 'react';
import styles from './ContentBlock.module.css';

const ContentBlock = ({ title, children }) => {
  // Компонент не будет рендериться, если у него нет контента
  if (!children) {
    return null;
  }

  return (
    <section className={styles.block}>
      {title && <h2 className={styles.title}>{title}</h2>}
      <div className={styles.content}>
        {children}
      </div>
    </section>
  );
};

export default ContentBlock;