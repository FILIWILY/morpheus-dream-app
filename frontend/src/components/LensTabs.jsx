import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './LensTabs.module.css';

// Жесткий порядок для сетки 2x2
const LENS_ORDER = ['dreambook', 'psychoanalytic', 'astrology', 'tarot'];

const LensTabs = ({ lenses, activeLens, setActiveLens, accentColor }) => {
    const { t } = useTranslation();

    // Сортируем линзы согласно жесткому порядку LENS_ORDER
    const sortedLenses = useMemo(() => {
        return LENS_ORDER.map(key => ({
            key,
            ...lenses[key]
        })).filter(lens => lens.title); // Отфильтровываем линзы, которые еще не загрузились
    }, [lenses]);

    const renderTab = (lens) => (
        <button
            key={lens.key}
            className={`${styles.tabBtn} ${activeLens === lens.key ? styles.active : ''}`}
            onClick={() => setActiveLens(lens.key)}
            style={{
                // Передаем акцентный цвет в CSS-переменную для активного состояния
                color: activeLens === lens.key ? accentColor : 'var(--text-secondary)'
            }}
        >
            {lens.title}
        </button>
    );

    // Делим отсортированный массив на два ряда
    const firstRow = sortedLenses.slice(0, 2);
    const secondRow = sortedLenses.slice(2, 4);

    return (
        <div className={styles.tabsContainer}>
            <div className={styles.tabsRow}>
                {firstRow.map(renderTab)}
            </div>
            {secondRow.length > 0 && (
                <div className={styles.tabsRow}>
                    {secondRow.map(renderTab)}
                </div>
            )}
        </div>
    );
};

export default LensTabs;