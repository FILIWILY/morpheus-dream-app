import React, { useState, useEffect, useContext } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import styles from './LoadingOverlay.module.css';
import { LocalizationContext } from '../context/LocalizationContext';

const STAGES = [
  { key: 'transcribing', labelKey: 'transcribingSpeech', minDuration: 800 },
  { key: 'extracting', labelKey: 'extractingImages', minDuration: 800 },
  { key: 'analyzing', labelKey: 'analyzingDreambooks', minDuration: 800 },
  { key: 'finalizing', labelKey: 'awaitingInterpretation', minDuration: 800 }
];

const LoadingOverlay = ({ isVisible, onComplete, currentStage = 0 }) => {
  const { t } = useContext(LocalizationContext);
  const [displayStage, setDisplayStage] = useState(0);
  const [stageStartTime, setStageStartTime] = useState(Date.now());

  useEffect(() => {
    if (!isVisible) {
      setDisplayStage(0);
      return;
    }

    // Update display stage based on current stage from parent
    if (currentStage > displayStage) {
      const elapsed = Date.now() - stageStartTime;
      const minDuration = STAGES[displayStage]?.minDuration || 0;
      const remaining = Math.max(0, minDuration - elapsed);

      const timer = setTimeout(() => {
        setDisplayStage(currentStage);
        setStageStartTime(Date.now());
      }, remaining);

      return () => clearTimeout(timer);
    }
  }, [currentStage, displayStage, stageStartTime, isVisible]);

  useEffect(() => {
    // Prevent page close during loading
    if (!isVisible) return;

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = 'Толкование в процессе. Вы уверены, что хотите закрыть страницу?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <Box className={styles.overlay}>
      <Box className={styles.content}>
        <CircularProgress size={80} thickness={2} sx={{ color: 'var(--accent-primary)' }} />
        <Typography variant="h5" className={styles.stageText}>
          {t(STAGES[displayStage]?.labelKey) || t('pleaseWait')}
        </Typography>
        <Typography variant="body2" className={styles.progressText}>
          {t('stage')} {displayStage + 1} {t('of')} {STAGES.length}
        </Typography>
      </Box>
    </Box>
  );
};

export default LoadingOverlay;

