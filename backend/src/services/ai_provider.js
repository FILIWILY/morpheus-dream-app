import { getDreamInterpretation as getOpenAIInterpretation } from './openai.js';
import { getDreamInterpretation as getDeepSeekInterpretation } from './deepseek.js';
import fs from 'fs';
import path from 'path';

// This function acts as a switchboard, choosing the AI provider based on the .env config.
// The `server.js` file will call this function, remaining unaware of the specific provider being used.
export const getDreamInterpretation = async (dreamText, lang, userProfile, tarotSpread, astrologyData) => {
  const useMockApi = process.env.USE_MOCK_API === 'true';
  const useOpenAI = process.env.USE_OPENAI === 'true';

  // Если включен mock режим - возвращаем заготовленные данные
  if (useMockApi) {
    console.log('🎭 Using mock AI data (no API calls)');
    return getMockInterpretation(dreamText, lang, userProfile, tarotSpread, astrologyData);
  }

  // Иначе используем настоящие AI API
  if (useOpenAI) {
    console.log('🤖 Routing to OpenAI service...');
    return getOpenAIInterpretation(dreamText, lang, userProfile, tarotSpread, astrologyData);
  } else {
    console.log('🧠 Routing to DeepSeek service...');
    return getDeepSeekInterpretation(dreamText, lang, userProfile, tarotSpread, astrologyData);
  }
};

// Функция для возврата mock данных
const getMockInterpretation = async (dreamText, lang, userProfile, tarotSpread, astrologyData) => {
  try {
    // Загружаем mock данные из файла
    const mockPath = path.join(process.cwd(), 'mock-interpretation.json');
    const mockData = JSON.parse(fs.readFileSync(mockPath, 'utf-8'));
    
    // Адаптируем mock данные под текущий запрос
    const adaptedMockData = {
      ...mockData,
      title: `Mock: ${dreamText.substring(0, 30)}...`,
      snapshotSummary: `Это mock интерпретация для разработки UI. Настоящий анализ сна: "${dreamText.substring(0, 50)}..."`
    };

    console.log('🎭 Mock interpretation generated successfully');
    return adaptedMockData;
    
  } catch (error) {
    console.error('❌ Error loading mock data:', error);
    
    // Fallback mock данные если файл не найден
    return {
      title: "Mock Dream Analysis",
      snapshotSummary: "Это тестовая интерпретация для разработки UI.",
      lenses: {
        psychoanalytic: {
          title: "Психоанализ",
          insights: [
            { name: "Mock Insight 1", description: "Это тестовое понимание для разработки UI." },
            { name: "Mock Insight 2", description: "Второе тестовое понимание." }
          ],
          schools: {
            freud: { title: "По Фрейду", content: "Mock анализ по Фрейду." },
            jung: { title: "По Юнгу", content: "Mock анализ по Юнгу." },
            adler: { title: "По Адлеру", content: "Mock анализ по Адлеру." }
          },
          recommendation: {
            title: "Mock Рекомендация",
            content: "Это тестовая рекомендация для разработки UI."
          }
        },
        tarot: {
          title: "Таро",
          spread: tarotSpread.map((card, index) => ({
            ...card,
            interpretation: `Mock интерпретация карты ${card.name} в позиции ${index + 1}`
          })),
          summary: "Mock общая интерпретация Таро расклада.",
          state: { isRevealed: false }
        },
        astrology: {
          title: "Астрология", 
          summary: "Mock астрологический анализ сна."
        },
        culturology: {
          title: "Культурология",
          summary: "Mock культурологический анализ сна."
        }
      }
    };
  }
};
