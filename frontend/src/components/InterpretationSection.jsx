import React from 'react';
import styles from './InterpretationSection.module.css';

const InterpretationSection = ({ title, children }) => {
  if (!children) return null;
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.content}>{children}</div>
    </section>
  );
};

export default InterpretationSection;