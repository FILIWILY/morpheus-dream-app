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
      
      pool = new Pool({
        connectionString,
        ssl: isProduction ? { rejectUnauthorized: false } : false,
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
      // Создаем тестового пользователя
      await pool.query(`
        INSERT INTO users (telegram_id, birth_date, birth_time, birth_place, birth_latitude, birth_longitude)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        testUserId,
        '1990-01-01', // Дата рождения для тестов
        '12:00:00',   // Время рождения
        'Moscow, Russia', // Место рождения
        55.7558,      // Широта Москвы
        37.6173       // Долгота Москвы
      ]);
      
      console.log('👤 Test user created for development mode');
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
            'SELECT birth_date, birth_time, birth_place, birth_latitude, birth_longitude, "natalChart" FROM users WHERE telegram_id = $1',
            [telegramId]
        );

        if (res.rows.length > 0) {
            const profile = res.rows[0];
            // Convert DB naming to camelCase for consistency with the frontend
            return {
                birthDate: profile.birth_date,
                birthTime: profile.birth_time,
                birthPlace: profile.birth_place,
                birthLatitude: profile.birth_latitude,
                birthLongitude: profile.birth_longitude,
                natalChart: profile.natalChart
            };
        }
        return null;
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

    const { birthDate, birthTime, birthPlace, birthLatitude, birthLongitude, natalChart } = profileData;
    try {
        const res = await pool.query(
            `UPDATE users SET
                birth_date = $1,
                birth_time = $2,
                birth_place = $3,
                birth_latitude = $4,
                birth_longitude = $5,
                "natalChart" = $6
            WHERE telegram_id = $7
            RETURNING birth_date, birth_time, birth_place, birth_latitude, birth_longitude, "natalChart"`,
            [birthDate, birthTime, birthPlace, birthLatitude, birthLongitude, natalChart, telegramId]
        );
        const profile = res.rows[0];
        return {
            birthDate: profile.birth_date,
            birthTime: profile.birth_time,
            birthPlace: profile.birth_place,
            birthLatitude: profile.birth_latitude,
            birthLongitude: profile.birth_longitude,
            natalChart: profile.natalChart
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
        await pool.query(
            `INSERT INTO dreams (id, user_id, dream_date, dream_text, interpretation, active_lens)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [id, telegramId, date, originalText, interpretationData, activeLens]
        );
        return dreamData; // Return the original, complete object for consistency
    } catch (error) {
        console.error('Error saving dream:', error);
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
        const res = await pool.query(
            `SELECT id, dream_date AS date, dream_text AS "originalText", active_lens AS "activeLens", interpretation
             FROM dreams
             WHERE user_id = $1 AND id = $2`,
            [telegramId, dreamId]
        );

        if (res.rows.length === 0) {
            return null;
        }

        const row = res.rows[0];
        // Reconstruct the full dream object to match db.json structure
        return {
            id: row.id,
            date: row.date,
            originalText: row.originalText,
            activeLens: row.activeLens,
            ...row.interpretation
        };
    } catch (error) {
        console.error('Error fetching dream by ID:', error);
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
