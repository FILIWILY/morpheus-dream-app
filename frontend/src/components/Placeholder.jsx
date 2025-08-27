import React from 'react';
import styles from './Placeholder.module.css'; // Создадим стили для этого компонента

const Placeholder = ({ error }) => {
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
                
                <a href={botUrl} className={styles.telegramButton}>
                    Открыть в Telegram
                </a>
            </div>
        </div>
    );
};

export default Placeholder;
