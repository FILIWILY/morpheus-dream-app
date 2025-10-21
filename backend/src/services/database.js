import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Setup paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Configuration
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;
const databaseType = isDevelopment 
  ? (process.env.DATABASE_TYPE || 'json')
  : 'postgres';

const useJsonDatabase = databaseType === 'json';
const usePostgresDatabase = databaseType === 'postgres';

console.log(`🔧 Database mode: ${useJsonDatabase ? 'JSON (db.json)' : 'PostgreSQL'}`);

// =============================================================================
// PostgreSQL Connection
// =============================================================================
let pool = null;

export async function initializeDatabase() {
  if (usePostgresDatabase) {
    try {
      const { Pool } = await import('pg');
      
      let connectionString;
      if (process.env.DOCKER_ENV === 'true') {
        connectionString = process.env.DATABASE_URL;
      } else {
        connectionString = process.env.DEV_DATABASE_URL || 'postgresql://di_admin:didi1234didi@localhost:5433/di';
      }

      if (!connectionString) {
        console.error('❌ FATAL: Could not determine database connection string!');
        process.exit(1);
      }
      
      const useSSL = isProduction && !connectionString.includes('@postgres:');
      
      pool = new Pool({
        connectionString,
        ssl: useSSL ? { rejectUnauthorized: false } : false,
      });

      pool.on('connect', () => {
        console.log(`🐘 Connected to PostgreSQL`);
      });

      pool.on('error', (err) => {
        console.error('Unexpected error on idle client', err);
        if (isProduction) process.exit(-1);
      });
      
      console.log('📦 PostgreSQL initialized');
    } catch (error) {
      console.error('❌ Failed to initialize PostgreSQL:', error);
      throw error;
    }
  } else {
    console.log('📦 JSON database initialized (db.json)');
  }
}

// =============================================================================
// JSON Database (for development)
// =============================================================================
const DB_FILE = path.join(process.cwd(), 'backend', 'db.json');

function readJsonDb() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.warn('⚠️  db.json not found or invalid, creating new');
    return { users: {}, dreams: [] };
  }
}

