import React, { useState } from 'react';
import { Modal, Box, IconButton, Typography, Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useSpring, animated } from '@react-spring/web';
import { useTranslation } from 'react-i18next';
import styles from './TranscriptModal.module.css';

const AnimatedBox = animated(Box);

const TranscriptModal = ({ open, onClose, transcript, title }) => {
    const { t } = useTranslation();
    const springProps = useSpring({
        opacity: open ? 1 : 0,
        transform: open ? 'scale(1)' : 'scale(0.9)',
        config: { tension: 300, friction: 20 },
    });

    if (!open) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <AnimatedBox 
                style={springProps} 
                className={styles.modalBox} 
                onClick={(e) => e.stopPropagation()}
            >
                <Box className={styles.modalHeader}>
                    <Typography id="transcript-modal-title" variant="h6" component="h2">
                        {title || t('dreamTranscript')}
                    </Typography>
                    <IconButton onClick={onClose} aria-label="close" sx={{ color: 'var(--text-primary)'}}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Box className={styles.modalContent}>
                    <Typography component="p" sx={{ whiteSpace: 'pre-wrap', textAlign: 'justify' }}>
                        {transcript}
                    </Typography>
                </Box>
            </AnimatedBox>
        </div>
    );
};

export default TranscriptModal;

