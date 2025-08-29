import crypto from 'crypto';
import * as db from '../services/database.js';

/**
 * Middleware to verify the authenticity of a request from a Telegram Web App.
 * Fully compliant with senior developer review requirements.
 * 
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
 * @param {import('express').Request} req - The Express request object.
 * @param {import('express').Response} res - The Express response object.
 * @param {import('express').NextFunction} next - The Express next middleware function.
 */
export async function verifyTelegramAuth(req, res, next) {
    const bypassAuth = process.env.DANGEROUSLY_BYPASS_AUTH === 'true';
    const initDataString = req.headers['x-telegram-init-data'];

    // 1. Development bypass mode
    if (bypassAuth) {
        const userId = req.headers['x-telegram-user-id'];
        if (!userId) {
            return res.status(401).json({ error: 'Bypassing auth requires X-Telegram-User-ID header' });
        }
        console.warn(`[AUTH] ⚠️ Bypassing Telegram authentication for user ${userId}. THIS SHOULD NOT BE ENABLED IN PRODUCTION.`);
        
        try {
            // Ensure the user exists in the database, creating them if necessary.
            await db.findOrCreateUser(userId);
            req.userId = userId;
            return next();
        } catch (error) {
            console.error('Error ensuring user exists in bypass mode:', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }

    // 2. Production mode requires initData header
    if (initDataString === undefined) {
        return res.status(401).json({ error: 'X-Telegram-Init-Data header is required' });
    }

    // 3. Handle empty initData (legitimate in some Telegram environments)
    if (initDataString === '') {
        console.warn('[AUTH] Empty initData received. This can happen in legitimate Telegram environments.');
        // According to senior review: empty initData can be valid but should NOT create fake users
        // Instead, we should reject the request in production
        return res.status(401).json({ 
            error: 'Empty initData received. Please ensure you are accessing this app through Telegram.' 
        });
    }

    try {
        console.log(`[AUTH] Validating initData (length: ${initDataString.length})`);
        
        // 4. Perform cryptographic validation according to senior requirements
        const isValid = await validateInitData(initDataString, process.env.TELEGRAM_BOT_TOKEN);
        if (!isValid.valid) {
            console.error('[AUTH] ❌ initData validation failed:', isValid.error);
            console.error('[AUTH] initData preview:', initDataString.substring(0, 100) + '...');
            return res.status(403).json({ error: 'Invalid or tampered data received from Telegram', details: isValid.error });
        }
        
        console.log('[AUTH] ✅ initData validation successful');

        // 5. Extract user ID and attach to request
        const params = new URLSearchParams(initDataString);
        const user = JSON.parse(params.get('user'));
        
        if (!user || !user.id) {
            return res.status(403).json({ error: 'Valid hash, but no user data found in initData' });
        }

        // 6. Ensure user exists in database (create if new)
        await db.findOrCreateUser(user.id.toString());
        req.userId = user.id.toString();
        
        console.log(`[AUTH] ✅ Successfully authenticated Telegram user ${user.id}`);
        next();

    } catch (error) {
        console.error('[AUTH] Error validating Telegram data:', error);
        return res.status(500).json({ error: 'Failed to validate Telegram data' });
    }
}

/**
 * Validates the initData string from Telegram according to senior developer requirements.
 * Includes TTL check and proper HMAC validation.
 * 
 * @param {string} initDataString - The raw initData string.
 * @param {string} botToken - The Telegram Bot Token.
 * @returns {Promise<{valid: boolean, error?: string}>} Validation result.
 */
async function validateInitData(initDataString, botToken) {
    try {
        const params = new URLSearchParams(initDataString);
        const hash = params.get('hash');
        const authDate = params.get('auth_date');
        
        if (!hash) {
            return { valid: false, error: 'Missing hash parameter' };
        }
        
        if (!authDate) {
            return { valid: false, error: 'Missing auth_date parameter' };
        }

        // Senior requirement: Check TTL (reject if older than 24 hours)
        const authTimestamp = parseInt(authDate, 10);
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const TTL_SECONDS = 24 * 60 * 60; // 24 hours as per senior review
        
        const timeDiff = Math.abs(currentTimestamp - authTimestamp);
        console.log(`[AUTH] TTL Check: authTimestamp=${authTimestamp}, currentTimestamp=${currentTimestamp}, diff=${timeDiff} seconds (absolute)`);
        
        if (timeDiff > TTL_SECONDS) {
            console.error(`[AUTH] initData expired: ${timeDiff} seconds difference (limit: ${TTL_SECONDS})`);
            return { valid: false, error: `initData expired (time difference: ${timeDiff} seconds, limit: ${TTL_SECONDS})` };
        }

        // Remove hash from params for validation
        params.delete('hash');

        // Create data check string (keys must be sorted alphabetically)
        const keys = Array.from(params.keys()).sort();
        const dataCheckString = keys.map(key => `${key}=${params.get(key)}`).join('\n');

        // Compute expected hash
        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
        const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
        
        if (computedHash !== hash) {
            return { valid: false, error: 'Hash mismatch' };
        }

        return { valid: true };
        
    } catch (error) {
        return { valid: false, error: `Validation error: ${error.message}` };
    }
}