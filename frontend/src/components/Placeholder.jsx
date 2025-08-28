import React from 'react';
import styles from './Placeholder.module.css'; // Создадим стили для этого компонента

const Placeholder = ({ error, debugInfo }) => {
    // Здесь можно указать прямую ссылку на вашего бота
    const botUrl = 'https://t.me/your_bot_name_here';

    const renderDebugValue = (value) => {
        if (typeof value === 'boolean') {
            return value ? '✅' : '❌';
        }
        if (value === undefined || value === null) {
            return '❓';
        }
        return String(value);
    };

    return (
        <div className={styles.placeholderContainer}>
            <div className={styles.placeholderContent}>
                <h1 className={styles.title}>Morpheus Dream</h1>
                <p className={styles.subtitle}>Интерпретация снов</p>
                
                {error ? (
                    <p className={styles.error}>
                        Произошла ошибка инициализации: {error}
                    </p>
                ) : (
                    <p className={styles.instruction}>
                        Для доступа ко всем функциям, пожалуйста, откройте это приложение внутри Telegram.
                    </p>
                )}
                
                {/* Временная диагностическая информация */}
                {debugInfo && Object.keys(debugInfo).length > 0 && (
                    <div className={styles.debug}>
                        <h3>🔍 Диагностика:</h3>
                        <div className={styles.debugInfo}>
                            {Object.entries(debugInfo).map(([key, value]) => {
                                // Не рендерим сложные объекты, только примитивы
                                if (typeof value === 'object' && value !== null) {
                                    return (
                                        <div key={key} className={styles.debugObject}>
                                            <p><strong>{key}:</strong></p>
                                            <div className={styles.debugNestedObject}>
                                                {Object.entries(value).map(([nestedKey, nestedValue]) => (
                                                    <p key={nestedKey}><strong>{nestedKey}:</strong> {renderDebugValue(nestedValue)}</p>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                }
                                return (
                                    <p key={key}><strong>{key}:</strong> {renderDebugValue(value)}</p>
                                );
                            })}
                        </div>
                    </div>
                )}
                
                <a href={botUrl} className={styles.telegramButton}>
                    Открыть в Telegram
                </a>
            </div>
        </div>
    );
};

export default Placeholder;
