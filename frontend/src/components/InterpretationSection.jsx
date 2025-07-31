import React from 'react';
import styles from './InterpretationSection.module.css';

const InterpretationSection = ({ title, children, accentColor }) => {
  if (!children) return null;
  return (
    <section className={styles.section}>
      <h2 className={styles.title} style={{ color: accentColor }}>{title}</h2>
      <div className={styles.content}>{children}</div>
    </section>
  );
};

export default InterpretationSection;