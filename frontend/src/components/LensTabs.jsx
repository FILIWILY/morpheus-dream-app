import React, { useRef, useEffect, useState } from 'react';
import styles from './LensTabs.module.css';

const LensTabs = ({ lenses, activeLens, setActiveLens, accentColor }) => {
    // Массив для хранения ссылок на DOM-элементы кнопок
    const tabsRef = useRef([]);
    // Состояние для хранения стилей индикатора (его ширина и отступ слева)
    const [indicatorStyle, setIndicatorStyle] = useState({});

    useEffect(() => {
        const activeIndex = Object.keys(lenses).findIndex(key => key === activeLens);
        const activeTabNode = tabsRef.current[activeIndex];
        
        // Если активная вкладка найдена, вычисляем ее положение и размеры
        if (activeTabNode) {
            setIndicatorStyle({
                left: activeTabNode.offsetLeft,
                width: activeTabNode.offsetWidth,
                backgroundColor: accentColor, 
            });
        }
    }, [activeLens, lenses, accentColor]); // Пересчитываем при смене вкладки или цвета

    return (
        <div className={styles.tabsContainer}>
            {Object.keys(lenses).map((key, index) => (
                <button
                    key={key}
                    // Сохраняем ссылку на элемент кнопки в массив
                    ref={el => tabsRef.current[index] = el}
                    className={`${styles.tabButton} ${activeLens === key ? styles.active : ''}`}
                    onClick={() => setActiveLens(key)}
                    // Активной вкладке задаем акцентный цвет текста
                    style={{ color: activeLens === key ? accentColor : 'var(--text-secondary)' }}
                >
                    {lenses[key].title}
                </button>
            ))}
            {/* Тот самый анимированный индикатор-подчеркивание */}
            <div className={styles.indicator} style={indicatorStyle}></div>
        </div>
    );
};

export default LensTabs;