import OpenAI from 'openai';
import * as db from './database.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let client = null;

// Available colors for dream symbols (same as frontend)
const SYMBOL_COLORS = [
  '#8B5CF6', // фиолетовый
  '#06B6D4', // cyan
  '#10B981', // зелёный
  '#F59E0B', // оранжевый
  '#EF4444', // красный
  '#EC4899', // розовый
  '#6366F1', // индиго
  '#14B8A6', // teal
];

/**
 * Generate random color from predefined palette
 */
const generateRandomColor = () => {
  return SYMBOL_COLORS[Math.floor(Math.random() * SYMBOL_COLORS.length)];
};

// Load mock data from JSON file
let MOCK_INTERPRETATION = null;
try {
  const mockPath = resolve(__dirname, '../../mock-interpretation.json');
  MOCK_INTERPRETATION = JSON.parse(readFileSync(mockPath, 'utf-8'));
  console.log('[DreamInterpreter] 📦 Mock data loaded from mock-interpretation.json');
} catch (error) {
  console.error('[DreamInterpreter] ❌ Failed to load mock data:', error);
  // Fallback mock data
  MOCK_INTERPRETATION = {
    title: "Тестовый сон",
    introduction: "Моковые данные не загрузились. Это резервная интерпретация.",
    symbols: [
      { title: "Символ 1", interpretation: "Интерпретация 1", category: "общее" },
      { title: "Символ 2", interpretation: "Интерпретация 2", category: "общее" },
      { title: "Символ 3", interpretation: "Интерпретация 3", category: "общее" }
    ],
    advice: {
      title: "Совет",
      content: "Это тестовый совет из резервных моковых данных."
    }
  };
}

/**
 * Initialize OpenAI client
 */
const initializeOpenAI = () => {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log('🤖 OpenAI client initialized');
  }
  return client;
};

/**
 * Extract text from OpenAI response
 * @param {Object} response - OpenAI response object
 * @returns {string} Extracted text
 */
const extractResponseText = (response) => {
  if (response.output_text) {
    return response.output_text;
  }
  if (!response.output) return '';
  return response.output
    .map(block => {
      if (!block?.content) return '';
      return block.content
        .filter(item => item.type === 'output_text' || item.type === 'text')
        .map(item => item.text)
        .join('');
    })
    .join('');
};

/**
 * Main function: Interpret dream using OpenAI
 * @param {string} userId - Telegram user ID
 * @param {string} dreamText - User's dream text
 * @param {string} dreamDate - Dream date (YYYY-MM-DD)
 * @param {string} userGender - User gender ('male' or 'female')
 * @returns {Promise<Object>} Dream with interpretation
 */
export async function interpretDream(userId, dreamText, dreamDate, userGender = 'male') {
  console.log(`[DreamInterpreter] Starting interpretation for user ${userId}`);
  
  // Check if mock mode is enabled
  console.log(`[DreamInterpreter] 🔍 DEBUG: process.env.USE_MOCK_AI = "${process.env.USE_MOCK_AI}" (type: ${typeof process.env.USE_MOCK_AI})`);
  const useMockAI = process.env.USE_MOCK_AI === 'true';
  console.log(`[DreamInterpreter] 🔍 DEBUG: useMockAI = ${useMockAI}`);
  
  if (useMockAI) {
    console.log('[DreamInterpreter] 🎭 MOCK MODE enabled - using test data');
  } else {
    console.log('[DreamInterpreter] 🌐 REAL MODE - will call OpenAI API');
  }
  
  // 1. Create empty dream record in database
  const dream = await db.createDream(userId, {
    dream_text: dreamText,
    dream_date: dreamDate,
    title: null,
    introduction: null,
    advice_title: null,
    advice_content: null
  });

  console.log(`[DreamInterpreter] Created dream record with ID: ${dream.id}`);

  try {
    // 2. Use mock data if enabled
    if (useMockAI) {
      console.log('[DreamInterpreter] Using mock interpretation data');
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const data = MOCK_INTERPRETATION;
      
      // 3. Update dream with mock data
      await db.updateDream(dream.id, {
        title: data.title,
        introduction: data.introduction,
        advice_title: data.advice.title,
        advice_content: data.advice.content
      });

      console.log('[DreamInterpreter] Updated dream record with mock data');

      // 4. Save mock symbols with random colors
      for (let i = 0; i < data.symbols.length; i++) {
        await db.createDreamSymbol(dream.id, {
          title: data.symbols[i].title,
          interpretation: data.symbols[i].interpretation,
          category: null,
          symbol_order: i + 1,
          color: generateRandomColor()
        });
      }

      console.log(`[DreamInterpreter] Created ${data.symbols.length} mock symbol records`);

      // 5. Fetch and return complete dream
      const completeDream = await db.getDreamWithSymbols(dream.id);
      console.log('[DreamInterpreter] ✅ Mock interpretation complete');
      
      return completeDream;
    }
    
    // 2. Initialize OpenAI (real mode)
    initializeOpenAI();

    // 3. Call OpenAI Responses API (single request!)
    console.log('[DreamInterpreter] Calling OpenAI Responses API...');
    const response = await client.responses.create({
      prompt: {
        id: "pmpt_68de883ddb2c8194af2c136bf403a7410bebe0a38c798ba8",
        version: "13"
      },
      input: JSON.stringify({
        dream: dreamText,
        gender: userGender
      })
    });

    console.log('[DreamInterpreter] Received response from OpenAI');

    // 4. Extract and parse response
    const outputText = extractResponseText(response);
    
    if (!outputText) {
      throw new Error('OpenAI response did not contain any text output');
    }

    let data;
    try {
      data = JSON.parse(outputText);
    } catch (parseError) {
      console.error('[DreamInterpreter] Failed to parse JSON:', parseError);
      console.error('[DreamInterpreter] Raw output:', outputText.substring(0, 500));
      throw new Error('Failed to parse OpenAI response as JSON');
    }

    // 5. Validate response structure
    if (!data.title || !data.introduction || !data.symbols || !data.advice) {
      console.error('[DreamInterpreter] Invalid response structure:', data);
      throw new Error('OpenAI response missing required fields');
    }

    console.log(`[DreamInterpreter] Parsed: title="${data.title}", symbols=${data.symbols.length}`);

    // 6. Update dream with interpretation data
    await db.updateDream(dream.id, {
      title: data.title,
      introduction: data.introduction,
      advice_title: data.advice.title,
      advice_content: data.advice.content
    });

    console.log('[DreamInterpreter] Updated dream record');

    // 7. Save symbols with random colors
    for (let i = 0; i < data.symbols.length; i++) {
      await db.createDreamSymbol(dream.id, {
        title: data.symbols[i].title,
        interpretation: data.symbols[i].interpretation,
        category: null,  // For future analytics
        symbol_order: i + 1,
        color: generateRandomColor()
      });
    }

    console.log(`[DreamInterpreter] Created ${data.symbols.length} symbol records`);

    // 8. Fetch and return complete dream with symbols
    const completeDream = await db.getDreamWithSymbols(dream.id);
    console.log('[DreamInterpreter] ✅ Interpretation complete');
    
    return completeDream;

  } catch (error) {
    console.error('[DreamInterpreter] ❌ Error during interpretation:', error);
    
    // Mark dream as failed (optional: add status column to dreams table)
    try {
      await db.updateDream(dream.id, {
        title: '[ERROR]',
        introduction: `Failed to interpret: ${error.message}`
      });
    } catch (dbError) {
      console.error('[DreamInterpreter] Failed to update dream with error status:', dbError);
    }
    
    throw error;
  }
}

