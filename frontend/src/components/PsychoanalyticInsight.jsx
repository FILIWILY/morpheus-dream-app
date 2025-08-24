import React from 'react';
import styles from './PsychoanalyticInsight.module.css';
import { Box, Typography } from '@mui/material';

const InsightPoint = ({ accentColor }) => {
    const pointStyle = {
        backgroundColor: accentColor,
        boxShadow: `0 0 8px 1px ${accentColor}`,
    };
    return <div className={styles.insightPoint} style={pointStyle}></div>;
};

const PsychoanalyticInsight = ({ insights, accentColor }) => {
    if (!insights || insights.length === 0) {
        return null;
    }

    return (
        <Box className={styles.insightsContainer}>
            <Typography variant="h5" className={styles.mainTitle}>
                В вашем сне прослеживается:
            </Typography>
            {insights.map((insight, index) => (
                <Box key={index} className={styles.insightRow}>
                    <InsightPoint accentColor={accentColor} />
                    <Box className={styles.insightTextContainer}>
                        <Typography variant="h6" className={styles.insightTitle} style={{ color: accentColor }}>
                            {insight.name}
                        </Typography>
                        <Typography variant="body2" className={styles.insightDescription}>
                            {insight.description}
                        </Typography>
                    </Box>
                </Box>
            ))}
        </Box>
    );
};

export default PsychoanalyticInsight;
