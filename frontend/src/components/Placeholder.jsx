import React, { useState, useEffect } from 'react';
import styles from './Placeholder.module.css'; // Создадим стили для этого компонента

// Хук для перехвата логов
const useCapturedLogs = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const оригинальные = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info,
            debug: console.debug,
        };

        const BATCH_TIME = 1000; // 1 секунда
        let logBatch = [];
        let batchTimeout = null;

        const captureAndForward = (level) => (...args) => {
            // Вызываем оригинальный метод, чтобы логи оставались в консоли
            оригинальные[level](...args);
            
            // Форматируем сообщение для отображения
            const message = args.map(arg => {
                try {
                    if (arg instanceof Error) {
                        return `Error: ${arg.message}\n${arg.stack}`;
                    }
                    if (typeof arg === 'object' && arg !== null) {
                        return JSON.stringify(arg, null, 2);
                    }
                    return String(arg);
                } catch (e) {
                    return '[[не удалось сериализовать аргумент]]';
                }
            }).join(' ');

            const timestamp = new Date().toISOString();
            logBatch.push({ level, message, timestamp });

            // Если таймер уже запущен, ничего не делаем
            if (batchTimeout) return;

            // Запускаем таймер для батчинга
            batchTimeout = setTimeout(() => {
                setLogs(prevLogs => [...prevLogs, ...logBatch]);
                logBatch = []; // Очищаем батч
                batchTimeout = null; // Сбрасываем таймер
            }, BATCH_TIME);
        };
        
        console.log = captureAndForward('log');
        console.error = captureAndForward('error');
        console.warn = captureAndForward('warn');
        console.info = captureAndForward('info');
        console.debug = captureAndForward('debug');

        // Очистка при размонтировании
        return () => {
            clearTimeout(batchTimeout);
            console.log = оригинальные.log;
            console.error = оригинальные.error;
            console.warn = оригинальные.warn;
            console.info = оригинальные.info;
            console.debug = оригинальные.debug;
        };
    }, []);

    return logs;
};


const Placeholder = ({ error, debugInfo }) => {
    const logs = useCapturedLogs();
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
                    <div className={styles.errorBlock}>
                        {/* ✅ Меняем текст в зависимости от типа ошибки */}
                        <h4>{error.includes("аутентификации") ? "Произошла ошибка инициализации" : "Произошла внутренняя ошибка"}</h4>
                        <p className={styles.error}>
                            {error}
                        </p>
                    </div>
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
                
                 {/* Блок для отображения логов */}
                 {logs.length > 0 && (
                    <div className={styles.logsContainer}>
                        <h3>📜 Логи выполнения:</h3>
                        <pre className={styles.logsPre}>
                            {logs.map((log, index) => (
                                <div key={index} className={`${styles.logEntry} ${styles[log.level]}`}>
                                    <span className={styles.logTimestamp}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                    <span className={styles.logLevel}>[{log.level.toUpperCase()}]</span>
                                    <span className={styles.logMessage}>{log.message}</span>
                                </div>
                            )).reverse()}
                        </pre>
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
