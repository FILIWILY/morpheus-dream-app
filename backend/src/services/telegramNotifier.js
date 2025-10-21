/**
 * Telegram Notifier Service
 * Sends critical error notifications to admin via Telegram Bot API
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_ID = process.env.ADMIN_ID;

/**
 * Send error notification to admin
 * @param {Object} errorDetails - Error information
 * @param {string} errorDetails.error - Error message
 * @param {string} errorDetails.endpoint - API endpoint where error occurred
 * @param {number} errorDetails.statusCode - HTTP status code
 * @param {string} errorDetails.userId - Telegram user ID (if available)
 * @param {Object} errorDetails.metadata - Additional metadata
 */
export async function notifyAdmin(errorDetails) {
  if (!TELEGRAM_BOT_TOKEN || !ADMIN_ID) {
    console.warn('[TelegramNotifier] ⚠️ TELEGRAM_BOT_TOKEN or ADMIN_ID not set. Skipping notification.');
    return;
  }

  try {
    const timestamp = new Date().toISOString();
    const message = formatErrorMessage(errorDetails, timestamp);

    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[TelegramNotifier] ❌ Failed to send notification: ${errorText}`);
    } else {
      console.log('[TelegramNotifier] ✅ Admin notification sent successfully');
    }
  } catch (error) {
    console.error('[TelegramNotifier] ❌ Error sending notification:', error);
  }
}

/**
 * Format error message for Telegram
 */
function formatErrorMessage(details, timestamp) {
  const {
    error,
    endpoint,
    statusCode,
    userId,
    metadata = {}
  } = details;

  let message = `🚨 <b>CRITICAL ERROR</b>\n\n`;
  message += `⏰ <b>Time:</b> ${timestamp}\n`;
  message += `📍 <b>Endpoint:</b> ${endpoint || 'Unknown'}\n`;
  message += `🔢 <b>Status:</b> ${statusCode || 'N/A'}\n`;
  
  if (userId) {
    message += `👤 <b>User ID:</b> ${userId}\n`;
  }
  
  message += `\n❌ <b>Error:</b>\n<code>${escapeHtml(error)}</code>\n`;

  // Add metadata if present
  if (Object.keys(metadata).length > 0) {
    message += `\n📋 <b>Additional Info:</b>\n`;
    for (const [key, value] of Object.entries(metadata)) {
      message += `  • ${key}: ${escapeHtml(String(value))}\n`;
    }
  }

  return message;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Express middleware for error notification
 */
export function errorNotificationMiddleware(err, req, res, next) {
  // Only notify on critical errors (5xx)
  const statusCode = err.statusCode || err.status || 500;
  
  if (statusCode >= 500) {
    notifyAdmin({
      error: err.message || 'Unknown error',
      endpoint: `${req.method} ${req.originalUrl}`,
      statusCode: statusCode,
      userId: req.user?.telegram_id || req.telegramUserId || null,
      metadata: {
        stack: err.stack?.split('\n').slice(0, 3).join('\n') || 'No stack trace',
        userAgent: req.headers['user-agent'] || 'Unknown',
      }
    });
  }

  // Pass error to next handler
  next(err);
}

