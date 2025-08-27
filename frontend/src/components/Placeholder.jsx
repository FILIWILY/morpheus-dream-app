import React from 'react';
import styles from './Placeholder.module.css'; // Создадим стили для этого компонента

const Placeholder = ({ error, debugInfo }) => {
    // Здесь можно указать прямую ссылку на вашего бота
    const botUrl = 'https://t.me/your_bot_name_here';

    return (
        <div className={styles.placeholderContainer}>
            <div className={styles.placeholderContent}>
                <h1 className={styles.title}>Morpheus Dream</h1>
                <p className={styles.subtitle}>Интерпретация снов</p>
                
                {error ? (
                    <>
                        <p className={styles.error}>
                            Произошла ошибка: {error}
                        </p>
                        <p className={styles.instruction}>
                            Попробуйте перезагрузить страницу или обратитесь к администратору.
                        </p>
                    </>
                ) : (
                    <p className={styles.instruction}>
                        Для доступа ко всем функциям, пожалуйста, откройте это приложение внутри Telegram.
                    </p>
                )}
                
                {/* Временная диагностическая информация */}
                {debugInfo && (
                    <div className={styles.debug}>
                        <h3>🔍 Диагностика:</h3>
                        <div className={styles.debugInfo}>
                            <p><strong>URL:</strong> {debugInfo.url}</p>
                            <p><strong>Referrer:</strong> {debugInfo.referrer || 'нет'}</p>
                            <p><strong>User Agent:</strong> {debugInfo.userAgent}</p>
                            <p><strong>Telegram WebApp:</strong> {debugInfo.hasTelegramWebApp ? '✅' : '❌'}</p>
                            <p><strong>Telegram Params:</strong> {debugInfo.hasTelegramParams ? '✅' : '❌'}</p>
                            <p><strong>Telegram Referrer:</strong> {debugInfo.hasTelegramReferrer ? '✅' : '❌'}</p>
                            <p><strong>Telegram User Agent:</strong> {debugInfo.isTelegramUserAgent ? '✅' : '❌'}</p>
                            <p><strong>Telegram Proxy:</strong> {debugInfo.hasTelegramProxy ? '✅' : '❌'}</p>
                            <p><strong>Final Decision:</strong> {debugInfo.isTelegramEnvironment ? '✅ Telegram' : '❌ Not Telegram'}</p>
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
