import React, { useRef, useEffect, useState } from 'react';
import styles from './LensTabs.module.css';

const LensTabs = ({ lenses, activeLens, setActiveLens, accentColor }) => {
    const tabsRef = useRef([]);

    useEffect(() => {
        // Logic for setting active tab style might still be needed if not handled purely by CSS borders
        // For now, removing the old indicator logic entirely.
    }, [activeLens, lenses, accentColor]);

    const lensKeys = Object.keys(lenses);
    // Split lenses into two rows. Assuming a maximum of 4 lenses, 2 per row.
    // This can be made more dynamic if needed, but for the provided example, this works.
    const row1LensKeys = lensKeys.slice(0, 2);
    const row2LensKeys = lensKeys.slice(2, 4); // Handles cases with less than 4 or more than 2 in the second row

    return (
        <div className={styles.tabsContainer}>
            <div className={styles.tabsRow}>
                {row1LensKeys.map((key, index) => (
                    <button
                        key={key}
                        ref={el => tabsRef.current[index] = el}
                        className={`${styles.tabBtn} ${activeLens === key ? styles.active : ''}`}
                        onClick={() => setActiveLens(key)}
                        style={{ color: activeLens === key ? accentColor : 'var(--text-secondary)' }}
                    >
                        {lenses[key].title}
                    </button>
                ))}
            </div>
            {row2LensKeys.length > 0 && (
                <div className={styles.tabsRow}>
                    {row2LensKeys.map((key, index) => (
                        <button
                            key={key}
                            ref={el => tabsRef.current[row1LensKeys.length + index] = el} // Adjust index for second row
                            className={`${styles.tabBtn} ${activeLens === key ? styles.active : ''}`}
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