import React, { useRef, useEffect } from 'react';
import styles from './LensTabs.module.css';

const LensTabs = ({ lenses, activeLens, setActiveLens, accentColor }) => {
    const tabsRef = useRef([]);
    const desiredOrder = ['psychoanalytic', 'tarot', 'astrology'];

    useEffect(() => {
        // This effect can be kept for potential future logic if needed,
        // but for now, it's empty as styling is handled by CSS.
    }, [activeLens, lenses, accentColor]);

    const lensKeys = Object.keys(lenses).sort((a, b) => {
        const indexA = desiredOrder.indexOf(a);
        const indexB = desiredOrder.indexOf(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    const psychoanalyticKey = lensKeys.find(key => key === 'psychoanalytic');
    const otherKeys = lensKeys.filter(key => key !== 'psychoanalytic');

    return (
        <div className={styles.tabsContainer}>
            {psychoanalyticKey && (
                <div className={styles.tabsRow}>
                    <button
                        key={psychoanalyticKey}
                        ref={el => tabsRef.current[0] = el}
                        className={`${styles.tabBtn} ${styles.fullWidth} ${activeLens === psychoanalyticKey ? styles.active : ''}`}
                        onClick={() => setActiveLens(psychoanalyticKey)}
                        style={{ color: activeLens === psychoanalyticKey ? accentColor : 'var(--text-secondary)' }}
                    >
                        {lenses[psychoanalyticKey].title}
                    </button>
                </div>
            )}
            {otherKeys.length > 0 && (
                <div className={styles.tabsRow}>
                    {otherKeys.map((key, index) => (
                        <button
                            key={key}
                            ref={el => tabsRef.current[index + 1] = el}
                            className={`${styles.tabBtn} ${styles.halfWidth} ${activeLens === key ? styles.active : ''}`}
                            onClick={() => setActiveLens(key)}
                            style={{ color: activeLens === key ? accentColor : 'var(--text-secondary)' }}
                        >
                            {lenses[key].title}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LensTabs;