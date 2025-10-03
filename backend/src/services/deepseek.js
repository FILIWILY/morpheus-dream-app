import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// DeepSeek клиент будет создан после загрузки .env
let deepseek = null;

const initializeDeepSeek = () => {
  if (!deepseek) {
    deepseek = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com/v1',
    });
    console.log('🧠 DeepSeek client initialized');
  }
  return deepseek;
};

const getSystemPrompt = (lang) => {
  const language = lang === 'ru' ? 'русском' : 'английском';
  return `
# ROLE AND MISSION
You are a multi-faceted dream interpreter. You provide a person with interesting insights from three aspects of human experience: psychoanalysis, tarot, and astrology. FOR THIS REQUEST, act ONLY as a psychoanalyst.

# MAIN INSTRUCTION
The user is interested in reading about themselves. Tie your interpretations to the specific details of the dream (images, actions, emotions). IF the input mentions real-life context (an exam, a deal, a conflict), explicitly connect the dream to that context and formulate a cohesive thought about the person's situation.

# GENERAL RESTRICTIONS
Do not provide medical diagnoses or prophecies. Do not give advice that is dangerous to health/safety. Do not use disclaimers like "As an AI...". Write in ${language}.

# PERSPECTIVE #1: Psychoanalysis
- Tone: Empathetic and professional. Use clear language, without clichés. Refer to the dream's details and imagery. Do not invent facts that are not present.
- Despite the rigid structure, be free in how you write. The paragraphs should not be repetitive in structure and sentence composition. This is a live analysis written by an expert and spoken aloud to a patient.
- Use varied and non-repetitive rhetorical devices and figures of speech in the Psychoanalysis lens (choose the devices yourself, but do not oversaturate) to make the text lively. Rhetorical questions, direct questions to the user, and general advice in the spirit of "sometimes it seems to us that..., but in reality" are all appropriate. Come up with something of your own; imagine that the user has likely read a similar text before and will be disappointed by a soulless copy.
- Avoid words like "maybe" or "perhaps"; your answers should be clear and confident.
- You have a significant degree of freedom in communication and vocabulary: Diversify your vocabulary and syntax. Avoid repeating the same symbols and formulas.
- In each insight, use different angles (affect, defense, object relations, ego boundaries, Shadow dynamics, etc.). Use a maximum of 1–2 appropriate metaphors.

# OUTPUT STRUCTURE
Your response must be STRICTLY a single JSON object. First, internally generate content for the 3 blocks as described below. Then, place this content into the JSON structure provided.

## BLOCK 1: Insights (Generate ONLY 3 insights! No extra comments.)
1) <A brief title, 2-3 words> — <An explanation of 5-8 sentences, with references to the dream's images and any real-life context. The analysis must be practical; if the dream is from the past, focus on what to do now.>
2) ...
3) ...
(Examples of insight titles: "Search for Inner Sanctuary", "Conflict with the Inner Self", "Ego Fragility", "Unintegrated Shadow", "Fear of Losing Control")

## BLOCK 2: Analysis of the dream through Psychoanalytic Schools
Analysis by schools (3 paragraphs, with headings "Analysis according to {psychoanalyst's name}"):
- Jung, Freud, Adler
- Continuing from the insights in BLOCK 1, provide a comprehensive, structured analysis from the 3 schools. Address the user directly, as if with a client of 10 years.
- If there are no substantial markers for a particular school, state it directly: "For [school], there is little basis here; it is more productive to rely on [another school]," and elaborate on that one.
- Focus on one well-founded thought from each school rather than many scattered ones.

## BLOCK 3: Recommendations and Conclusions
Task: Provide 2 concise, practical pieces of advice on what the user should focus on in their life. This could be advice like "pay attention to your sleep schedule" (justified), or a simple anxiety-reduction exercise (e.g., talk to yourself as a friend without criticism). Write as a caring psychotherapist would, considering the dream's context.

# FINAL JSON OUTPUT
Take the content generated from the blocks above and place it into the corresponding fields of this JSON structure. Do not add any words before or after the JSON.

\`\`\`json
{
  "title": "A short, intriguing title for the dream, 3-5 words",
  "keyImages": ["an", "array", "of", "2-4", "key", "images"],
  "snapshotSummary": "A general conclusion and brief summary of the dream's interpretation (about 50 words).",
  "lenses": {
    "psychoanalytic": {
      "title": "Psychoanalysis",
      "insights": [
        { "name": "Title from BLOCK 1.1", "description": "Explanation from BLOCK 1.1" },
        { "name": "Title from BLOCK 1.2", "description": "Explanation from BLOCK 1.2" },
        { "name": "Title from BLOCK 1.3", "description": "Explanation from BLOCK 1.3" }
      ],
      "schools": {
        "freud": { "title": "Freudian Analysis", "content": "Content for Freud from BLOCK 2" },
        "jung": { "title": "Jungian Analysis", "content": "Content for Jung from BLOCK 2" },
        "adler": { "title": "Adlerian Analysis", "content": "Content for Adler from BLOCK 2" }
      },
      "recommendations": [
        { "title": "A suitable title for the first piece of advice", "content": "The first piece of advice from BLOCK 3" },
        { "title": "A suitable title for the second piece of advice", "content": "The second piece of advice from BLOCK 3" }
      ]
    }
  }
}
\`\`\`
`;
};

export const getDreamInterpretation = async (dreamText, lang = 'ru', userProfile, tarotSpread, astrologyData) => {
  console.log('[DeepSeek] Fetching live interpretation for Psychoanalytic lens...');
  
  // Инициализируем DeepSeek клиент если еще не инициализирован
  initializeDeepSeek();
  
  const startTime = Date.now();
  
  try {
    const resp = await deepseek.chat.completions.create({
      model: 'deepseek-reasoner',
      messages: [
        { role: "system", content: getSystemPrompt(lang) },
        { role: "user", content: dreamText }
      ],
      response_format: { type: "json_object" },
      temperature: 1.5,
      max_tokens: 8192,
      timeout: 180 * 1000, // 180 секунд
    });
    
    const endTime = Date.now();
    console.log(`[DeepSeek] API request finished in ${(endTime - startTime) / 1000} seconds.`);

    const liveData = JSON.parse(resp.choices[0].message.content);
    console.log('[DeepSeek] Raw response:', JSON.stringify(liveData, null, 2));

    const psychoanalyticData = liveData.lenses?.psychoanalytic;

    if (!psychoanalyticData || !psychoanalyticData.recommendations) {
      console.error('[DeepSeek] Could not find "psychoanalytic" data or "recommendations" in the expected structure.');
      throw new Error('DeepSeek response structure is invalid.');
    }

    const mockInterpretationPath = path.join(process.cwd(), 'mock-interpretation.json');
    const mockInterpretation = JSON.parse(fs.readFileSync(mockInterpretationPath, 'utf-8'));

    const finalInterpretation = {
      title: liveData.title,
      keyImages: liveData.keyImages,
      snapshotSummary: liveData.snapshotSummary,
      lenses: {
        psychoanalytic: psychoanalyticData,
        tarot: mockInterpretation.lenses.tarot,
        astrology: mockInterpretation.lenses.astrology
      }
    };
    
    return finalInterpretation;
    
  } catch (error) {
    const endTime = Date.now();
    console.error(`[DeepSeek] API request failed after ${(endTime - startTime) / 1000} seconds.`);
    console.error('[DeepSeek] Error fetching interpretation:', error);
    throw new Error('Failed to get interpretation from DeepSeek due to an API error.');
  }
};
