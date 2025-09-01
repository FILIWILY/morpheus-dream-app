import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../services/api';
import styles from './RecordingPage.module.css';

import { Box, TextField, IconButton, CircularProgress, Alert, AppBar, Toolbar, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MenuIcon from '@mui/icons-material/Menu';

import RecordingOrb from '../components/RecordingOrb';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { LocalizationContext } from '../context/LocalizationContext';
import DateSelectionModal from '../components/DateSelectionModal';

const RecordingPage = () => {
  const navigate = useNavigate();
  const { openDrawer } = useOutletContext(); // Get the function from Layout
  const { t, locale } = useContext(LocalizationContext);

  const [dreamText, setDreamText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dreamDate, setDreamDate] = useState(null);
  const [userAction, setUserAction] = useState(null);

  const { isRecording, audioBlob, amplitude, startRecording, stopRecording } = useAudioRecorder();

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
        navigate(`/interpretation/${response.data.id}`);
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
    if (actionType === 'sendText' && !dreamText.trim()) {
      setError('Пожалуйста, опишите свой сон.');
      return;
    }
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

  const triggerTextSubmit = () => {
    if (isLoading) return;
    handleInitiateAction('sendText');
  };

  const handleTextFormSubmit = (e) => {
    e.preventDefault();
    triggerTextSubmit();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      triggerTextSubmit();
    }
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
      navigate(`/interpretation/${response.data.id}`);
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

      <main className={styles.content}>
        <header className={styles.header}>
          <IconButton size="large" color="inherit" aria-label="menu" onClick={openDrawer}>
            <MenuIcon />
          </IconButton>
          <Typography 
            variant="h1" 
            className={styles.title}
          >
            {isRecording ? t('recording') : t('recordYourDream')}
          </Typography>
          {/* Empty spacer */}
          <Box sx={{ width: 48, height: 48 }}/>
        </header>

        <Box className={styles.orbContainer}>
            {error && <Alert severity="error" onClose={() => setError(null)} sx={{ position: 'absolute', top: '0' }}>{error}</Alert>}

            {isLoading ? (
              <CircularProgress size={140} color="primary" />
            ) : (
              <RecordingOrb
                isRecording={isRecording}
                amplitude={amplitude}
                onClick={isLoading ? undefined : handleRecordClick}
              />
            )}
        </Box>
      </main>

      <footer className={`${styles.footer} ${isRecording ? styles.faded : ''}`}>
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
              sx: { color: 'var(--text-primary)', padding: '4px 8px' }
            }}
            onKeyDown={handleKeyDown}
          />
          <IconButton
            type="submit"
            disabled={isLoading || isRecording}
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