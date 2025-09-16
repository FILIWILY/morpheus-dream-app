import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Настройка путей для ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Загружаем .env из корня проекта (../../.env относительно src/services/database.js)
// Это необходимо, так как database.js может импортироваться до загрузки .env в server.js
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Configuration
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV !== 'production';

// Новая логика: в dev режиме можем выбирать БД, в проде всегда PostgreSQL
const databaseType = isDevelopment 
  ? (process.env.DATABASE_TYPE || 'json') // По умолчанию JSON в dev
  : 'postgres'; // Всегда PostgreSQL в проде

const useJsonDatabase = databaseType === 'json';
const usePostgresDatabase = databaseType === 'postgres';

// Отладочная информация
console.log(`🔧 Database debug:`, {
  isDevelopment,
  DATABASE_TYPE_env: process.env.DATABASE_TYPE,
  NODE_ENV_env: process.env.NODE_ENV,
  databaseType,
  useJsonDatabase,
  usePostgresDatabase
});

console.log(`🔧 Database mode: ${useJsonDatabase ? 'JSON (db.json)' : 'PostgreSQL'}`);
console.log(`🔧 Environment: ${isDevelopment ? 'Development' : 'Production'}`);

// Дополнительная проверка переменных окружения
if (process.env.DATABASE_TYPE === 'postgres' && useJsonDatabase) {
  console.error(`❌ ОШИБКА: DATABASE_TYPE установлен как 'postgres', но используется JSON база данных!`);
  console.error(`   Проверьте правильность загрузки .env файла`);
}

// Для обратной совместимости
const useMockApi = useJsonDatabase;

// --- Database Connection (PostgreSQL) ---
let pool = null;

// Функция инициализации базы данных
export async function initializeDatabase() {
  if (usePostgresDatabase) {
    try {
      const { Pool } = await import('pg');
      
      // Определяем строку подключения в зависимости от окружения
      let connectionString;
      
      if (isDevelopment) {
        // В Docker dev окружении используем имя сервиса 'postgres'
        // В локальном dev окружении используем localhost:5433 (Docker PostgreSQL)
        connectionString = process.env.DEV_DATABASE_URL || 
          (process.env.DOCKER_ENV === 'true' 
            ? 'postgresql://di_admin:didi1234didi@postgres:5432/di'
            : 'postgresql://di_admin:didi1234didi@localhost:5433/di');
      } else {
        // Production всегда использует DATABASE_URL
        connectionString = process.env.DATABASE_URL;
      }
      
      // В Docker окружении SSL не используется, даже в продакшене
      const useSSL = isProduction && !process.env.DATABASE_URL?.includes('@postgres:');
      
      console.log(`🔧 PostgreSQL connection config:`, {
        isProduction,
        connectionString: connectionString?.replace(/:[^:@]*@/, ':***@'), // Hide password
        useSSL
      });
      
      pool = new Pool({
        connectionString,
        ssl: useSSL ? { rejectUnauthorized: false } : false,
      });

      pool.on('connect', () => {
        console.log(`🐘 Connected to PostgreSQL (${isDevelopment ? 'Development' : 'Production'})`);
      });

      pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
        if (isProduction) {
          process.exit(-1);
        } else {
          console.warn('⚠️  PostgreSQL error in development mode - continuing...');
        }
      });
      
      console.log('📦 PostgreSQL initialized');
      
      // В dev режиме создаем тестового пользователя
      if (isDevelopment) {
        await createTestUserIfNeeded();
      }
      
    } catch (error) {
      console.error('❌ PostgreSQL module not found or connection failed.');
      console.error('   Error:', error.message);
      
      if (isDevelopment) {
        console.warn('🔄 Development mode: Falling back to JSON database...');
        return true; // переключаемся на JSON в dev режиме
      } else {
        console.error('💥 Production mode: PostgreSQL is required!');
        process.exit(1);
      }
    }
  } else {
    console.log('📁 Using JSON database (db.json)');
  }
  
  return useJsonDatabase;
}

