import { 
    getPsychoanalyticInterpretation, 
    getTarotInterpretation, 
    getAstrologyInterpretation,
    getDreambookInterpretation
} from './openai.js';
import { getDreamInterpretation as getDeepSeekInterpretation } from './deepseek.js';
import fs from 'fs';
import path from 'path';
import * as db from './database.js';

// This function is kept for historical/compatibility reasons and should be deprecated.
export const getDreamInterpretation = async (dreamText, lang, userProfile, tarotSpread, astrologyData) => {
    const useOpenAI = process.env.USE_OPENAI === 'true';
    if (useOpenAI) {
        throw new Error("Monolithic interpretation is deprecated. Use streaming.");
    } else {
        console.log('🧠 Routing to DeepSeek service...');
        return getDeepSeekInterpretation(dreamText, lang, userProfile, tarotSpread, astrologyData);
    }
};

const simulateDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const getDreamInterpretationStream = async (ws, dreamText, lang, userProfile, tarotSpread, astrologyData, userId, dreamId) => {
    console.log(`[AI-DIAGNOSTIC] Starting interpretation stream for dreamId: ${dreamId}`);
    
    const onDataPart = async (data) => {
        if (ws.readyState !== 1) { // 1 === OPEN
            console.log('[STREAM] WebSocket is not open. Aborting data send.');
            return;
        }
        try {
            // УБИРАЕМ ОБНОВЛЕНИЕ БД ОТСЮДА. Оно будет вызываться явно.
            // if (data.type === 'part') {
            //     await db.updateDreamPartial(userId, dreamId, data.payload);
            // }
            ws.send(JSON.stringify(data));
        } catch(e) {
            console.error('[STREAM] Error sending data part:', e);
            // Consider closing the connection or sending an error to the client
        }
    };

    const useMockAI = process.env.USE_MOCK_AI === 'true';

    if (useMockAI) {
        console.log('🎭 Using mock AI data for streaming...');
        const mockInterpretation = await getMockInterpretation(dreamText, lang, userProfile, tarotSpread, astrologyData);
        
        // --- ВАЖНО: Сохраняем весь мок целиком в БД перед отправкой ---
        try {
            const { id, date, originalText, ...interpretationToSave } = mockInterpretation;
            await db.updateDreamPartial(userId, dreamId, interpretationToSave);
            console.log(`[STREAM] ✅ Mock interpretation data saved to DB for dream ID: ${dreamId}`);
        } catch (dbError) {
            console.error(`[STREAM] ❌ Failed to save mock data to DB for dream ID: ${dreamId}`, dbError);
            // Отправляем ошибку клиенту, если не удалось сохранить
            await onDataPart({ type: 'error', payload: { message: 'Failed to save mock interpretation to database.' } });
            return;
        }

        // The first request now returns title, processedText, and the dreambook lens.
        await simulateDelay(1500);
        await onDataPart({ type: 'part', payload: { 
            title: mockInterpretation.title, 
            processedText: mockInterpretation.processedText,
            lenses: { dreambook: mockInterpretation.lenses.dreambook } 
        }});
        console.log('[STREAM] Sent Dreambook data + initial payload.');

        await simulateDelay(2000);
        const psychoanalyticData = { lenses: { psychoanalytic: mockInterpretation.lenses.psychoanalytic } };
        // Эти вызовы не нужны, т.к. мы уже сохранили весь объект целиком в самом начале.
        // Повторные вызовы перезаписывают весь объект lenses, оставляя только последнюю линзу.
        // await db.updateDreamPartial(userId, dreamId, psychoanalyticData);
        await onDataPart({ type: 'part', payload: psychoanalyticData });
        console.log('[STREAM] Sent Psychoanalytic data.');

        // Если есть данные для астрологии, отправляем их (теперь это 3-й шаг)
        if (mockInterpretation.lenses.astrology) {
            await simulateDelay(2000);
            const astrologyDataPayload = { lenses: { astrology: mockInterpretation.lenses.astrology } };
            // await db.updateDreamPartial(userId, dreamId, astrologyDataPayload);
            await onDataPart({ type: 'part', payload: astrologyDataPayload });
            console.log('[STREAM] Sent Astrology data.');
        }

        await simulateDelay(2000);
        const tarotData = { lenses: { tarot: mockInterpretation.lenses.tarot } };
        // await db.updateDreamPartial(userId, dreamId, tarotData);
        await onDataPart({ type: 'part', payload: tarotData });
        console.log('[STREAM] Sent Tarot data.');

        await simulateDelay(500);
        await onDataPart({ type: 'done' });
        console.log('[STREAM] All parts sent.');
        return;
    }

    try {
        console.log('[AI-DIAGNOSTIC] Starting ALL interpretation requests in parallel.');

        const interpretationPromises = [];

        // --- 1. Dreambook ---
        interpretationPromises.push((async () => {
            try {
                console.log('[STREAM] Getting Dreambook interpretation...');
                const { getDreamAtmosphere } = await import('./astrology.js');
                const dreamAtmosphere = await getDreamAtmosphere(userProfile.birthDate || new Date().toISOString().split('T')[0]);
                const dream = await db.getDreamById(userId, dreamId);
                const dreamDate = dream?.date || new Date().toISOString().split('T')[0];
                const userGender = userProfile.gender || 'male';
                
                const dreambookData = await getDreambookInterpretation(dreamText, dreamAtmosphere, dreamDate, userGender, lang);
                await db.updateDreamPartial(userId, dreamId, dreambookData);
                await onDataPart({ type: 'part', payload: dreambookData });
                console.log('[STREAM] ✅ Sent Dreambook data.');
            } catch (e) {
                console.error('❌ Failed to process Dreambook lens:', e.message);
            }
        })());

        // --- 2. Psychoanalysis ---
        interpretationPromises.push((async () => {
            try {
                console.log('[STREAM] Getting Psychoanalytic data...');
                const psychoanalyticData = await getPsychoanalyticInterpretation(dreamText, lang);
                await db.updateDreamPartial(userId, dreamId, psychoanalyticData);
                await onDataPart({ type: 'part', payload: psychoanalyticData });
                console.log('[STREAM] ✅ Sent Psychoanalytic data.');
            } catch (e) {
                console.error('❌ Failed to process Psychoanalytic lens:', e.message);
            }
        })());

        // --- 3. Astrology (only if data is available) ---
        if (astrologyData) {
            interpretationPromises.push((async () => {
                try {
                    console.log('[STREAM] Getting Astrology data...');
                    const astrologyDataResult = await getAstrologyInterpretation(dreamText, astrologyData, lang);
                    await db.updateDreamPartial(userId, dreamId, astrologyDataResult);
                    await onDataPart({ type: 'part', payload: astrologyDataResult });
                    console.log('[STREAM] ✅ Sent Astrology data.');
                } catch (e) {
                    console.error('❌ Failed to process Astrology lens:', e.message);
                }
            })());
        } else {
            console.log('[STREAM] ⏭️ Skipping Astrology data: No natal chart data provided.');
        }

        // --- 4. Tarot ---
        interpretationPromises.push((async () => {
            try {
                console.log('[STREAM] Getting Tarot data...');
                const tarotData = await getTarotInterpretation(dreamText, tarotSpread, lang);
                await db.updateDreamPartial(userId, dreamId, tarotData);
                await onDataPart({ type: 'part', payload: tarotData });
                console.log('[STREAM] ✅ Sent Tarot data.');
            } catch (e) {
                console.error('❌ Failed to process Tarot lens:', e.message);
            }
        })());
        
        // Wait for all interpretations to finish
        await Promise.allSettled(interpretationPromises);

        await onDataPart({ type: 'done' });
        console.log('[AI-DIAGNOSTIC] All interpretation streams finished.');

    } catch (error) {
        console.error('❌ Error during interpretation stream:', error);
        await onDataPart({ type: 'error', payload: { message: error.message } });
    }
};

