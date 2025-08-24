import { getDreamInterpretation as getOpenAIInterpretation } from './openai.js';
import { getDreamInterpretation as getDeepSeekInterpretation } from './deepseek.js';

// This function acts as a switchboard, choosing the AI provider based on the .env config.
// The `server.js` file will call this function, remaining unaware of the specific provider being used.
export const getDreamInterpretation = (dreamText, lang, userProfile, tarotSpread, astrologyData) => {
  const useDeepSeek = process.env.USE_DEEPSEEK === 'true';

  if (useDeepSeek) {
    console.log('Routing to DeepSeek service...');
    return getDeepSeekInterpretation(dreamText, lang, userProfile, tarotSpread, astrologyData);
  } else {
    console.log('Routing to OpenAI service...');
    return getOpenAIInterpretation(dreamText, lang, userProfile, tarotSpread, astrologyData);
  }
};
