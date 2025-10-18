import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup paths for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Debug environment variables
console.log('[ENV] DATABASE_TYPE:', process.env.DATABASE_TYPE);
console.log('[ENV] NODE_ENV:', process.env.NODE_ENV);
console.log('[ENV] DANGEROUSLY_BYPASS_AUTH:', process.env.DANGEROUSLY_BYPASS_AUTH);

// Import services
import * as db from './services/database.js';
import { interpretDream } from './services/dreamInterpreter.js';
import { verifyTelegramAuth } from './middleware/auth.js';
import axios from 'axios';

// Initialize database
await db.initializeDatabase();

// Express app
const app = express();
const PORT = process.env.PORT || 9000;

app.use(cors());
app.use(express.json());

// =============================================================================
// PUBLIC ROUTES
// =============================================================================

app.get('/', (req, res) => {
  res.json({ message: 'Morpheus Dream App - Simplified API' });
});

// =============================================================================
// PROTECTED ROUTES (all require Telegram auth)
// =============================================================================
app.use(verifyTelegramAuth);

// --- Profile Routes ---

app.get('/profile', async (req, res) => {
  try {
    const userProfile = await db.getProfile(req.userId);
    if (userProfile) {
      res.status(200).json(userProfile);
    } else {
      res.status(404).json({ error: 'Profile not found or empty' });
    }
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// Date conversion helper
const convertDateFormat = (dateString) => {
  if (!dateString) return null;
  
  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
    return dateString.split('T')[0];
  }
  
  const match = dateString.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  console.warn(`[SERVER] Invalid date format received: ${dateString}`);
  return null;
};

app.put('/profile', async (req, res) => {
  const { birthDate, birthTime, birthPlace, gender, onboardingCompleted } = req.body;
  let userProfile = (await db.getProfile(req.userId)) || {};

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[SERVER] 📥 Received profile update for user ${req.userId}:`, req.body);
  }

  if (onboardingCompleted !== undefined) {
    userProfile.onboardingCompleted = onboardingCompleted;
  }

  const convertedBirthDate = convertDateFormat(birthDate);
  if (birthDate && !convertedBirthDate) {
    return res.status(400).json({ error: 'Invalid birth date format. Expected DD.MM.YYYY or YYYY-MM-DD' });
  }
  
  userProfile.birthDate = convertedBirthDate;
  userProfile.birthTime = birthTime;
  userProfile.gender = gender;
  
  // Geocoding logic
  try {
    const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
    let geocodeResponse = null;

    if (birthPlace && birthPlace.placeId) {
      console.log(`[Geocode] Attempting geocoding with placeId: ${birthPlace.placeId}`);
      geocodeResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
        params: { place_id: birthPlace.placeId, key: apiKey, language: 'ru' }
      });
    } else if (birthPlace && birthPlace.description) {
      console.log(`[Geocode] Attempting geocoding with address: "${birthPlace.description}"`);
      geocodeResponse = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
        params: { address: birthPlace.description, key: apiKey, language: 'ru' }
      });
    }

    if (geocodeResponse && geocodeResponse.data.status === 'OK' && geocodeResponse.data.results.length > 0) {
      const result = geocodeResponse.data.results[0];
      const location = result.geometry.location;
      userProfile.birthPlace = result.formatted_address;
      userProfile.birthLatitude = location.lat;
      userProfile.birthLongitude = location.lng;
      console.log(`[Geocode] ✅ Success: ${userProfile.birthPlace} [${location.lat}, ${location.lng}]`);
    } else {
      if (geocodeResponse) {
        console.error(`[Geocode] ❌ Failed: ${geocodeResponse.data.status}`, geocodeResponse.data.error_message || '');
      }
      userProfile.birthPlace = (birthPlace && typeof birthPlace === 'object') ? birthPlace.description : birthPlace;
      delete userProfile.birthLatitude;
      delete userProfile.birthLongitude;
    }
  } catch (error) {
    console.error('[Geocode] 💥 Hard error during geocoding:', error.message);
    userProfile.birthPlace = (birthPlace && typeof birthPlace === 'object') ? birthPlace.description : birthPlace;
    delete userProfile.birthLatitude;
    delete userProfile.birthLongitude;
  }

  try {
    const updatedProfile = await db.updateProfile(req.userId, userProfile);
    res.status(200).json(updatedProfile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// --- Dream Routes ---

app.get('/dreams', async (req, res) => {
  try {
    const dreams = await db.getDreams(req.userId);
    const sortedDreams = dreams.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.status(200).json(sortedDreams);
  } catch (error) {
    console.error('Error fetching dreams:', error);
    res.status(500).json({ error: 'Failed to fetch dreams' });
  }
});

app.get('/dreams/:dreamId', async (req, res) => {
  const { dreamId } = req.params;
  console.log(`[Server] 🔍 Fetching dream by ID: ${dreamId} for user: ${req.userId}`);
  
  try {
    const dream = await db.getDreamById(req.userId, dreamId);
    if (!dream) {
      console.log(`[Server] ❌ Dream not found: ${dreamId} for user: ${req.userId}`);
      return res.status(404).json({ error: 'Dream not found' });
    }
    console.log(`[Server] ✅ Dream found: ${dreamId}`);
    res.status(200).json(dream);
  } catch (error) {
    console.error(`[Server] Error fetching dream ${dreamId}:`, error);
    res.status(500).json({ error: 'Failed to fetch dream' });
  }
});

app.delete('/dreams', async (req, res) => {
  const { dreamIds } = req.body;
  if (!dreamIds || !Array.isArray(dreamIds)) {
    return res.status(400).json({ error: 'dreamIds must be an array' });
  }
  
  try {
    await db.deleteDreams(req.userId, dreamIds);
    res.status(200).json({ message: 'Dreams deleted successfully' });
  } catch (error) {
    console.error('Error deleting dreams:', error);
    res.status(500).json({ error: 'Failed to delete dreams' });
  }
});

// --- NEW: Simple Dream Interpretation (no WebSocket!) ---

app.post('/interpretDream', async (req, res) => {
  const { text, date } = req.body;
  
  console.log(`[Server] 🌙 Interpretation request from user: ${req.userId}`);
  
  if (!text || !date) {
    return res.status(400).json({ error: 'text and date are required' });
  }

  try {
    // Get user profile for gender
    const userProfile = await db.getProfile(req.userId);
    const userGender = userProfile?.gender || 'male';
    
    // Convert date format if needed
    const dreamDate = date === 'today' ? new Date().toISOString().split('T')[0] : convertDateFormat(date);
    
    if (!dreamDate) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    console.log(`[Server] 🤖 Starting interpretation... (gender: ${userGender})`);
    
    // Single OpenAI call - may take 30-60 seconds
    const result = await interpretDream(req.userId, text, dreamDate, userGender);
    
    console.log(`[Server] ✅ Interpretation complete for dream ${result.id}`);
    res.status(200).json(result);
    
  } catch (error) {
    console.error('[Server] ❌ Dream interpretation error:', error);
    res.status(500).json({ 
      error: 'Failed to interpret dream',
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✨ Morpheus Backend running on http://localhost:${PORT}`);
  console.log(`🔧 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📦 Database: ${process.env.DATABASE_TYPE || 'json'}`);
});
