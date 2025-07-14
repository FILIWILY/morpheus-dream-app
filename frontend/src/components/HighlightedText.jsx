import React from 'react';
import styles from './HighlightedText.module.css';

const HighlightedText = ({ text = '', words = [] }) => {
  if (!words || !words.length || !text) {
    return <p>{text}</p>;
  }

  // Создаем безопасное регулярное выражение, которое найдет все ключевые слова
  // 'i' флаг - для поиска без учета регистра, 'g' - для глобального поиска
  const escapedWords = words.map(word => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`(${escapedWords.join('|')})`, 'gi');
  
  // Проверяем, есть ли вообще совпадения, чтобы не разбивать строку без надобности
  if (!text.match(regex)) {
    return <p>{text}</p>;
  }

  const parts = text.split(regex);

  return (
    <p>
      {parts.map((part, index) =>
        (escapedWords.length > 0 && regex.test(part)) ? (
          <span key={index} className={styles.highlight}>
            {part}
          </span>
        ) : (
          part
        )
      )}
    </p>
  );
};

export default HighlightedText;