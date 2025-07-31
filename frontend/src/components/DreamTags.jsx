import React, { useContext } from 'react';
import styles from './DreamTags.module.css';
import { LocalizationContext } from '../context/LocalizationContext';

const DreamTags = ({ tags = [], accentColor }) => {
  // ✅ Получаем функцию `t` из контекста локализации
  const { t } = useContext(LocalizationContext);

  if (!tags || tags.length === 0) {
    return null;
  }

  return (
    <div>
      {/* ✅ Используем ключ перевода для заголовка */}
      <h2 className={styles.title} style={{ color: accentColor }}>{t('keySymbolBreakdown')}</h2>
      <p className={styles.tagsText}>
        {tags.join(' · ')}
      </p>
    </div>
  );
};

export default DreamTags;