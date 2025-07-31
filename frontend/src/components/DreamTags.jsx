import React, { useContext } from 'react';
import styles from './DreamTags.module.css';
import { LocalizationContext } from '../context/LocalizationContext';

const DreamTags = ({ tags = [] }) => {
  const { t } = useContext(LocalizationContext);

  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className={styles.title}>{t('keySymbolBreakdown')}</h2>
      <p className={styles.tagsText}>
        {tags.join(' · ')}
      </p>
    </div>
  );
};

export default DreamTags;