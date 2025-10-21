import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import api from '../services/api';
import styles from './RecordingPage.module.css';

import { Box, TextField, IconButton, Alert, Typography } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MenuIcon from '@mui/icons-material/Menu';

import RecordingOrb from '../components/RecordingOrb';
import LoadingOverlay from '../components/LoadingOverlay';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { LocalizationContext } from '../context/LocalizationContext';
import DateSelectionModal from '../components/DateSelectionModal';
import { useProfile } from '../context/ProfileContext';
import { reportError } from '../services/errorReporter';

const DEV_USER_ID = import.meta.env.DEV ? 'dev_test_user_123' : null;

const RecordingPage = () => {
  const navigate = useNavigate();
  const { openDrawer } = useOutletContext(); // Get the function from Layout
  const { t, locale } = useContext(LocalizationContext);
  const { profile } = useProfile();

  const [dreamText, setDreamText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
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
      console.log('[RecordingPage] 🎤 Starting audio processing...');
      setIsLoading(true);
      setLoadingStage(0); // Stage 0: Transcribing
      setError(null);
      
      const formData = new FormData();
      formData.append('lang', locale);
      formData.append('date', dreamDate);
      formData.append('audiofile', audioBlob, `dream-recording-${Date.now()}.webm`);
      
      try {
        console.log('[RecordingPage] 📤 Sending audio to backend...');
        
        // Simulate stage progression for better UX
        const stageTimer1 = setTimeout(() => setLoadingStage(1), 5000); // Stage 1: Extracting after 5s
        const stageTimer2 = setTimeout(() => setLoadingStage(2), 10000); // Stage 2: Analyzing after 10s
        const stageTimer3 = setTimeout(() => setLoadingStage(3), 20000); // Stage 3: Finalizing after 20s
        
        const response = await api.post('/processDreamAudio', formData);
        
        // Clear timers
        clearTimeout(stageTimer1);
        clearTimeout(stageTimer2);
        clearTimeout(stageTimer3);
        
        console.log('[RecordingPage] 📥 Response received:', response.data);
        
        // Check if interpretation failed but transcription succeeded
        if (response.data.success === false && response.data.transcribedText) {
          console.log('[RecordingPage] ✅ Transcription OK, but interpretation failed');
          console.log('[RecordingPage] 📝 Transcribed text:', response.data.transcribedText);
          setError(`✅ Расшифровка: "${response.data.transcribedText}"\n\n❌ ${response.data.error}`);
        } else if (response.data && response.data.id) {
          // Success - navigate to interpretation
          const dreamId = response.data.id;
          console.log('[RecordingPage] ✅ Success! Dream ID:', dreamId);
          console.log('[RecordingPage] 🔀 Navigating to /interpretation/' + dreamId);
          navigate(`/interpretation/${dreamId}`);
        } else {
          console.error('[RecordingPage] ❌ Unexpected response structure:', response.data);
          const errorMsg = t('unknownError') + ' (No ID returned)';
          setError(errorMsg);
          
          // Report to admin via Telegram
          reportError('RecordingPage (Audio)', new Error(errorMsg), {
            responseData: JSON.stringify(response.data),
            expectedField: 'id',
            actualFields: Object.keys(response.data || {}).join(', ')
          });
        }
      } catch (err) {
        console.error('[RecordingPage] ❌ Audio processing error:', err);
        console.error('[RecordingPage] Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        setError(err.response?.data?.error || err.message || t('unknownError'));
        
        // Report to admin via Telegram
        reportError('RecordingPage (Audio)', err, {
          endpoint: '/processDreamAudio',
          status: err.response?.status,
          responseData: JSON.stringify(err.response?.data)
        });
      } finally {
        setIsLoading(false);
        setLoadingStage(0);
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
    console.log('[RecordingPage] 📝 Starting text interpretation...');
    setIsLoading(true);
    setLoadingStage(1); // Skip transcription, start from extracting
    setError(null);
    
    try {
      console.log('[RecordingPage] 📤 Sending text to backend...');
      
      // Simulate stage progression
      const stageTimer1 = setTimeout(() => setLoadingStage(2), 3000); // Stage 2: Analyzing after 3s
      const stageTimer2 = setTimeout(() => setLoadingStage(3), 10000); // Stage 3: Finalizing after 10s
      
      // Simple POST request - may take 30-60 seconds
      const response = await api.post('/interpretDream', {
        text: dreamText,
        date: date,
      });
      
      // Clear timers
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      
      console.log('[RecordingPage] 📥 Response received:', response.data);
      
      // Navigate to interpretation page with dream ID
      if (response.data && response.data.id) {
        const dreamId = response.data.id;
        console.log('[RecordingPage] ✅ Success! Dream ID:', dreamId);
        console.log('[RecordingPage] 🔀 Navigating to /interpretation/' + dreamId);
        navigate(`/interpretation/${dreamId}`);
      } else {
        console.error('[RecordingPage] ❌ Unexpected response structure:', response.data);
        const errorMsg = t('unknownError') + ' (No ID returned)';
        setError(errorMsg);
        
        // Report to admin via Telegram
        reportError('RecordingPage (Text)', new Error(errorMsg), {
          responseData: JSON.stringify(response.data),
          expectedField: 'id',
          actualFields: Object.keys(response.data || {}).join(', ')
        });
      }
      
    } catch (err) {
      console.error('[RecordingPage] ❌ Text interpretation error:', err);
      console.error('[RecordingPage] Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.error || err.message || t('unknownError'));
      
      // Report to admin via Telegram
      reportError('RecordingPage (Text)', err, {
        endpoint: '/interpretDream',
        status: err.response?.status,
        responseData: JSON.stringify(err.response?.data)
      });
    } finally {
      setIsLoading(false);
      setLoadingStage(0);
      setUserAction(null);
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Full-screen loading overlay */}
      <LoadingOverlay isVisible={isLoading} currentStage={loadingStage} />
      
      <DateSelectionModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDateSelect={handleDateSelect}
      />

      {/* Main content - hidden when loading */}
      {!isLoading && (
        <>
          <main className={styles.content}>
            <header className={styles.header}>
              <IconButton 
                size="large" 
                aria-label="menu" 
                onClick={openDrawer}
                sx={{ color: 'var(--text-primary)' }}
              >
                <MenuIcon />
              </IconButton>
              <Typography 
                variant="h1" 
                className={styles.title}
              >
                {isRecording ? t('recording') : t('recordYourDream')}
              </Typography>
            </header>

            <Box className={styles.orbContainer}>
              {error && (
                <Alert 
                  severity="error" 
                  onClose={() => setError(null)} 
                  sx={{ position: 'absolute', top: '0', maxWidth: '90%', zIndex: 10 }}
                >
                  {error}
                </Alert>
              )}

              <RecordingOrb
                isRecording={isRecording}
                amplitude={amplitude}
                onClick={handleRecordClick}
              />
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
                disabled={isRecording}
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
                disabled={isRecording}
                aria-label={t('send')}
                sx={{ color: 'var(--accent-primary)' }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </footer>
        </>
      )}
    </div>
  );
};

export default RecordingPage;