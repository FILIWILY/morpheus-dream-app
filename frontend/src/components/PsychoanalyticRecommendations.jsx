import React from 'react';
import styles from './PsychoanalyticRecommendations.module.css';
import { Card, CardContent, Typography } from '@mui/material';

const PsychoanalyticRecommendations = ({ recommendations, accentColor }) => {
    if (!recommendations || recommendations.length === 0) {
        return null;
    }

    return (
        <div className={styles.recommendationsContainer}>
            <h3 className={styles.mainTitle} style={{ color: accentColor }}>
                Рекомендации и выводы
            </h3>
            {recommendations.map((rec, index) => (
                <Card key={index} className={styles.recommendationCard} variant="outlined">
                    <CardContent>
                        <Typography variant="h6" component="h4" className={styles.recommendationTitle}>
                            {rec.title}
                        </Typography>
                        <Typography variant="body2" className={styles.recommendationContent}>
                            {rec.content}
                        </Typography>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default PsychoanalyticRecommendations;
