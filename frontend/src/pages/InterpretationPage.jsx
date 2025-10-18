import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './InterpretationPage.module.css';
import api from '../services/api';
import { Box, Button, CircularProgress, Typography, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

/**
 * Simplified InterpretationPage - Debug Mode
 * Shows data structure clearly with column labels
 */
const InterpretationPage = () => {
  const { dreamId } = useParams();
  const navigate = useNavigate();
  
  const [dream, setDream] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDream = async () => {
      if (!dreamId) {
        setError('No dream ID provided');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await api.get(`/dreams/${dreamId}`);
        setDream(response.data);
        console.log('[InterpretationPage] Dream loaded:', response.data);
      } catch (err) {
        console.error('[InterpretationPage] Error fetching dream:', err);
        setError('Failed to load dream');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDream();
  }, [dreamId]);

  if (isLoading) {
    return (
      <Box className={styles.pageWrapper} sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !dream) {
    return (
      <div className={styles.pageWrapper} style={{ padding: '32px' }}>
        <Typography variant="h5" sx={{ mb: 2 }}>{error || 'Ошибка'}</Typography>
        <Typography sx={{ mb: 2 }}>
          Не удалось загрузить данные сна.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/history')}>
          Вернуться к истории
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Header with back button */}
      <div className={styles.header}>
        <IconButton 
          onClick={() => navigate(-1)}
          sx={{ color: 'var(--text-primary)' }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ color: 'var(--text-primary)', ml: 2 }}>
          Dream Interpretation (Debug Mode)
        </Typography>
      </div>

      <div className={styles.content}>
        {/* Title */}
        <div className={styles.debugSection}>
          <div className={styles.debugLabel}>[DB: dreams.title]</div>
          <h1 className={styles.title}>{dream.title || '[NULL]'}</h1>
        </div>

        {/* Introduction */}
        <div className={styles.debugSection}>
          <div className={styles.debugLabel}>[DB: dreams.introduction]</div>
          <div className={styles.introduction}>
            {dream.introduction || '[NULL]'}
          </div>
        </div>

        {/* Symbols */}
        <div className={styles.debugSection}>
          <div className={styles.debugLabel}>[DB: dream_symbols (JOIN on dream_id)]</div>
          <div className={styles.symbolsContainer}>
            {dream.symbols && dream.symbols.length > 0 ? (
              dream.symbols.map((symbol, idx) => (
                <div key={symbol.id} className={styles.symbolCard}>
                  <div className={styles.symbolHeader}>
                    <div className={styles.debugLabelSmall}>
                      [dream_symbols.title | order: {symbol.order} | category: {symbol.category || 'NULL'}]
                    </div>
                    <h2 className={styles.symbolTitle}>
                      {idx + 1}. {symbol.title}
                    </h2>
                  </div>
                  
                  <div className={styles.symbolBody}>
                    <div className={styles.debugLabelSmall}>[dream_symbols.interpretation]</div>
                    <div className={styles.symbolInterpretation}>
                      {symbol.interpretation.split('\n\n').map((paragraph, pIdx) => (
                        <p key={pIdx}>{paragraph}</p>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <Typography sx={{ color: 'var(--text-secondary)' }}>
                No symbols found
              </Typography>
            )}
          </div>
        </div>

        {/* Advice */}
        {dream.advice && (
          <div className={styles.debugSection}>
            <div className={styles.debugLabel}>[DB: dreams.advice_title + advice_content]</div>
            <div className={styles.adviceCard}>
              <h2 className={styles.adviceTitle}>{dream.advice.title || '[NULL]'}</h2>
              <div className={styles.adviceContent}>
                {(dream.advice.content || '[NULL]').split('\n\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Meta info */}
        <div className={styles.debugSection}>
          <div className={styles.debugLabel}>[Metadata]</div>
          <div className={styles.meta}>
            <div>Dream ID: {dream.id}</div>
            <div>User ID: {dream.userId}</div>
            <div>Date: {dream.date}</div>
            <div>Created: {new Date(dream.createdAt).toLocaleString('ru-RU')}</div>
            <div>Symbols Count: {dream.symbols?.length || 0}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterpretationPage;
