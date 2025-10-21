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
  try {
    // Send to backend which will forward to Telegram
    await api.post('/reportFrontendError', {
      ...errorDetails,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  } catch (err) {
    // Silent fail - don't break user experience
    console.error('[ErrorReporter] Failed to report error:', err);
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

