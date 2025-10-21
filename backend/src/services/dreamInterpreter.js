import OpenAI from 'openai';
import * as db from './database.js';

let client = null;

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
    // 2. Initialize OpenAI
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

    // 7. Save symbols
    for (let i = 0; i < data.symbols.length; i++) {
      await db.createDreamSymbol(dream.id, {
        title: data.symbols[i].title,
        interpretation: data.symbols[i].interpretation,
        category: null,  // For future analytics
        symbol_order: i + 1
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