function writeJsonDb(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// =============================================================================
// USER FUNCTIONS (NO CHANGES - preserve Telegram auth!)
// =============================================================================

export async function findOrCreateUser(telegramId) {
  if (usePostgresDatabase) {
    const result = await pool.query(
      `INSERT INTO users (telegram_id, onboarding_completed) 
       VALUES ($1, FALSE) 
       ON CONFLICT (telegram_id) DO NOTHING 
       RETURNING *`,
      [telegramId]
    );
    
    if (result.rows.length === 0) {
      const existingUser = await pool.query(
        'SELECT * FROM users WHERE telegram_id = $1',
        [telegramId]
      );
      return existingUser.rows[0];
    }
    
    return result.rows[0];
  } else {
    const db = readJsonDb();
    if (!db.users[telegramId]) {
      db.users[telegramId] = {
        telegram_id: telegramId,
        created_at: new Date().toISOString(),
        onboarding_completed: false
      };
      writeJsonDb(db);
    }
    return db.users[telegramId];
  }
}

export async function getProfile(telegramId) {
  if (usePostgresDatabase) {
    const result = await pool.query(
      'SELECT * FROM users WHERE telegram_id = $1',
            [telegramId]
        );

    if (result.rows.length === 0) return null;
    
    const user = result.rows[0];
            return {
      birthDate: user.birth_date,
      birthTime: user.birth_time,
      birthPlace: user.birth_place,
      birthLatitude: user.birth_latitude,
      birthLongitude: user.birth_longitude,
      gender: user.gender,
      onboardingCompleted: user.onboarding_completed,
      userId: user.telegram_id,
      telegramId: user.telegram_id
            };
        } else {
    const db = readJsonDb();
    const user = db.users[telegramId];
    if (!user) return null;
    
            return {
      birthDate: user.birth_date,
      birthTime: user.birth_time,
      birthPlace: user.birth_place,
      birthLatitude: user.birth_latitude,
      birthLongitude: user.birth_longitude,
      gender: user.gender,
      onboardingCompleted: user.onboarding_completed,
      userId: telegramId,
      telegramId: telegramId
    };
  }
}

export async function updateProfile(telegramId, profileData) {
  if (usePostgresDatabase) {
    const result = await pool.query(
      `UPDATE users 
       SET birth_date = $2, birth_time = $3, birth_place = $4, 
           birth_latitude = $5, birth_longitude = $6, gender = $7,
           onboarding_completed = $8
       WHERE telegram_id = $1
       RETURNING *`,
      [
        telegramId,
        profileData.birthDate,
        profileData.birthTime,
        profileData.birthPlace,
        profileData.birthLatitude,
        profileData.birthLongitude,
        profileData.gender,
        profileData.onboardingCompleted
      ]
    );
    
    // Convert snake_case to camelCase for frontend
    const user = result.rows[0];
    return {
      birthDate: user.birth_date,
      birthTime: user.birth_time,
      birthPlace: user.birth_place,
      birthLatitude: user.birth_latitude,
      birthLongitude: user.birth_longitude,
      gender: user.gender,
      onboardingCompleted: user.onboarding_completed,
      userId: user.telegram_id,
      telegramId: user.telegram_id
    };
  } else {
    const db = readJsonDb();
    if (!db.users[telegramId]) {
      db.users[telegramId] = { telegram_id: telegramId };
    }
    
    db.users[telegramId].birth_date = profileData.birthDate;
    db.users[telegramId].birth_time = profileData.birthTime;
    db.users[telegramId].birth_place = profileData.birthPlace;
    db.users[telegramId].birth_latitude = profileData.birthLatitude;
    db.users[telegramId].birth_longitude = profileData.birthLongitude;
    db.users[telegramId].gender = profileData.gender;
    db.users[telegramId].onboarding_completed = profileData.onboardingCompleted;
    
    writeJsonDb(db);
    
    // Return camelCase format (consistent with PostgreSQL version)
    const user = db.users[telegramId];
    return {
      birthDate: user.birth_date,
      birthTime: user.birth_time,
      birthPlace: user.birth_place,
      birthLatitude: user.birth_latitude,
      birthLongitude: user.birth_longitude,
      gender: user.gender,
      onboardingCompleted: user.onboarding_completed,
      userId: telegramId,
      telegramId: telegramId
    };
  }
}

// =============================================================================
// DREAM FUNCTIONS (NEW - simplified)
// =============================================================================

export async function createDream(userId, dreamData) {
  if (usePostgresDatabase) {
    const result = await pool.query(
      `INSERT INTO dreams (user_id, dream_date, dream_text, title, introduction, advice_title, advice_content)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        dreamData.dream_date,
        dreamData.dream_text,
        dreamData.title,
        dreamData.introduction,
        dreamData.advice_title,
        dreamData.advice_content
      ]
    );
    
    return result.rows[0];
  } else {
    const db = readJsonDb();
    const newDream = {
      id: generateUUID(),
      user_id: userId,
      dream_date: dreamData.dream_date,
      dream_text: dreamData.dream_text,
      title: dreamData.title,
      introduction: dreamData.introduction,
      advice_title: dreamData.advice_title,
      advice_content: dreamData.advice_content,
      created_at: new Date().toISOString(),
      symbols: []
    };
    
    db.dreams.push(newDream);
    writeJsonDb(db);
    return newDream;
  }
}

export async function updateDream(dreamId, updateData) {
  if (usePostgresDatabase) {
    const result = await pool.query(
      `UPDATE dreams 
       SET title = COALESCE($2, title),
           introduction = COALESCE($3, introduction),
           advice_title = COALESCE($4, advice_title),
           advice_content = COALESCE($5, advice_content)
       WHERE id = $1
       RETURNING *`,
      [
        dreamId,
        updateData.title,
        updateData.introduction,
        updateData.advice_title,
        updateData.advice_content
      ]
    );
    
    return result.rows[0];
  } else {
    const db = readJsonDb();
    const dream = db.dreams.find(d => d.id === dreamId);
    
    if (!dream) throw new Error('Dream not found');
    
    if (updateData.title !== undefined) dream.title = updateData.title;
    if (updateData.introduction !== undefined) dream.introduction = updateData.introduction;
    if (updateData.advice_title !== undefined) dream.advice_title = updateData.advice_title;
    if (updateData.advice_content !== undefined) dream.advice_content = updateData.advice_content;
    
    writeJsonDb(db);
    return dream;
  }
}

export async function createDreamSymbol(dreamId, symbolData) {
  if (usePostgresDatabase) {
    const result = await pool.query(
      `INSERT INTO dream_symbols (dream_id, title, interpretation, category, symbol_order, color)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        dreamId,
        symbolData.title,
        symbolData.interpretation,
        symbolData.category,
        symbolData.symbol_order,
        symbolData.color || null
      ]
    );
    
    return result.rows[0];
  } else {
    const db = readJsonDb();
    const dream = db.dreams.find(d => d.id === dreamId);
    
    if (!dream) throw new Error('Dream not found');
    
    const newSymbol = {
      id: generateUUID(),
      dream_id: dreamId,
      title: symbolData.title,
      interpretation: symbolData.interpretation,
      category: symbolData.category,
      symbol_order: symbolData.symbol_order,
      color: symbolData.color || null,
      created_at: new Date().toISOString()
    };
    
    dream.symbols.push(newSymbol);
    writeJsonDb(db);
    return newSymbol;
  }
}