// Создание тестового пользователя для dev режима
async function createTestUserIfNeeded() {
  const testUserId = 'dev_test_user_123';
  
  try {
    // Проверяем, существует ли тестовый пользователь
    const existingUser = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [testUserId]);
    
    if (existingUser.rows.length === 0) {
      // Создаем тестового пользователя с ПУСТЫМ профилем
      await pool.query(`
        INSERT INTO users (telegram_id, birth_date, birth_time, birth_place, birth_latitude, birth_longitude)
        VALUES ($1, NULL, NULL, NULL, NULL, NULL)
      `, [
        testUserId
      ]);
      
      console.log('👤 Test user with an EMPTY profile created for development mode');
    } else {
      console.log('👤 Test user already exists');
    }
  } catch (error) {
    console.warn('⚠️  Could not create test user:', error.message);
    console.warn('   This is normal if database tables don\'t exist yet');
  }
}

// --- Mock Database (db.json) ---
const DB_PATH = path.join(__dirname, '..', '..', 'db.json');

const readDB = () => {
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ users: {} }, null, 2));
    return { users: {} };
  }
  try {
    const dbRaw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(dbRaw);
  } catch (e) {
    console.error("Error reading or parsing db.json:", e);
    return { users: {} };
  }
};

const writeDB = (data) => {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
};

// --- Data Access Layer ---

/**
 * Finds a user by their Telegram ID or creates a new one if not found.
 * This function acts as a "get or create" operation.
 * @param {string | number} telegramId - The user's Telegram ID.
 * @returns {Promise<object>} The user object from the database.
 */
export async function findOrCreateUser(telegramId) {
  if (!usePostgresDatabase) {
    const db = readDB();
    if (!db.users[telegramId]) {
      db.users[telegramId] = { dreams: [], profile: {} };
      writeDB(db);
    }
    // Note: In mock mode, we return the whole user object from db.json
    return db.users[telegramId];
  }

  // Production mode (PostgreSQL)
  try {
    // Check if user exists
    let res = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
    if (res.rows.length > 0) {
      return res.rows[0];
    }

    // If not, create a new user
    res = await pool.query('INSERT INTO users (telegram_id) VALUES ($1) RETURNING *', [telegramId]);
    return res.rows[0];
  } catch (error) {
    console.error('Error in findOrCreateUser:', error);
    throw error;
  }
}

/**
 * Retrieves a user's profile.
 * In production, this means fetching specific columns from the 'users' table.
 * In mock mode, it returns the 'profile' object.
 * @param {string | number} telegramId - The user's Telegram ID.
 * @returns {Promise<object|null>} The user's profile object or null if not found.
 */
