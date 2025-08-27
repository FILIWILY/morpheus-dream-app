import React, { useState } from 'react';
import styles from './PsychoanalyticSchools.module.css';
import { Box, Typography, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const schoolExplanations = {
    freud: "Фрейдистский анализ фокусируется на том, как бессознательные влечения, вытесненные желания и детские травмы проявляются в сновидениях через символы и скрытые образы.",
    jung: "Юнгианский анализ рассматривает сны как послания от коллективного бессознательного, исследуя универсальные архетипы (Тень, Анима) и символы, которые ведут к целостности личности.",
    adler: "Адлерианский анализ видит в снах отражение жизненного стиля человека, его борьбы за значимость и преодоление чувства неполценности, анализируя социальный контекст и цели сновидца."
};

const schoolDisplayTitles = {
    freud: "По Фрейду",
    jung: "По Юнгу",
    adler: "По Адлеру"
};

const PsychoanalyticSchools = ({ schools, accentColor }) => {
    const schoolKeys = schools ? Object.keys(schools) : []; // freud, jung, adler
    const [activeKey, setActiveKey] = useState(schoolKeys[0]);
    const [displayedKey, setDisplayedKey] = useState(schoolKeys[0]);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isExplanationVisible, setIsExplanationVisible] = useState(false);
    // New state to track which schools the user has interacted with.
    const [interactedSchools, setInteractedSchools] = useState(() => new Set([schoolKeys[0]]));
    
    const changeSchool = (newKey) => {
        if (newKey !== activeKey) {
            // Add the newly clicked school to the set so it stops blinking.
            setInteractedSchools(prev => new Set(prev).add(newKey));

            setActiveKey(newKey); // Update active tab immediately for responsiveness
            setIsAnimating(true);
            setTimeout(() => {
                setDisplayedKey(newKey); // Change content after a short delay
                setIsAnimating(false);
            }, 150); // Fast animation duration
        }
    };

    if (!schools || schoolKeys.length === 0) {
        return null;
    }
    
    const displayedSchoolData = schools[displayedKey];
    
    return (
        <Box className={styles.container}>
            <Box className={styles.selector}>
                {schoolKeys.map(key => {
                    const isActive = key === activeKey;
                    const hasInteracted = interactedSchools.has(key);
                    const shouldBlink = !isActive && !hasInteracted;

                    return (
                        <Typography 
                            key={key}
                            className={`${styles.selectorItem} ${isActive ? styles.active : ''} ${shouldBlink ? styles.blinking : ''}`}
                            style={{ color: isActive ? accentColor : 'var(--text-secondary)' }}
                            onClick={() => changeSchool(key)}
                        >
                            {schoolDisplayTitles[key] || schools[key].title}
                        </Typography>
                    );
                })}
            </Box>
            
            <Box className={styles.explanationToggle} onClick={() => setIsExplanationVisible(!isExplanationVisible)}>
                <IconButton className={`${styles.expandIcon} ${isExplanationVisible ? styles.expanded : ''}`}>
                    <ExpandMoreIcon />
                </IconButton>
                <Typography variant="caption" className={styles.explanationTitle}>
                    О подходе школы
                </Typography>
            </Box>

            {isExplanationVisible && (
                 <Box className={styles.explanationContent}>
                    <Typography variant="body2" className={styles.explanationText}>
                        {schoolExplanations[activeKey]}
                    </Typography>
                </Box>
            )}
            
            <Box className={`${styles.content} ${isAnimating ? styles.fading : ''}`} key={displayedKey}>
                <Typography className={styles.contentText}>
                    {displayedSchoolData.content}
                </Typography>
            </Box>
        </Box>
    );
};

export default PsychoanalyticSchools;
