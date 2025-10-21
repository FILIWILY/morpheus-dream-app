import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import styles from './LoadingOverlay.module.css';

const STAGES = [
  { key: 'transcribing', label: 'Расшифровываем речь...', minDuration: 2000 },
  { key: 'extracting', label: 'Выделяем образы...', minDuration: 2000 },
  { key: 'analyzing', label: 'Изучаем сонники...', minDuration: 2000 },
  { key: 'finalizing', label: 'Готовим толкование...', minDuration: 2000 }
];

const LoadingOverlay = ({ isVisible, onComplete, currentStage = 0 }) => {
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
          {STAGES[displayStage]?.label || 'Обработка...'}
        </Typography>
        <Typography variant="body2" className={styles.progressText}>
          Шаг {displayStage + 1} из {STAGES.length}
        </Typography>
      </Box>
    </Box>
  );
};

export default LoadingOverlay;