export async function getProfile(telegramId) {
    if (!usePostgresDatabase) {
        const db = readDB();
        const user = db.users[telegramId];
        return (user && user.profile && Object.keys(user.profile).length > 0) ? user.profile : null;
    }

    try {
        const res = await pool.query(
            'SELECT birth_date, birth_time, birth_place, birth_latitude, birth_longitude, "natalChart", onboarding_completed FROM users WHERE telegram_id = $1',
            [telegramId]
        );

        if (res.rows.length > 0) {
            const profile = res.rows[0];
            
            // Функция для преобразования даты из YYYY-MM-DD в DD.MM.YYYY для фронтенда
            const formatDateForFrontend = (dateString) => {
                if (!dateString) return null;
                const date = new Date(dateString);
                if (isNaN(date.getTime())) return dateString; // Если дата невалидна, возвращаем как есть
                
                const day = date.getDate().toString().padStart(2, '0');
                const month = (date.getMonth() + 1).toString().padStart(2, '0');
                const year = date.getFullYear();
                return `${day}.${month}.${year}`;
            };
            
            // Функция для форматирования времени (убираем секунды если есть)
            const formatTimeForFrontend = (timeString) => {
                if (!timeString) return null;
                // Если время в формате HH:MM:SS, обрезаем до HH:MM
                return timeString.split(':').slice(0, 2).join(':');
            };
            
            // Convert DB naming to camelCase for consistency with the frontend
            return {
                birthDate: formatDateForFrontend(profile.birth_date),
                birthTime: formatTimeForFrontend(profile.birth_time),
                birthPlace: profile.birth_place,
                birthLatitude: profile.birth_latitude,
                birthLongitude: profile.birth_longitude,
                natalChart: profile.natalChart,
                onboardingCompleted: profile.onboarding_completed
            };
        } else {
            // User not found, create a new profile with default values
            await pool.query(
                'INSERT INTO users (telegram_id, onboarding_completed) VALUES ($1, $2)',
                [telegramId, false]
            );
            return {
                birthDate: null,
                birthTime: null,
                birthPlace: null,
                birthLatitude: null,
                birthLongitude: null,
                natalChart: null,
                onboardingCompleted: false
            };
        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        throw error;
    }
}

/**
 * Updates a user's profile.
 * @param {string | number} telegramId - The user's Telegram ID.
 * @param {object} profileData - The profile data to update.
 * @returns {Promise<object>} The updated profile object.
 */
export async function updateProfile(telegramId, profileData) {
    if (!usePostgresDatabase) {
        const db = readDB();
        if (!db.users[telegramId]) {
            db.users[telegramId] = { dreams: [], profile: {} };
        }
        db.users[telegramId].profile = profileData;
        writeDB(db);
        return profileData;
    }

    const { birthDate, birthTime, birthPlace, birthLatitude, birthLongitude, natalChart, onboardingCompleted } = profileData;

    // Build the query dynamically to only update provided fields
    const fields = [];
    const values = [];
    let queryIndex = 1;

    if (birthDate !== undefined) { fields.push(`birth_date = $${queryIndex++}`); values.push(birthDate); }
    if (birthTime !== undefined) { fields.push(`birth_time = $${queryIndex++}`); values.push(birthTime); }
    if (birthPlace !== undefined) { fields.push(`birth_place = $${queryIndex++}`); values.push(birthPlace); }
    if (birthLatitude !== undefined) { fields.push(`birth_latitude = $${queryIndex++}`); values.push(birthLatitude); }
    if (birthLongitude !== undefined) { fields.push(`birth_longitude = $${queryIndex++}`); values.push(birthLongitude); }
    if (natalChart !== undefined) { fields.push(`"natalChart" = $${queryIndex++}`); values.push(natalChart); }
    if (onboardingCompleted !== undefined) { fields.push(`onboarding_completed = $${queryIndex++}`); values.push(onboardingCompleted); }

    if (fields.length === 0) {
        return getProfile(telegramId); // Nothing to update
    }

    values.push(telegramId); // For the WHERE clause

    const queryString = `
        UPDATE users SET
            ${fields.join(', ')}
        WHERE telegram_id = $${queryIndex}
        RETURNING birth_date, birth_time, birth_place, birth_latitude, birth_longitude, "natalChart", onboarding_completed
    `;

    try {
        const res = await pool.query(queryString, values);

        if (res.rows.length === 0) {
            // This might happen if the user doesn't exist, though findOrCreateUser should prevent this.
            // We'll create the user and then attempt the update again.
            await findOrCreateUser(telegramId);
            const secondAttempt = await pool.query(queryString, values);
            if (secondAttempt.rows.length === 0) throw new Error("User not found even after creation attempt.");
            res.rows[0] = secondAttempt.rows[0];
        }

        const profile = res.rows[0];
        
        // Используем те же функции форматирования
        const formatDateForFrontend = (dateString) => {
            if (!dateString) return null;
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;
            
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}.${month}.${year}`;
        };
        
        const formatTimeForFrontend = (timeString) => {
            if (!timeString) return null;
            return timeString.split(':').slice(0, 2).join(':');
        };
        
        return {
            birthDate: formatDateForFrontend(profile.birth_date),
            birthTime: formatTimeForFrontend(profile.birth_time),
            birthPlace: profile.birth_place,
            birthLatitude: profile.birth_latitude,
            birthLongitude: profile.birth_longitude,
            natalChart: profile.natalChart,
            onboardingCompleted: profile.onboarding_completed
        };
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
}

/**
 * Saves a new dream interpretation.
 * @param {string | number} telegramId - The user's Telegram ID.
 * @param {object} dreamData - The full dream object to save.
 * @returns {Promise<object>} The saved dream object.
 */
export async function saveDream(telegramId, dreamData) {
    if (!usePostgresDatabase) {
        const db = readDB();
        if (!db.users[telegramId]) {
            db.users[telegramId] = { dreams: [], profile: {} };
        }
        db.users[telegramId].dreams.push(dreamData);
        writeDB(db);
        return dreamData;
    }
    
    // In Postgres, we separate the core fields from the 'interpretation' JSONB field.
    const { id, date, originalText, activeLens, ...interpretationData } = dreamData;
    
    try {
        console.log(`[DB] Saving dream to PostgreSQL: ID=${id}, user=${telegramId}, date=${date}`);
        await pool.query(
            `INSERT INTO dreams (id, user_id, dream_date, dream_text, interpretation, active_lens)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, telegramId, date, originalText, interpretationData, activeLens]
        );
        console.log(`[DB] ✅ Dream saved successfully: ${id}`);
        return dreamData; // Return the original, complete object for consistency
    } catch (error) {
        console.error('[DB] Error saving dream:', error);
        throw error;
    }
}

