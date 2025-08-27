import React, { useState } from 'react';
import styles from './PsychoanalyticRecommendations.module.css';
import { Box, Typography, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const PsychoanalyticRecommendations = ({ recommendation, accentColor }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!recommendation || !recommendation.content) {
        return null;
    }

    const customStyles = {
        '--lens-accent-color': accentColor,
    };

    return (
        <Box className={styles.summaryBlock} style={customStyles}>
            <Box className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
                <IconButton className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
                    <ExpandMoreIcon />
                </IconButton>
                <Typography variant="h6" component="h3" className={styles.summaryTitle}>
                    {recommendation.title}
                </Typography>
            </Box>
            
            <Box className={`${styles.collapsibleContent} ${isExpanded ? styles.expanded : ''}`}>
                <Typography variant="body1" component="div" className={styles.summaryContent}>
                    {recommendation.content.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                    ))}
                </Typography>
            </Box>
        </Box>
    );
};

export default PsychoanalyticRecommendations;