// Функция для возврата mock данных
const getMockInterpretation = async (dreamText, lang, userProfile, tarotSpread, astrologyData) => {
  try {
    // Загружаем mock данные из файла
    const mockPath = path.join(process.cwd(), 'mock-interpretation.json');
    const mockData = JSON.parse(fs.readFileSync(mockPath, 'utf-8'));
    
    // Рассчитываем метаданные для dreambook (как в реальном запросе)
    const { getDreamAtmosphere } = await import('./astrology.js');
    const dreamDate = new Date().toISOString().split('T')[0];
    const dreamAtmosphere = await getDreamAtmosphere(dreamDate);
    const weekdayIndex = new Date(dreamDate).getDay();
    const WEEKDAY_NAMES_RU = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const weekdayName = WEEKDAY_NAMES_RU[weekdayIndex];
    
    // Адаптируем mock данные под текущий запрос
    const adaptedMockData = {
      ...mockData,
      title: `Mock: ${dreamText.substring(0, 30)}...`,
      processedText: mockData.processedText || `Обработанный текст сна: ${dreamText}`,
      snapshotSummary: null, // Больше не используем summary
      lenses: {
        ...mockData.lenses,
        dreambook: {
          ...mockData.lenses.dreambook,
          metadata: {
            moonPhase: dreamAtmosphere.moonPhase.name,
            moonSign: dreamAtmosphere.moonSign.name,
            moonEmoji: dreamAtmosphere.moonSign.emoji,
            weekday: weekdayName,
            date: dreamDate
          }
        }, // Используем мок-данные для сонника с метаданными
        tarot: {
          title: "Таро",
          spread: tarotSpread.map((card, index) => {
            // Используем интерпретации из мок-файла с подстановкой имени карты
            const mockInterpretation = mockData.lenses.tarot.spread[index];
            return {
              position: card.position,
              cardName: card.cardName,
              interpretation: mockInterpretation.interpretation.replace(/<<cardName>>/g, card.cardName)
            };
          }),
          summary: mockData.lenses.tarot.summary,
          state: { isRevealed: false }
        }
      }
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
            position: card.position,
            cardName: card.cardName,
            interpretation: `Fallback интерпретация карты ${card.cardName} в позиции ${card.position}`
          })),
          summary: "Fallback общая интерпретация Таро расклада.",
          state: { isRevealed: false }
        },
        astrology: {
          title: "Астрология", 
          summary: "Mock астрологический анализ сна."
        }
      }
    };
  }
};
