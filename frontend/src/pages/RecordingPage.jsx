import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import styles from './RecordingPage.module.css';

import { Box, TextField, IconButton, CircularProgress, Alert } from '@mui/material';
import StopIcon from '@mui/icons-material/Stop';
import SendIcon from '@mui/icons-material/Send';

// Правильный относительный путь от /pages/ до /assets/
import emblemSrc from '../assets/emblem.png';

import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { LocalizationContext } from '../context/LocalizationContext';
import DateSelectionModal from '../components/DateSelectionModal';

const RecordingPage = () => {
  const navigate = useNavigate();
  const { t, locale } = useContext(LocalizationContext);
  
  const [dreamText, setDreamText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dreamDate, setDreamDate] = useState(null);
  const [userAction, setUserAction] = useState(null);

  const { isRecording, audioBlob, startRecording, stopRecording } = useAudioRecorder();

  useEffect(() => {
    if (dreamDate && userAction === 'startRecording') {
      startRecording().catch(err => setError(err.message));
      setUserAction(null);
    }
  }, [dreamDate, userAction, startRecording]);

  useEffect(() => {
    if (!audioBlob) return;
    const sendAudio = async () => {
      setIsLoading(true);
      setError(null);
      const formData = new FormData();
      formData.append('lang', locale);
      formData.append('date', dreamDate);
      formData.append('audiofile', audioBlob, `dream-recording-${Date.now()}.webm`);
      try {
        const response = await api.post('/processDreamAudio', formData);
        navigate('/interpretation', { state: { interpretationData: response.data } });
      } catch (err) {
        setError(err.response?.data?.error || err.message || t('unknownError'));
      } finally {
        setIsLoading(false);
      }
    };
    sendAudio();
  }, [audioBlob, locale, navigate, t, dreamDate]);

  const handleInitiateAction = (actionType) => {
    setError(null);
    setUserAction(actionType);
    setIsModalOpen(true);
  };

  const handleDateSelect = (date) => {
    setDreamDate(date);
    setIsModalOpen(false);
    if (userAction === 'sendText') {
      handleTextSubmit(date);
    }
  };

  const handleRecordClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      handleInitiateAction('startRecording');
    }
  };

  const handleTextFormSubmit = (e) => {
    e.preventDefault();
    if (!dreamText.trim() || isLoading) return;
    handleInitiateAction('sendText');
  };

  const handleTextSubmit = async (date) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/processDreamText', {
        text: dreamText,
        lang: locale,
        date: date,
      });
      navigate('/interpretation', { state: { interpretationData: response.data } });
    } catch (err) {
      setError(err.response?.data?.error || err.message || t('unknownError'));
    } finally {
      setIsLoading(false);
      setUserAction(null);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <DateSelectionModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDateSelect={handleDateSelect}
      />
      <header className={styles.header}>
        <h1 className={styles.title}>
          {isRecording ? t('recording') : t('recordYourDream')}
        </h1>
      </header>
      <main className={styles.content}>
        {error && <Alert severity="error" sx={{ position: 'absolute', top: '120px' }}>{error}</Alert>}
        {isLoading ? (
          <CircularProgress size={140} color="primary" />
        ) : (
          <button
            className={`${styles.siriOrb} ${isRecording ? styles.isRecording : ''}`}
            aria-label={isRecording ? t('stopRecording') : t('recordDream')}
            onClick={handleRecordClick}
            disabled={isLoading}
          >
            <div className={`${styles.orbLayer} ${styles.orbLayer1}`}></div>
            <div className={`${styles.orbLayer} ${styles.orbLayer2}`}></div>
            {isRecording 
              ? <StopIcon sx={{ fontSize: 60, color: 'white', zIndex: 2 }} /> 
              : <img src={emblemSrc} alt="Record Dream Emblem" className={styles.emblem} />
            }
          </button>
        )}
      </main>
      <footer className={styles.footer}>
        <Box
          component="form"
          onSubmit={handleTextFormSubmit}
          className={styles.inputWrapper}
        >
          <TextField
            className={styles.textField}
            fullWidth
            variant="standard"
            placeholder={t('describeDream')}
            value={dreamText}
            onChange={(e) => setDreamText(e.target.value)}
            disabled={isLoading || isRecording}
            multiline
            maxRows={4}
            InputProps={{
              disableUnderline: true,
              sx: { color: 'white', padding: '4px 8px' }
            }}
          />
          <IconButton
            type="submit"
            disabled={!dreamText.trim() || isLoading || isRecording}
            aria-label={t('send')}
            sx={{ color: 'var(--accent-primary)' }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </footer>
    </div>
  );
};
export default RecordingPage;