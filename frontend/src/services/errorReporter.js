/**
 * Frontend Error Reporter
 * Sends critical frontend errors to admin via backend → Telegram
 */

import api from './api';

/**
 * Report critical error to admin
 * @param {Object} errorDetails - Error information
 */
export async function reportCriticalError(errorDetails) {
  const isDev = import.meta.env.DEV || import.meta.env.MODE === 'development';
  
  try {
    if (isDev) {
      console.log('[ErrorReporter] 📤 Sending error to Telegram:', errorDetails);
    }
    
    // Send to backend which will forward to Telegram
    const response = await api.post('/reportFrontendError', {
      ...errorDetails,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    if (isDev) {
      console.log('[ErrorReporter] ✅ Error reported successfully:', response.data);
    }
  } catch (err) {
    // Silent fail - don't break user experience
    console.error('[ErrorReporter] ❌ Failed to report error:', err);
    if (isDev) {
      console.error('[ErrorReporter] 🔍 Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
    }
  }
}

/**
 * Setup global error handlers
 */
export function setupErrorReporting() {
  // Catch unhandled errors
  window.addEventListener('error', (event) => {
    reportCriticalError({
      type: 'Uncaught Error',
      message: event.message,
      filename: event.filename,
      line: event.lineno,
      column: event.colno,
      stack: event.error?.stack
    });
  });

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    reportCriticalError({
      type: 'Unhandled Promise Rejection',
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack
    });
  });
}

/**
 * Manually report navigation or API errors
 * @param {string} context - Where error occurred (e.g., "RecordingPage")
 * @param {Error} error - The error object
 * @param {Object} metadata - Additional context
 */
export function reportError(context, error, metadata = {}) {
  reportCriticalError({
    type: 'Navigation/API Error',
    context,
    message: error.message,
    stack: error.stack,
    metadata
  });
}

