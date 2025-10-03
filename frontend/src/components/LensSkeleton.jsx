import React from 'react';
import { Box, Skeleton } from '@mui/material';
import styles from './LensSkeleton.module.css';

const LensSkeleton = () => {
    return (
        <Box className={styles.skeletonContainer}>
            <Skeleton variant="text" width="60%" height={40} />
            <Skeleton variant="rectangular" width="100%" height={80} sx={{ mt: 2 }} />
            
            <Skeleton variant="text" width="40%" height={30} sx={{ mt: 4 }} />
            <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 1 }} />
            
            <Skeleton variant="text" width="40%" height={30} sx={{ mt: 4 }} />
            <Skeleton variant="rectangular" width="100%" height={60} sx={{ mt: 1 }} />
        </Box>
    );
};

export default LensSkeleton;
