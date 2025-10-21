import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './InterpretationPageInteractive.module.css';
import api from '../services/api';
import { Box, IconButton, CircularProgress, Typography, Dialog, DialogContent, DialogTitle } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';

// Генерация случайного цвета для плитки
const generateRandomColor = () => {
  const colors = [
    '#8B5CF6', // фиолетовый
    '#06B6D4', // cyan
    '#10B981', // зелёный
    '#F59E0B', // оранжевый
    '#EF4444', // красный
    '#EC4899', // розовый
    '#6366F1', // индиго
    '#14B8A6', // teal
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const InterpretationPageInteractive = () => {
  const { dreamId } = useParams();
  const navigate = useNavigate();
  
  const [dream, setDream] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // UI State
  const [symbolColors, setSymbolColors] = useState({});
  const [viewedSymbols, setViewedSymbols] = useState(new Set());
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAdviceAnimation, setShowAdviceAnimation] = useState(false);
  const [showAdvice, setShowAdvice] = useState(false);
  const [isInitialView, setIsInitialView] = useState(true); // Флаг первого просмотра
  
  // Ref для плавного скролла к анимации и совету
  const progressSectionRef = useRef(null);
  const adviceSectionRef = useRef(null);

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
        const dreamData = response.data;
        setDream(dreamData);
        
        // Используем цвета из БД или генерируем новые (только для старых снов без цветов)
        const colors = {};
        dreamData.symbols?.forEach(symbol => {
          // Если цвет сохранён в БД - используем его, иначе генерируем новый
          colors[symbol.id] = symbol.color || generateRandomColor();
        });
        setSymbolColors(colors);
        
        // Восстанавливаем viewed символы из БД
        const viewed = new Set(
          dreamData.symbols?.filter(s => s.viewed).map(s => s.id) || []
        );
        setViewedSymbols(viewed);
        
        // Если все уже просмотрены - это повторное открытие из истории
        if (dreamData.symbols?.length > 0 && viewed.size === dreamData.symbols.length) {
          setShowAdvice(true);
          setIsInitialView(false); // Отключаем автоскролл для повторных просмотров
          console.log('[InterpretationPage] Повторное открытие - автоскролл отключен');
        }
        
        console.log('[InterpretationPage] Dream loaded:', dreamData);
      } catch (err) {
        console.error('[InterpretationPage] Error fetching dream:', err);
        setError('Failed to load dream');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDream();
  }, [dreamId]);

  // Автоскролл к совету когда он появляется (только при первом просмотре)
  useEffect(() => {
    if (showAdvice && adviceSectionRef.current && isInitialView) {
      setTimeout(() => {
        adviceSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 500); // Небольшая задержка для плавности (после анимации)
    }
  }, [showAdvice, isInitialView]);

  const handleTileClick = async (symbol) => {
    // Анимация активации плитки
    if (!viewedSymbols.has(symbol.id)) {
      setViewedSymbols(prev => new Set([...prev, symbol.id]));
      
      // Отправляем в БД
      try {
        await api.put(`/symbols/${symbol.id}/viewed`);
      } catch (err) {
        console.error('[InterpretationPage] Error marking symbol as viewed:', err);
      }
    }
    
    // Открываем модалку
    setSelectedSymbol(symbol);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    
    // Проверяем, все ли символы просмотрены
    if (dream?.symbols && viewedSymbols.size === dream.symbols.length) {
      // Плавно скроллим к секции с прогрессом (только при первом просмотре)
      if (isInitialView) {
        setTimeout(() => {
          progressSectionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }, 300); // Небольшая задержка для закрытия модалки
      }
      
      // Показываем анимацию "обрабатываем результаты..."
      setShowAdviceAnimation(true);
      
      setTimeout(() => {
        setShowAdviceAnimation(false);
        setShowAdvice(true);
      }, 3000); // 3 секунды анимации
    }
  };

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
        <Typography variant="h5" sx={{ mb: 2, color: 'var(--text-primary)' }}>
          {error || 'Ошибка'}
        </Typography>
        <Typography sx={{ mb: 2, color: 'var(--text-secondary)' }}>
          Не удалось загрузить данные сна.
        </Typography>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <div className={styles.header}>
        <IconButton 
          onClick={() => navigate(-1)}
          sx={{ color: 'var(--text-primary)' }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ color: 'var(--text-primary)', ml: 2 }}>
          {dream.title}
        </Typography>
      </div>

      <div className={styles.content}>
        {/* Introduction */}
        <div className={styles.introduction}>
          {dream.introduction}
        </div>

        {/* Symbol Tiles */}
        <div className={styles.tilesContainer}>
          {dream.symbols?.map((symbol) => {
            const isViewed = viewedSymbols.has(symbol.id);
            const color = symbolColors[symbol.id];
            
            return (
              <button
                key={symbol.id}
                className={`${styles.tile} ${isViewed ? styles.tileActive : ''}`}
                style={{
                  '--tile-color': color,
                  borderColor: isViewed ? color : 'rgba(255, 255, 255, 0.2)',
                  color: isViewed ? color : 'rgba(255, 255, 255, 0.6)'
                }}
                onClick={() => handleTileClick(symbol)}
              >
                {symbol.title}
              </button>
            );
          })}
        </div>

        {/* Progress Orbs */}
        <div ref={progressSectionRef} className={styles.orbsContainer}>
          {dream.symbols?.map((symbol) => {
            const isViewed = viewedSymbols.has(symbol.id);
            const color = symbolColors[symbol.id];
            
            return (
              <div
                key={symbol.id}
                className={`${styles.orb} ${isViewed ? styles.orbActive : ''}`}
                style={{
                  '--orb-color': color,
                  backgroundColor: isViewed ? color : 'transparent',
                  borderColor: isViewed ? color : 'rgba(255, 255, 255, 0.3)'
                }}
              />
            );
          })}
        </div>

        {/* Advice Animation */}
        {showAdviceAnimation && (
          <div className={styles.adviceAnimation}>
            <Typography variant="body1" className={styles.animatedText}>
              Обрабатываем результаты толкования<span className={styles.dots}></span>
            </Typography>
          </div>
        )}

        {/* Advice */}
        {showAdvice && dream.advice && (
          <div ref={adviceSectionRef} className={styles.adviceCard}>
            <h2 className={styles.adviceTitle}>{dream.advice.title}</h2>
            <div className={styles.adviceContent}>
              {dream.advice.content.split('\n\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal with Symbol Interpretation */}
      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1a1a2e',
            color: 'var(--text-primary)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginTop: '40px' // Отступ сверху для Telegram кнопок
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography 
            variant="h5" 
            component="div"
            sx={{ color: selectedSymbol ? symbolColors[selectedSymbol.id] : '#fff' }}
          >
            {selectedSymbol?.title}
          </Typography>
          <IconButton onClick={handleCloseModal} sx={{ color: 'var(--text-primary)' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '16px' }}>
            {selectedSymbol?.interpretation.split('\n\n').map((paragraph, idx) => (
              <p key={idx} style={{ marginBottom: '12px' }}>{paragraph}</p>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InterpretationPageInteractive;