/**
 * Retrieves all dreams for a given user.
 * @param {string | number} telegramId - The user's Telegram ID.
 * @returns {Promise<Array<object>>} An array of dream objects.
 */
export async function getDreams(telegramId) {
    if (!usePostgresDatabase) {
        const db = readDB();
        return db.users[telegramId]?.dreams || [];
    }

    try {
        const query = `
        SELECT
          id,
          dream_date AS date,
          dream_text AS "originalText",
          active_lens AS "activeLens",
          interpretation
        FROM dreams
        WHERE user_id = $1
        ORDER BY created_at DESC
      `;
      const { rows } = await pool.query(query, [telegramId]);

      // Reconstruct the full dream object, merging the interpretation fields
      // back to the top level to match the structure of db.json.
      return rows.map(row => ({
          id: row.id,
          date: row.date,
          originalText: row.originalText,
          activeLens: row.activeLens,
          ...row.interpretation
      }));
    } catch (error) {
      console.error('Error fetching dreams:', error);
      throw error;
    }
}

/**
 * Retrieves a single dream by its ID for a given user.
 * @param {string | number} telegramId - The user's Telegram ID.
 * @param {string} dreamId - The UUID of the dream.
 * @returns {Promise<object|null>} The dream object or null if not found.
 */
export async function getDreamById(telegramId, dreamId) {
    if (!usePostgresDatabase) {
        const db = readDB();
        const userDreams = db.users[telegramId]?.dreams || [];
        return userDreams.find(d => d.id === dreamId) || null;
    }

    try {
        console.log(`[DB] Fetching dream from PostgreSQL: ID=${dreamId}, user=${telegramId}`);
        const res = await pool.query(
            `SELECT id, dream_date AS date, dream_text AS "originalText", active_lens AS "activeLens", interpretation
             FROM dreams
             WHERE user_id = $1 AND id = $2`,
            [telegramId, dreamId]
        );

        if (res.rows.length === 0) {
            console.log(`[DB] ❌ Dream not found in PostgreSQL: ID=${dreamId}, user=${telegramId}`);
            return null;
        }

        const row = res.rows[0];
        console.log(`[DB] ✅ Dream found in PostgreSQL: ${dreamId}`);
        // Reconstruct the full dream object to match db.json structure
        return {
            id: row.id,
            date: row.date,
            originalText: row.originalText,
            activeLens: row.activeLens,
            ...row.interpretation
        };
    } catch (error) {
        console.error('[DB] Error fetching dream by ID:', error);
        throw error;
    }
}

