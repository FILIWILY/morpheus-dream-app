import React, { useRef, useEffect, useState } from 'react';
import styles from './LensTabs.module.css';

const LensTabs = ({ lenses, activeLens, setActiveLens, accentColor }) => {
    const tabsRef = useRef([]);
    const [indicatorStyle, setIndicatorStyle] = useState({});

    useEffect(() => {
        const activeIndex = Object.keys(lenses).findIndex(key => key === activeLens);
        const activeTabNode = tabsRef.current[activeIndex];
        
        if (activeTabNode) {
            setIndicatorStyle({
                left: activeTabNode.offsetLeft,
                width: activeTabNode.offsetWidth,
                backgroundColor: accentColor, 
            });
        }
    }, [activeLens, lenses, accentColor]);

    return (
        <div className={styles.tabsContainer}>
            {Object.keys(lenses).map((key, index) => (
                <button
                    key={key}
                    ref={el => tabsRef.current[index] = el}
                    className={`${styles.tabButton} ${activeLens === key ? styles.active : ''}`}
                    onClick={() => setActiveLens(key)}
                    style={{ color: activeLens === key ? accentColor : 'var(--text-secondary)' }}
                >
                    {lenses[key].title}
                </button>
            ))}
            <div className={styles.indicator} style={indicatorStyle}></div>
        </div>
    );
};

export default LensTabs;