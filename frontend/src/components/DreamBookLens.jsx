import React from 'react';
import styles from './DreamBookLens.module.css';

const DreamBookLens = ({ content, highlightWords, accentColor, metadata }) => {
    if (!content) {
        return (
            <div className={styles.lensContentFlow}>
                <div className={styles.flowParagraph}>
                    <p className={styles.flowText}>{content || 'Нет данных'}</p>
                </div>
            </div>
        );
    }

    const highlightStyle = {
        color: accentColor,
        fontWeight: 'bold',
    };

    // ВАРИАНТ 1: Если LLM вернул текст с **звёздочками**
    // Ищем все слова между **...**
    const starsRegex = /\*\*([^*]+)\*\*/g;
    let processedContent = content;
    const wordsInStars = [];
    
    // Извлекаем слова в **звёздочках** и удаляем сами звёздочки
    processedContent = content.replace(starsRegex, (match, word) => {
        wordsInStars.push(word.toLowerCase());
        return word; // Удаляем звёздочки, оставляем только слово
    });

    // Объединяем слова из highlightWords и wordsInStars
    const allHighlightWords = [...new Set([
        ...(highlightWords || []),
        ...wordsInStars
    ])];

    // Если нет слов для выделения, просто возвращаем текст
    if (allHighlightWords.length === 0) {
        processedContent = content.replace(/\*\*/g, ''); // Убираем звёздочки
    }

    // Создаем регулярное выражение для поиска всех ключевых слов
    const escapedWords = allHighlightWords.map(word => 
        word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Экранируем спецсимволы
    );
    const regex = new RegExp(`\\b(${escapedWords.join('|')})\\b`, 'gi');

    // Разбиваем текст на части (текст и выделенные слова)
    const parts = processedContent.split(regex);

    return (
        <div className={styles.lensContentFlow}>
            {/* Метаданные: фаза Луны, знак Луны, день недели */}
            {metadata && (
                <div className={styles.metadata}>
                    <span className={styles.metadataItem}>
                        🌙 {metadata.moonPhase} в {metadata.moonEmoji} {metadata.moonSign}
                    </span>
                    <span className={styles.metadataItem}>
                        📅 {metadata.weekday}
                    </span>
                </div>
            )}

            <div className={styles.flowParagraph}>
                <p className={styles.flowText}>
                    {parts.map((part, index) => {
                        // Проверяем, совпадает ли часть с одним из ключевых слов (без учета регистра)
                        const isHighlight = highlightWords && highlightWords.some(word => word.toLowerCase() === part.toLowerCase());
                        
                        if (isHighlight) {
                            return <span key={index} style={highlightStyle}>{part}</span>;
                        }

                        // Для обычного текста, сохраняем переносы строк
                        return (
                            <React.Fragment key={index}>
                                {part.split(/(\n)/g).map((line, i) =>
                                    line === '\n' ? <br key={i} /> : line
                                )}
                            </React.Fragment>
                        );
                    })}
                </p>
            </div>
        </div>
    );
};

export default DreamBookLens;