export async function getDreamWithSymbols(dreamId) {
  if (usePostgresDatabase) {
    const dreamResult = await pool.query(
      'SELECT * FROM dreams WHERE id = $1',
      [dreamId]
    );
    
    if (dreamResult.rows.length === 0) return null;
    
    const dream = dreamResult.rows[0];
    
    const symbolsResult = await pool.query(
      'SELECT * FROM dream_symbols WHERE dream_id = $1 ORDER BY symbol_order ASC',
      [dreamId]
    );
    
    return {
      id: dream.id,
      userId: dream.user_id,
      date: dream.dream_date,
      dreamText: dream.dream_text,
      title: dream.title,
      introduction: dream.introduction,
      advice: {
        title: dream.advice_title,
        content: dream.advice_content
      },
      symbols: symbolsResult.rows.map(s => ({
        id: s.id,
        title: s.title,
        interpretation: s.interpretation,
        category: s.category,
        order: s.symbol_order,
        viewed: s.viewed || false,
        color: s.color || null
      })),
      createdAt: dream.created_at
    };
  } else {
    const db = readJsonDb();
    const dream = db.dreams.find(d => d.id === dreamId);
    
    if (!dream) return null;
    
    return {
      id: dream.id,
      userId: dream.user_id,
      date: dream.dream_date,
      dreamText: dream.dream_text,
      title: dream.title,
      introduction: dream.introduction,
      advice: {
        title: dream.advice_title,
        content: dream.advice_content
      },
      symbols: (dream.symbols || []).sort((a, b) => a.symbol_order - b.symbol_order).map(s => ({
        id: s.id,
        title: s.title,
        interpretation: s.interpretation,
        category: s.category,
        order: s.symbol_order
      })),
      createdAt: dream.created_at
    };
  }
}

export async function getDreams(userId) {
  if (usePostgresDatabase) {
    const result = await pool.query(
      `SELECT d.*, 
              COUNT(ds.id) as symbol_count
       FROM dreams d
       LEFT JOIN dream_symbols ds ON d.id = ds.dream_id
       WHERE d.user_id = $1
       GROUP BY d.id
       ORDER BY d.created_at DESC`,
      [userId]
    );
    
    return result.rows.map(dream => ({
      id: dream.id,
      date: dream.dream_date,
      title: dream.title,
      introduction: dream.introduction,
      dreamText: dream.dream_text,
      symbolCount: parseInt(dream.symbol_count)
    }));
  } else {
    const db = readJsonDb();
    return db.dreams
      .filter(d => d.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map(dream => ({
        id: dream.id,
        date: dream.dream_date,
        title: dream.title,
        introduction: dream.introduction,
        dreamText: dream.dream_text,
        symbolCount: (dream.symbols || []).length
      }));
  }
}

export async function getDreamById(userId, dreamId) {
  const dream = await getDreamWithSymbols(dreamId);
  
  if (!dream || dream.userId !== userId) {
            return null;
        }

  return dream;
}

export async function deleteDreams(userId, dreamIds) {
  if (usePostgresDatabase) {
    await pool.query(
      'DELETE FROM dreams WHERE user_id = $1 AND id = ANY($2)',
      [userId, dreamIds]
    );
  } else {
    const db = readJsonDb();
    db.dreams = db.dreams.filter(d => 
      !(d.user_id === userId && dreamIds.includes(d.id))
    );
    writeJsonDb(db);
  }
}

// =============================================================================
// SYMBOL INTERACTIONS
// =============================================================================
export async function markSymbolAsViewed(symbolId) {
  if (usePostgresDatabase) {
    await pool.query(
      'UPDATE dream_symbols SET viewed = TRUE WHERE id = $1',
      [symbolId]
    );
  } else {
    const db = readJsonDb();
    const symbol = db.dream_symbols?.find(s => s.id === symbolId);
    if (symbol) {
      symbol.viewed = true;
      writeJsonDb(db);
    }
  }
}

// =============================================================================
// UTILITY
// =============================================================================
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