/**
 * Deletes multiple dreams by their IDs for a given user.
 * @param {string | number} telegramId - The user's Telegram ID.
 * @param {Array<string>} dreamIds - An array of dream UUIDs to delete.
 * @returns {Promise<number>} The number of dreams deleted.
 */
export async function deleteDreams(telegramId, dreamIds) {
    if (!usePostgresDatabase) {
        const db = readDB();
        if (!db.users[telegramId]) return 0;
        const initialCount = db.users[telegramId].dreams.length;
        db.users[telegramId].dreams = db.users[telegramId].dreams.filter(
            dream => !dreamIds.includes(dream.id)
        );
        writeDB(db);
        return initialCount - db.users[telegramId].dreams.length;
    }

    try {
        const res = await pool.query(
            `DELETE FROM dreams
             WHERE user_id = $1 AND id = ANY($2::uuid[])
             RETURNING id`,
            [telegramId, dreamIds]
        );
        return res.rowCount ?? 0;
    } catch (error) {
        console.error('Error deleting dreams:', error);
        throw error;
    }
}

/**
 * Updates a specific field within a dream's interpretation JSONB object.
 * This is a flexible function to update UI state like active lens, tarot revealed, etc.
 * @param {string | number} telegramId The user's Telegram ID.
 * @param {string} dreamId The UUID of the dream to update.
 * @param {string} lens The key of the lens to update (e.g., 'astrology', 'tarot').
 * @param {object} stateUpdate The new state object to merge into the lens.
 * @returns {Promise<object>} The updated lens object.
 */
export async function updateLensState(telegramId, dreamId, lens, stateUpdate) {
    if (!usePostgresDatabase) {
        const db = readDB();
        const dream = db.users[telegramId]?.dreams.find(d => d.id === dreamId);
        if (!dream) throw new Error("Dream not found in mock DB");

        if (!dream.lenses[lens]) dream.lenses[lens] = {};
        if (!dream.lenses[lens].state) dream.lenses[lens].state = {};
        
        dream.lenses[lens].state = { ...dream.lenses[lens].state, ...stateUpdate };

        writeDB(db);
        return dream.lenses[lens];
    }
    
    try {
        // This query is complex because we are merging a JSON object, not just replacing it.
        // It ensures that we can add or update keys in the 'state' object without overwriting other keys.
        const res = await pool.query(
            `UPDATE dreams
             SET interpretation = jsonb_set(
                 interpretation,
                 '{lenses,${lens},state}',
                 COALESCE(interpretation#>'{lenses,${lens},state}', '{}'::jsonb) || $3::jsonb,
                 true
             )
             WHERE user_id = $1 AND id = $2
             RETURNING interpretation`,
            [telegramId, dreamId, stateUpdate]
        );

        if (res.rows.length === 0) {
            throw new Error("Dream not found or user mismatch.");
        }
        
        const updatedInterpretation = res.rows[0].interpretation;
        return updatedInterpretation.lenses[lens];
    } catch (error) {
        console.error('Error updating lens state:', error);
        throw error;
    }
}

/**
 * Updates the active lens for a specific dream.
 * @param {string | number} telegramId The user's Telegram ID.
 * @param {string} dreamId The UUID of the dream to update.
 * @param {string | null} activeLens The name of the active lens or null.
 * @returns {Promise<void>}
 */
export async function updateActiveLens(telegramId, dreamId, activeLens) {
    if (!usePostgresDatabase) {
        const db = readDB();
        const dream = db.users[telegramId]?.dreams.find(d => d.id === dreamId);
        if (dream) {
            dream.activeLens = activeLens;
            writeDB(db);
        }
        return;
    }

    try {
        await pool.query(
            `UPDATE dreams
             SET active_lens = $3
             WHERE user_id = $1 AND id = $2`,
            [telegramId, dreamId, activeLens]
        );
    } catch (error) {
        console.error('Error updating active lens:', error);
        throw error;
    }
}
