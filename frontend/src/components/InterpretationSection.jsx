import React from 'react';
import styles from './InterpretationSection.module.css';
import { IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const InterpretationSection = ({ title, children, accentColor, onBackClick }) => {
  if (!children) return null;
  return (
    <section className={styles.section}>
      <div className={styles.titleContainer}>
        {onBackClick && (
          <IconButton 
            edge="start" 
            color="inherit" 
            onClick={onBackClick} 
            className={styles.backButton}
          >
            <ArrowBackIcon />
          </IconButton>
        )}
        <h2 className={styles.title} style={{ color: accentColor }}>{title}</h2>
      </div>
      <div className={styles.content}>{children}</div>
    </section>
  );
};

export default InterpretationSection;