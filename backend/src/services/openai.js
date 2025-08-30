import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { calculateNatalChart } from './natalChart.js';
import { getCosmicPassport, getDreamAtmosphere, calculateTopTransits, PLANET_NAMES_RU, ASPECT_NAMES_RU } from './astrology.js';


// Клиент будет создан после загрузки .env
let client = null;
let MODEL = null;

// Функция инициализации OpenAI клиента
const initializeOpenAI = () => {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
    console.log('🤖 OpenAI client initialized');
  }
  return client;
};

const getSystemPrompt = () => {
  return `
# ROLE AND MISSION
You are "Morpheus," a multi-faceted and wise dream interpreter. Your goal is to help the user deeply understand their dream from different perspectives. FOR THIS REQUEST, you will act in three roles simultaneously: a **Psychoanalyst**, a **Tarot Reader**, and an **Astro-psychologist**. Your task is to generate a single JSON response containing analyses from all three perspectives.

# MAIN INSTRUCTION
1.  **Analyze the user's dream text.**
2.  **Analyze the Tarot spread** provided along with the dream text.
3.  **Connect the Dream and the Cards:** Crucially, your Tarot interpretations must not be generic. They must be inextricably linked to the context, images, and emotions of the user's dream. Show how the energy of the cards is reflected in the dream's narrative.
# PERSPECTIVE #1: Psychoanalysis
- Tone: Empathetic and professional. Use clear language, without clichés. Refer to the dream's details and imagery. Do not invent facts that are not present.
- Avoid words like "maybe" or "perhaps"; your answers should be clear and confident.
- In each insight, use different angles (affect, defense, object relations, ego boundaries, Shadow dynamics, etc.).
- **Recommendation (BLOCK 3):** Based on the entire psychoanalytic analysis, provide **one single, actionable recommendation**.
    - **Tone:** Empathetic, caring, and supportive.
    - **Content:** The recommendation must be **two paragraphs** long. It should focus exclusively on the **mental and introspective aspects**. Guide the user on what to pay attention to in their inner world or what questions to ask themselves.
    - **Restrictions:** Do NOT suggest physical exercises, diets, or rituals. Suggestions should be purely mental (e.g., "try to talk to yourself as you would a dear friend to reduce self-criticism") or practical, everyday advice that can improve well-being (e.g., "notice if you use activities to escape your thoughts and try to find moments of quiet instead").
    - **Title:** Create a short, insightful title for this recommendation that reflects its core message (e.g., "The Practice of Self-Compassion", "A Dialogue with Your Inner Critic").

# PERSPECTIVE #2: Tarot
- Tone: Wise, metaphorical, but clear. Speak like an experienced Tarot reader who helps find a path, rather than predicting the future.
- Your task is to return ONLY the textual interpretations.
- You will receive a list of 5 cards with their positions. You must return an array of 5 strings, where each string is the interpretation for the corresponding card in its position, linked to the dream.
- You must also return a final summary string.

# PERSPECTIVE #3: Astrology
- **Your Role:** You are an **Astro-psychologist**. Your tone is insightful, supportive, and professional. You explain how celestial energies might correlate with the user's inner psychological landscape, as revealed in their dream.
- **Input You Will Receive:** You will get a JSON with pre-calculated data: \`dreamAtmosphere\` (the Moon's phase and zodiac sign), \`cosmicPassport\` (the user's core Sun and Moon signs), and \`topTransits\` (the 3 most significant long-term planetary aspects).
- **CRITICAL TASK:** Your primary goal is to **connect the astrological data to the specific images, emotions, and events of the user's dream**. Avoid generic interpretations.

- **Step-by-Step Instructions:**
    1.  **Analyze \`dreamAtmosphere\`:**
        - **Action:** You will receive an object with guides for the Moon phase and sign. Synthesize them into a single, cohesive 3-4 sentence interpretation that connects the combined lunar energy to the dream's plot.
        - **Input Example:** \`{ "moonPhase": { "name": "Новолуние", "promptGuide": "Новолуние — время начинаний..." }, "moonSign": { "name": "Дева", "promptGuide": "Луна в Деве подвергает эмоции анализу..." } }\`
        - **Output:** A single string with the full interpretation.

    2.  **Analyze \`cosmicPassport\`:**
        - **Action:** You will receive guides for the user's Sun and Moon signs. Synthesize them into a single, cohesive 4-5 sentence interpretation. Explain how the user's core identity (Sun) and emotional needs (Moon) are reflected in the dream's events.
        - **Input Example:** \`{ "sun": { "sign": "Дева", "promptGuide": "Солнце в Деве — это аналитический ум..." }, "moon": { "sign": "Дева", "promptGuide": "Луна в Деве ищет комфорт в порядке..." } }\`
        - **Output:** A single string with the full interpretation.

    3.  **Analyze \`topTransits\`:**
        - **Action:** This remains the same. You will receive an array of 3 transit objects. For each one, write an \`interpretation\` and a \`lesson\`.
        - **Content:** Connect the transit's psychological meaning to the dream's specific events and characters.

# FINAL JSON OUTPUT
Your response must be STRICTLY a single JSON object. Do not include static titles for the psychoanalytic schools in your output. Only return the generated text content as specified below.

\`\`\`json
{
  "title": "A short, intriguing title for the dream, 3-5 words",
  "snapshotSummary": "A general conclusion and brief summary of the dream's interpretation (about 50 words).",
  "lenses": {
    "psychoanalytic": {
      "insights": [
        { "name": "Title from Psychoanalysis BLOCK 1.1", "description": "Explanation from BLOCK 1.1" },
        { "name": "Title from Psychoanalysis BLOCK 1.2", "description": "Explanation from BLOCK 1.2" },
        { "name": "Title from Psychoanalysis BLOCK 1.3", "description": "Explanation from BLOCK 1.3" }
      ],
      "schools": {
        "freud": "For this school, select the single most significant image from the dream. Provide a concise analysis (3-5 sentences) of this symbol from the school's perspective. Use professional yet accessible language. Do not explain the school itself.",
        "jung": "For this school, select the single most significant image from the dream. Provide a concise analysis (3-5 sentences) of this symbol from the school's perspective. Use professional yet accessible language. Do not explain the school itself.",
        "adler": "For this school, select the single most significant image from the dream. Provide a concise analysis (3-5 sentences) of this symbol from the school's perspective. Use professional yet accessible language. Do not explain the school itself."
      },
      "recommendation": {
        "title": "A suitable title for the recommendation, reflecting its essence",
        "content": "A single, two-paragraph recommendation focusing on mental introspection and self-reflection, written with empathy and care, based on BLOCK 3 instructions."
      }
    },
    "tarot": {
      "interpretations": [
        "Interpretation for the first card provided in the prompt.",
        "Interpretation for the second card...",
        "Interpretation for the third card...",
        "Interpretation for the fourth card...",
        "Interpretation for the fifth card..."
      ],
      "summary": "The overall summary of the Tarot spread, based on all 5 interpretations."
    },
    "astrology": {
      "dreamAtmosphereInterpretation": "Your 2-3 sentence analysis of the dream atmosphere based on the Moon's phase and sign.",
      "transitInterpretations": [
          {
            "interpretation": "Your interpretation for the first transit provided, linked to the dream.",
            "lesson": "The lesson and opportunity for the first transit."
          },
          {
            "interpretation": "Your interpretation for the second transit...",
            "lesson": "The lesson and opportunity for the second transit."
          },
          {
            "interpretation": "Your interpretation for the third transit...",
            "lesson": "The lesson and opportunity for the third transit."
          }
      ],
      "cosmicPassportInterpretation": "Your 3-4 sentence analysis linking the dream to the user's core personality.",
      "summary": "Your overall astrological summary, linking all provided astro-data to the dream."
    }
  }
}
\`\`\`
`;
}

