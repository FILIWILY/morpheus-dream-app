import React, { useState, useContext, useEffect, useRef } from 'react';
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
  const [countdown, setCountdown] = useState(null); // 3, 2, 1, or null
  const [isPreparingRecording, setIsPreparingRecording] = useState(false);

  const { isRecording, audioBlob, amplitude, startRecording, stopRecording } = useAudioRecorder();
  
  // Ref to prevent double-triggering of countdown
  const countdownStartedRef = useRef(false);
  // Refs to store timer IDs for cancellation
  const countdownTimersRef = useRef({ timer1: null, timer2: null, timer3: null });

  // Debug: log countdown state changes
  useEffect(() => {
    const orbIsRecording = countdown === null ? isRecording : (countdown === 1);
    console.log('[RecordingPage] 🔄 State update - countdown:', countdown, 'isPreparingRecording:', isPreparingRecording, 'isRecording:', isRecording, '→ Orb isRecording:', orbIsRecording);
  }, [countdown, isPreparingRecording, isRecording]);

  // Reset countdown UI when recording actually starts
  useEffect(() => {
    if (isRecording && countdown !== null) {
      console.log('[RecordingPage] 🎙️ Recording started! Resetting countdown UI');
      setCountdown(null);
      setIsPreparingRecording(false);
    }
  }, [isRecording, countdown]);

  // Hide BottomNav during countdown/recording - same timing as fadeOut
  useEffect(() => {
    // Layout wraps BottomNav in <nav className={styles.nav}>
    const bottomNavContainer = document.querySelector('nav:has(.MuiBottomNavigation-root)');
    
    console.log('[RecordingPage] 🔍 BottomNav container:', bottomNavContainer);
    console.log('[RecordingPage] 📊 isPreparingRecording:', isPreparingRecording, 'isRecording:', isRecording);
    
    if (!bottomNavContainer) {
      console.warn('[RecordingPage] ⚠️ BottomNav container not found in DOM');
      return;
    }
    
    if (isPreparingRecording || isRecording) {
      console.log('[RecordingPage] 📉 Hiding BottomNav (translateY 100%)');
      bottomNavContainer.style.transition = 'transform 0.4s ease-out';
      bottomNavContainer.style.transform = 'translateY(100%)';
    } else {
      console.log('[RecordingPage] 📈 Showing BottomNav (translateY 0)');
      bottomNavContainer.style.transition = 'transform 0.4s ease-out';
      bottomNavContainer.style.transform = 'translateY(0)';
    }
    
    return () => {
      if (bottomNavContainer) {
        bottomNavContainer.style.transition = '';
        bottomNavContainer.style.transform = '';
      }
    };
  }, [isPreparingRecording, isRecording]);

  // Function to cancel countdown
  const cancelCountdown = () => {
    console.log('[RecordingPage] ❌ Cancelling countdown');
    clearTimeout(countdownTimersRef.current.timer1);
    clearTimeout(countdownTimersRef.current.timer2);
    clearTimeout(countdownTimersRef.current.timer3);
    setCountdown(null);
    setIsPreparingRecording(false);
    setUserAction(null); // Reset userAction when cancelled
    countdownStartedRef.current = false;
    countdownTimersRef.current = { timer1: null, timer2: null, timer3: null };
  };

  useEffect(() => {
    console.log('[RecordingPage] 🔍 useEffect triggered - dreamDate:', dreamDate, 'userAction:', userAction, 'countdownStarted:', countdownStartedRef.current);
    
    if (dreamDate && userAction === 'startRecording' && !countdownStartedRef.current) {
      console.log('[RecordingPage] 🎬 ✅ All conditions met! Starting countdown sequence');
      countdownStartedRef.current = true; // Mark as started
      
      // Start countdown sequence
      setIsPreparingRecording(true);
      setCountdown(3);
      console.log('[RecordingPage] ⏱️ Countdown: 3');
      
      countdownTimersRef.current.timer1 = setTimeout(() => {
        console.log('[RecordingPage] ⏱️ Countdown: 2');
        setCountdown(2);
      }, 1100);
      
      countdownTimersRef.current.timer2 = setTimeout(() => {
        console.log('[RecordingPage] ⏱️ Countdown: 1');
        setCountdown(1);
      }, 2200);
      
      countdownTimersRef.current.timer3 = setTimeout(() => {
        console.log('[RecordingPage] ⏱️ Countdown finished, starting recording');
        // Don't reset countdown/isPreparingRecording yet - keep UI frozen
        // Just start recording
        countdownStartedRef.current = false; // Reset for next time
        setUserAction(null); // Reset userAction AFTER countdown finishes
        startRecording().catch(err => {
          console.error('[RecordingPage] ❌ Recording start error:', err);
          setError(err.message);
          countdownStartedRef.current = false; // Reset on error too
          setUserAction(null); // Reset on error too
          // Reset UI on error
          setCountdown(null);
          setIsPreparingRecording(false);
        });
      }, 3300);
    }
    
    // Cleanup only on unmount (not on re-render)
    return () => {
      // Only cleanup if timers are actually running
      if (countdownStartedRef.current) {
        console.log('[RecordingPage] 🧹 Cleaning up countdown timers (component unmounting)');
        clearTimeout(countdownTimersRef.current.timer1);
        clearTimeout(countdownTimersRef.current.timer2);
        clearTimeout(countdownTimersRef.current.timer3);
        countdownStartedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dreamDate, userAction]);

  useEffect(() => {
    if (!audioBlob) return;
    const sendAudio = async () => {
      const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
      
      console.log('[RecordingPage] 🎤 Starting audio processing...');
      if (isDev) {
        console.log('[RecordingPage] 🔧 DEV MODE: Enhanced logging enabled');
        console.log('[RecordingPage] 📊 Audio blob size:', audioBlob.size, 'bytes');
        console.log('[RecordingPage] 📊 Audio type:', audioBlob.type);
      }
      
      setIsLoading(true);
      setLoadingStage(0); // Stage 0: Transcribing
      setError(null);
      
      const formData = new FormData();
      formData.append('lang', locale);
      formData.append('date', dreamDate);
      formData.append('audiofile', audioBlob, `dream-recording-${Date.now()}.webm`);
      
      try {
        const startTime = Date.now();
        console.log('[RecordingPage] 📤 Sending audio to backend...');
        if (isDev) {
          console.log('[RecordingPage] ⏰ Start time:', new Date(startTime).toISOString());
        }
        
        // Simulate stage progression for better UX
        const stageTimer1 = setTimeout(() => {
          setLoadingStage(1);
          if (isDev) console.log('[RecordingPage] 🔄 Stage 1: Extracting symbols');
        }, 5000);
        
        const stageTimer2 = setTimeout(() => {
          setLoadingStage(2);
          if (isDev) console.log('[RecordingPage] 🔄 Stage 2: Analyzing dreambooks');
        }, 10000);
        
        const stageTimer3 = setTimeout(() => {
          setLoadingStage(3);
          if (isDev) console.log('[RecordingPage] 🔄 Stage 3: Finalizing interpretation');
        }, 20000);
        
        const response = await api.post('/processDreamAudio', formData);
        
        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        
        // Clear timers
        clearTimeout(stageTimer1);
        clearTimeout(stageTimer2);
        clearTimeout(stageTimer3);
        
        console.log('[RecordingPage] 📥 Response received:', response.data);
        if (isDev) {
          console.log('[RecordingPage] ⏱️ Total processing time:', duration.toFixed(2), 'seconds');
          console.log('[RecordingPage] 📦 Response structure:', Object.keys(response.data));
          console.log('[RecordingPage] 🔍 Full response:', JSON.stringify(response.data, null, 2));
        }
        
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
    console.log('[RecordingPage] 🚀 Initiating action:', actionType);
    setError(null);
    if (actionType === 'sendText' && !dreamText.trim()) {
      setError('Пожалуйста, опишите свой сон.');
      return;
    }
    
    // Clear previous date and set new action
    setDreamDate(null);
    setUserAction(actionType);
    setIsModalOpen(true);
    console.log('[RecordingPage] 📅 Opening date selection modal');
  };

  const handleDateSelect = (date) => {
    console.log('[RecordingPage] 📅 Date selected:', date, 'userAction:', userAction);
    setIsModalOpen(false);
    
    if (userAction === 'sendText') {
      console.log('[RecordingPage] 📝 Processing text submission');
      handleTextSubmit(date);
    } else if (userAction === 'startRecording') {
      console.log('[RecordingPage] 🎬 Date selected, will trigger countdown');
      // Set date and action together to trigger countdown
      setDreamDate(date);
    }
  };

  const handleRecordClick = () => {
    console.log('[RecordingPage] 🎤 Record button clicked. isRecording:', isRecording, 'countdown:', countdown);
    
    // If countdown is active, cancel it
    if (countdown !== null) {
      console.log('[RecordingPage] ❌ Cancelling countdown');
      cancelCountdown();
      return;
    }
    
    // If recording, stop it
    if (isRecording) {
      console.log('[RecordingPage] 🛑 Stopping recording');
      stopRecording();
    } else {
      console.log('[RecordingPage] ▶️ Starting recording flow (will open date modal)');
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
            {/* Header - hidden during countdown/recording */}
            <header className={`${styles.header} ${(isPreparingRecording || isRecording) ? styles.fadeOut : ''}`}>
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
                {t('recordYourDream')}
              </Typography>
            </header>

            <Box className={styles.orbContainer}>
              {error && !isPreparingRecording && !isRecording && (
                <Alert 
                  severity="error" 
                  onClose={() => setError(null)} 
                  sx={{ position: 'absolute', top: '0', maxWidth: '90%', zIndex: 10 }}
                >
                  {error}
                </Alert>
              )}

              {/* Countdown or Recording status */}
              {(countdown !== null || isRecording) && (
                <Box className={styles.statusContainer}>
                  {countdown !== null && (
                    <>
                      <Typography variant="body1" className={styles.countdownLabel}>
                        {t('recordingWillStartIn')}
                      </Typography>
                      <Typography 
                        key={countdown} 
                        variant="h1" 
                        className={styles.countdownNumber}
                      >
                        {countdown}
                      </Typography>
                      <Typography variant="caption" className={styles.cancelHint}>
                        {t('tapToCancelCountdown')}
                      </Typography>
                    </>
                  )}
                  {countdown === null && isRecording && (
                    <Typography 
                      key="recording" 
                      variant="h5" 
                      className={styles.recordingLabel}
                    >
                      {t('recordingInProgress')}
                    </Typography>
                  )}
                </Box>
              )}

              <RecordingOrb
                isRecording={countdown === null ? isRecording : (countdown === 1)}
                amplitude={amplitude}
                onClick={handleRecordClick}
              />
            </Box>
          </main>

          <footer className={`${styles.footer} ${(isPreparingRecording || isRecording) ? styles.fadeOut : ''}`}>
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