// NOTE: The `structured_outputs` API with `json_schema` is not part of the standard client yet.
// We will use the standard `chat.completions.create` with `response_format: { type: "json_object" }`
// which is the current best practice for enforcing JSON output.
// The prompt itself will guide the model to adhere to the desired structure.

export const getDreamInterpretation = async (dreamText, lang = 'ru', userProfile, tarotSpread, astrologyData) => {
  console.log('[AI] Fetching live interpretations...');
  
  // Инициализируем OpenAI клиент если еще не инициализирован
  initializeOpenAI();
  
  const startTime = Date.now();
  
  // --- LOGGING: Log incoming data ---
  console.log('[AI DEBUG] Received Tarot Spread:', JSON.stringify(tarotSpread, null, 2));
  if (astrologyData) {
      console.log('[AI DEBUG] Received Astrology Data:', JSON.stringify(astrologyData, null, 2));
  } else {
      console.log('[AI DEBUG] No Astrology Data received (profile likely incomplete).');
  }

  let userMessage = `
    User Dream:
    ---
    ${dreamText}
    ---

    Tarot Spread to Interpret:
    ---
    ${JSON.stringify(tarotSpread, null, 2)}
    ---
  `;

  if (astrologyData) {
    // --- Преобразуем данные для AI ---
    const dataForAI = {
        dreamAtmosphere: astrologyData.dreamAtmosphere,
        topTransits: astrologyData.topTransits.insights.map(t => {
            const transitPlanet = PLANET_NAMES_RU[t.transit_planet] || t.transit_planet;
            const natalPlanet = PLANET_NAMES_RU[t.natal_planet] || t.natal_planet;
            const aspect = ASPECT_NAMES_RU[t.aspect_type];
            return {
                title: `Транзитный ${transitPlanet} в аспекте ${aspect} к натальному ${natalPlanet}`,
                type: t.aspect_type === 'conjunction' || t.aspect_type === 'trine' || t.aspect_type === 'sextile' ? 'opportunity' : 'challenge'
            }
        }),
        cosmicPassport: astrologyData.cosmicPassport
    };
    console.log('[AI DEBUG] Sending this Astrology data to AI:', JSON.stringify(dataForAI, null, 2));
    
    userMessage += `
      \nAstrological Data to Interpret:
      ---
      ${JSON.stringify(dataForAI, null, 2)}
      ---
    `;
  }

  try {
    const resp = await client.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: getSystemPrompt() },
        { role: "user", content: userMessage }
      ],
      response_format: {
        type: "json_object",
      },
      reasoning_effort: "minimal",
    });
    
    const endTime = Date.now();
    console.log(`[AI] OpenAI request finished in ${(endTime - startTime) / 1000} seconds.`);

    const liveData = JSON.parse(resp.choices[0].message.content);
    console.log('[AI] Raw response from OpenAI:', JSON.stringify(liveData, null, 2));

    const psychoanalyticData = liveData.lenses?.psychoanalytic;
    const tarotData = liveData.lenses?.tarot;
    const aiAstroData = liveData.lenses?.astrology;
    const lenses = liveData.lenses || {};

    // --- Data Sanitization Block ---
    // AI can sometimes misplace keys at the `lenses` level instead of inside the lens object.
    // This block attempts to correct common misplacements before validation.
    console.log('[AI DEBUG] Starting data sanitization...');

    if (psychoanalyticData) {
        if (!psychoanalyticData.insights && lenses.insights) {
            console.log('[AI DEBUG] Correcting misplaced psychoanalytic.insights');
            psychoanalyticData.insights = lenses.insights;
            delete lenses.insights;
        }
        if (!psychoanalyticData.schools && lenses.schools) {
            console.log('[AI DEBUG] Correcting misplaced psychoanalytic.schools');
            psychoanalyticData.schools = lenses.schools;
            delete lenses.schools;
        }
        if (!psychoanalyticData.recommendation && lenses.recommendation) {
            console.log('[AI DEBUG] Correcting misplaced psychoanalytic.recommendation');
            psychoanalyticData.recommendation = lenses.recommendation;
            delete lenses.recommendation;
        }
    }

    if (tarotData) {
        if (!tarotData.interpretations && lenses.interpretations) {
            console.log('[AI DEBUG] Correcting misplaced tarot.interpretations');
            tarotData.interpretations = lenses.interpretations;
            delete lenses.interpretations;
        }
    }

    if (aiAstroData) {
        if (!aiAstroData.summary && lenses.summary) {
            console.log('[AI DEBUG] Correcting misplaced astrology.summary');
            aiAstroData.summary = lenses.summary;
            delete lenses.summary;
        }
        if (!aiAstroData.dreamAtmosphereInterpretation && lenses.dreamAtmosphereInterpretation) {
            console.log('[AI DEBUG] Correcting misplaced astrology.dreamAtmosphereInterpretation');
            aiAstroData.dreamAtmosphereInterpretation = lenses.dreamAtmosphereInterpretation;
            delete lenses.dreamAtmosphereInterpretation;
        }
        if (!aiAstroData.transitInterpretations && lenses.transitInterpretations) {
            console.log('[AI DEBUG] Correcting misplaced astrology.transitInterpretations');
            aiAstroData.transitInterpretations = lenses.transitInterpretations;
            delete lenses.transitInterpretations;
        }
        if (!aiAstroData.cosmicPassportInterpretation && lenses.cosmicPassportInterpretation) {
            console.log('[AI DEBUG] Correcting misplaced astrology.cosmicPassportInterpretation');
            aiAstroData.cosmicPassportInterpretation = lenses.cosmicPassportInterpretation;
            delete lenses.cosmicPassportInterpretation;
        }
    }

    if (!psychoanalyticData || !psychoanalyticData.schools || !psychoanalyticData.recommendation || !tarotData || !tarotData.summary || !tarotData.interpretations || tarotData.interpretations.length !== 5) {
        console.error('[AI] Could not find required data in the expected structure for Psychoanalysis or Tarot.');
        throw new Error('AI response structure is invalid.');
    }

    if (astrologyData) {
        const missingFields = [];
        if (!aiAstroData) {
            throw new Error('AI response is missing the "astrology" lens entirely.');
        }
        if (!aiAstroData.summary) missingFields.push('summary');
        if (!aiAstroData.transitInterpretations) {
            missingFields.push('transitInterpretations');
        } else if (!Array.isArray(aiAstroData.transitInterpretations) || aiAstroData.transitInterpretations.length !== 3) {
            missingFields.push('transitInterpretations (must be an array of 3 objects with interpretation and lesson)');
        }
        if (!aiAstroData.dreamAtmosphereInterpretation) missingFields.push('dreamAtmosphereInterpretation');
        if (!aiAstroData.cosmicPassportInterpretation) missingFields.push('cosmicPassportInterpretation');

        if (missingFields.length > 0) {
            const errorMsg = `AI response for Astrology is missing or has invalid fields: ${missingFields.join(', ')}`;
            console.error(`[AI] Validation Error: ${errorMsg}`);
            console.error('[AI] Received astrology lens:', JSON.stringify(aiAstroData, null, 2));
            throw new Error(errorMsg);
        }
    }

    // --- Merge Psychoanalytic Data ---
    const finalPsychoanalyticData = {
        ...psychoanalyticData,
        title: "Психоанализ",
        schools: {
            freud: { title: "По Фрейду", content: psychoanalyticData.schools.freud },
            jung: { title: "По Юнгу", content: psychoanalyticData.schools.jung },
            adler: { title: "По Адлеру", content: psychoanalyticData.schools.adler }
        }
    };

    // --- Merge Tarot Data ---
    // The AI returns only the text. We merge it with the original spread structure.
    const finalTarotSpread = tarotSpread.map((card, index) => ({
      ...card,
      interpretation: tarotData.interpretations[index]
    }));

    const finalTarotData = {
        title: "Таро",
        spread: finalTarotSpread,
        summary: tarotData.summary,
        state: { isRevealed: false }
    };

    // Load mock data for other lenses
    const mockInterpretationPath = path.join(process.cwd(), 'mock-interpretation.json');
    const mockInterpretation = JSON.parse(fs.readFileSync(mockInterpretationPath, 'utf-8'));

    // --- Merge Astrology Data ---
    let finalAstrologyData;
    if (astrologyData && aiAstroData) {
        console.log('[AI DEBUG] Merging LIVE Astrology data...');

        // 1. Трансформируем транзиты в формат, ожидаемый фронтендом
        const finalTransits = astrologyData.topTransits.insights.map((transit, index) => {
            const aiInterpretation = aiAstroData.transitInterpretations[index];
            const transitPlanetName = PLANET_NAMES_RU[transit.transit_planet] || transit.transit_planet;
            const natalPlanetName = PLANET_NAMES_RU[transit.natal_planet] || transit.natal_planet;
            
            return {
                p1: transit.transit_planet,
                p2: transit.natal_planet,
                aspect: transit.aspect_type,
                power: Math.round(transit.score / 10), // Нормализуем score до шкалы 1-10
                tagline: `${transitPlanetName} в ${ASPECT_NAMES_RU[transit.aspect_type]} к ${natalPlanetName}`,
                title: `Влияние: ${transitPlanetName} и ${natalPlanetName}`, // Фронтенд ожидает title
                interpretation: aiInterpretation?.interpretation || "Интерпретация не была сгенерирована.",
                lesson: aiInterpretation?.lesson || "Урок не был сгенерирован."
            };
        });

        // 2. Собираем финальный "плоский" объект для линзы Астрологии
        finalAstrologyData = {
            title: "Астрология",
            celestialMap: {
                moonPhase: { 
                    name: astrologyData.dreamAtmosphere.moonPhase.name,
                    phase: astrologyData.dreamAtmosphere.moonPhase.phase, // ВОЗВРАЩАЕМ ЭТО ПОЛЕ
                    text: aiAstroData.dreamAtmosphereInterpretation // Текст от ИИ
                },
                moonSign: {
                    name: astrologyData.dreamAtmosphere.moonSign.name,
                    emoji: astrologyData.dreamAtmosphere.moonSign.emoji, // ВОЗВРАЩАЕМ ЭТО ПОЛЕ
                    text: aiAstroData.dreamAtmosphereInterpretation // Используем тот же самый текст
                }
            },
            topTransits: {
                ...astrologyData.topTransits,
                insights: finalTransits // Заменяем insights на трансформированные
            },
            cosmicPassport: {
                sun: {
                    title: `Солнце в знаке ${astrologyData.cosmicPassport.sun.sign}`,
                    tagline: aiAstroData.cosmicPassportInterpretation // Текст от ИИ
                },
                moon: {
                    title: `Луна в знаке ${astrologyData.cosmicPassport.moon.sign}`,
                    tagline: aiAstroData.cosmicPassportInterpretation // Используем тот же самый текст
                }
            },
            summary: aiAstroData.summary,
            // Добавляем explanation, который ожидает фронтенд
            explanation: astrologyData.topTransits.explanation
        };

        console.log('[AI DEBUG] Successfully merged and transformed Astrology data for frontend.');
    } else {
        console.log('[AI DEBUG] Using MOCK Astrology data.');
        finalAstrologyData = mockInterpretation.lenses.astrology;
    }

    // Combine live data with mock data
    const finalInterpretation = {
      title: liveData.title,
      snapshotSummary: liveData.snapshotSummary,
      lenses: {
        psychoanalytic: finalPsychoanalyticData, // Use the merged data
        tarot: finalTarotData, // Use the merged data
        astrology: finalAstrologyData, // Use merged or mock data
        culturology: mockInterpretation.lenses.culturology,
      }
    };

    // Replace astrology mock with real data if profile is available
    // THIS LOGIC IS NOW HANDLED ABOVE
    /*
    if (userProfile && userProfile.birthDate && userProfile.birthPlace && userProfile.natalChart) {
      console.log('User profile and natal chart found, calculating astrology data...');
      try {
// ... existing code ...
        console.error("Error calculating astrology data:", error);
        // Proceed with mock astrology data if calculation fails
      }
    }
    */

    return finalInterpretation;
    
  } catch (error) {
    const endTime = Date.now();
    console.error(`[AI] OpenAI request failed after ${(endTime - startTime) / 1000} seconds.`);
    console.error('[AI] Error fetching interpretation from OpenAI:', error);
    // In case of AI error, we might want to return a fallback or re-throw
    throw new Error('Failed to get interpretation from AI due to an API error.');
  }
};

const getZodiacSignFromTitle = (title) => {
    if (!title) return '';
    const parts = title.split(' ');
    return parts[parts.length - 1];
};

// This function is kept for historical purposes or if needed for a simpler, non-structured call.
export const getInterpretationFromAI_old = async (text, lang) => {
  // Инициализируем OpenAI клиент если еще не инициализирован
  initializeOpenAI();
  
  const systemPrompt = `
    You are an erudite expert dream analyst. You analyze dreams through 4 main lenses: Psychoanalysis, Esotericism, Astrology, and Folklore.
    Your task is to receive the dream text and perform TWO actions:
    1. Carefully read the text and extract from it 2 to 4 of the most important, key images (nouns). Place them in the "keyImages" array.
    2. Based on the entire text and the extracted images, provide a detailed interpretation for all paragraphs.
    Return ONE JSON object STRICTLY in the specified format. Do not add any words before or after the JSON. Each paragraph should be approximately 50 words. The response must be in ${lang === 'ru' ? 'Russian' : 'English'}.
  `;
  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: text },
      ],
      response_format: { type: "json_object" },
    });
    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error getting interpretation from AI:", error);
    throw new Error("Failed to get interpretation from AI.");
  }
};