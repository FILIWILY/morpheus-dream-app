import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { calculateNatalChart } from './natalChart.js';
import { getCosmicPassport, getDreamAtmosphere, calculateTopTransits, PLANET_NAMES_RU, ASPECT_NAMES_RU } from './astrology.js';

// Названия дней недели на русском
const WEEKDAY_NAMES_RU = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
const WEEKDAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Клиент будет создан после загрузки .env
let client = null;
let MODEL = null;

// Функция инициализации OpenAI клиента
const initializeOpenAI = () => {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    MODEL = process.env.OPENAI_MODEL ?? "gpt-5-mini-2025-08-07";
    console.log('🤖 OpenAI client initialized');
  }
  return client;
};

// ❌ УСТАРЕВШИЕ ФУНКЦИИ УДАЛЕНЫ - используем только Prompt ID через Responses API

const extractResponseText = (response) => {
    if (response.output_text) {
        return response.output_text;
    }
    if (!response.output) return '';
    return response.output.map(block => {
        if (!block?.content) return '';
        return block.content
            .filter(item => item.type === 'output_text' || item.type === 'text')
            .map(item => item.text)
            .join('');
    }).join('');
};

// ❌ УДАЛЕНА - не используется, первый запрос теперь getDreambookInterpretation

export const getPsychoanalyticInterpretation = async (dreamText, lang) => {
    initializeOpenAI();

    const preferredLanguage = lang === 'ru' ? 'Russian' : lang === 'en' ? 'English' : lang;

    let response;
    try {
        response = await client.responses.create({
            prompt: {
                id: 'pmpt_68d7f53ee3dc8196a3e8deb1ff519bf30aab471abf686834',
                version: '7',
                variables: {
                    language: preferredLanguage
                }
            },
            input: dreamText
        });
    } catch (error) {
        console.error('[AI] Error calling OpenAI Responses API for psychoanalytic lens:', error);
        throw new Error('Failed to get psychoanalytic interpretation from AI.');
    }

    const outputText = extractResponseText(response);

    if (!outputText) {
        console.error('[AI] Psychoanalytic response did not contain any text output.', response);
        throw new Error('AI response did not include psychoanalytic data.');
    }

    let data;
    try {
        data = JSON.parse(outputText);
    } catch (parseError) {
        console.error('[AI] Failed to parse psychoanalytic JSON:', parseError, outputText);
        throw new Error('Failed to parse psychoanalytic interpretation from AI.');
    }

    if (!data?.psychoanalytic) {
        console.error('[AI] Psychoanalytic data missing in response:', data);
        throw new Error('AI response missing psychoanalytic section.');
    }

    const finalData = {
        lenses: {
            psychoanalytic: {
                ...data.psychoanalytic,
                title: 'Психоанализ',
                schools: {
                    freud: {
                        title: 'По Фрейду',
                        content: data.psychoanalytic.schools?.freud ?? ''
                    },
                    jung: {
                        title: 'По Юнгу',
                        content: data.psychoanalytic.schools?.jung ?? ''
                    },
                    adler: {
                        title: 'По Адлеру',
                        content: data.psychoanalytic.schools?.adler ?? ''
                    }
                }
            }
        }
    };

    return finalData;
};

export const getTarotInterpretation = async (dreamText, tarotSpread, lang) => {
    initializeOpenAI();

    const preferredLanguage = lang === 'ru' ? 'Russian' : lang === 'en' ? 'English' : lang;

    let response;
    try {
        response = await client.responses.create({
            prompt: {
                id: 'pmpt_68dad324026c8197a3c6165739958baf0107458bf5f870c0',
                version: '4',
                variables: {
                    language: preferredLanguage
                }
            },
            input: JSON.stringify({
                dream: dreamText,
                spread: tarotSpread
            })
        });
    } catch (error) {
        console.error('[AI] Error calling OpenAI Responses API for tarot lens:', error);
        throw new Error('Failed to get tarot interpretation from AI.');
    }

    const outputText = extractResponseText(response);

    if (!outputText) {
        console.error('[AI] Tarot response did not contain any text output.', response);
        throw new Error('AI response did not include tarot data.');
    }

    let data;
    try {
        data = JSON.parse(outputText);
    } catch (parseError) {
        console.error('[AI] Failed to parse tarot JSON:', parseError, outputText);
        throw new Error('Failed to parse tarot interpretation from AI.');
    }

    if (!data?.tarot?.interpretations || !Array.isArray(data.tarot.interpretations) || data.tarot.interpretations.length !== 5) {
        console.error('[AI] Tarot data missing or invalid in response:', data);
        throw new Error('AI response missing tarot interpretations.');
    }

    const finalTarotSpread = tarotSpread.map((card, index) => ({
      ...card,
      interpretation: data.tarot.interpretations[index]
    }));

    const finalData = {
        tarot: {
            title: 'Таро',
        spread: finalTarotSpread,
            summary: data.tarot.summary,
        state: { isRevealed: false }
        }
    };
    return { lenses: finalData };
    };

export const getAstrologyInterpretation = async (dreamText, astrologyData, lang) => {
    if (!astrologyData) {
        console.log('[AI DEBUG] No Astrology Data received, returning mock data.');
    const mockInterpretationPath = path.join(process.cwd(), 'mock-interpretation.json');
    const mockInterpretation = JSON.parse(fs.readFileSync(mockInterpretationPath, 'utf-8'));
        return { lenses: { astrology: mockInterpretation.lenses.astrology } };
    }

    initializeOpenAI();

    const preferredLanguage = lang === 'ru' ? 'Russian' : lang === 'en' ? 'English' : lang;

    let response;
    try {
        response = await client.responses.create({
            prompt: {
                id: 'pmpt_68dad9e3764081939ac8d161532bb222053768a86cdd549f',
                version: '6',
                variables: {
                    language: preferredLanguage
                }
            },
            input: JSON.stringify({
                dream: dreamText,
                astrologyData
            })
        });
    } catch (error) {
        console.error('[AI] Error calling OpenAI Responses API for astrology lens:', error);
        throw new Error('Failed to get astrology interpretation from AI.');
    }

    const outputText = extractResponseText(response);

    if (!outputText) {
        console.error('[AI] Astrology response did not contain any text output.', response);
        throw new Error('AI response did not include astrology data.');
    }

    let aiAstroData;
    try {
        const parsed = JSON.parse(outputText);
        aiAstroData = parsed.astrology;
    } catch (parseError) {
        console.error('[AI] Failed to parse astrology JSON:', parseError, outputText);
        throw new Error('Failed to parse astrology interpretation from AI.');
    }

    if (!aiAstroData) {
        throw new Error('AI response missing astrology section.');
    }

    const dreamAtmosphereInterpretation = aiAstroData.dreamAtmosphereInterpretation || '';
    const transitInterpretations = Array.isArray(aiAstroData.transitInterpretations) ? aiAstroData.transitInterpretations : [];
    const cosmicPassportInterpretation = aiAstroData.cosmicPassportInterpretation || {};
    const summaryText = aiAstroData.summary || '';

        const finalTransits = astrologyData.topTransits.insights.map((transit, index) => {
        const aiInterpretation = transitInterpretations[index] || {};
        const transitPlanetName = PLANET_NAMES_RU[transit.transit_planet] || transit.transit_planet;
        const natalPlanetName = PLANET_NAMES_RU[transit.natal_planet] || transit.natal_planet;
            return {
                p1: transit.transit_planet,
                p2: transit.natal_planet,
                aspect: transit.aspect_type,
            power: Math.round(transit.score / 10),
                tagline: `${transitPlanetName} в ${ASPECT_NAMES_RU[transit.aspect_type]} к ${natalPlanetName}`,
            title: `Влияние: ${transitPlanetName} и ${natalPlanetName}`,
            interpretation: aiInterpretation.interpretation || 'Интерпретация не была сгенерирована.',
            lesson: aiInterpretation.lesson || 'Урок не был сгенерирован.'
            };
        });

    const sunInterpretation = typeof cosmicPassportInterpretation === 'object'
        ? cosmicPassportInterpretation.sun || ''
        : (cosmicPassportInterpretation || '');

    const moonInterpretation = typeof cosmicPassportInterpretation === 'object'
        ? cosmicPassportInterpretation.moon || ''
        : (cosmicPassportInterpretation || '');

    const finalAstrologyData = {
        title: 'Астрология',
            celestialMap: {
                moonPhase: { 
                    name: astrologyData.dreamAtmosphere.moonPhase.name,
                phase: astrologyData.dreamAtmosphere.moonPhase.phase,
                text: dreamAtmosphereInterpretation
                },
                moonSign: {
                    name: astrologyData.dreamAtmosphere.moonSign.name,
                emoji: astrologyData.dreamAtmosphere.moonSign.emoji,
                text: dreamAtmosphereInterpretation
                }
            },
        topTransits: { ...astrologyData.topTransits, insights: finalTransits },
            cosmicPassport: {
                sun: {
                    title: `Солнце в знаке ${astrologyData.cosmicPassport.sun.sign}`,
                tagline: sunInterpretation
                },
                moon: {
                    title: `Луна в знаке ${astrologyData.cosmicPassport.moon.sign}`,
                tagline: moonInterpretation
                }
            },
        summary: summaryText,
            explanation: astrologyData.topTransits.explanation
    };
    
    return { lenses: { astrology: finalAstrologyData } };
};

/**
 * Первый запрос: получение title, processedText и dreambook интерпретации
 * @param {string} dreamText - текст сна от пользователя
 * @param {object} dreamAtmosphere - объект с moonPhase и moonSign
 * @param {string} dreamDate - дата сна (YYYY-MM-DD)
 * @param {string} gender - пол пользователя ('male' или 'female')
 * @param {string} lang - язык ('ru', 'en', и т.д.)
 * @returns {Promise<object>} - { title, processedText, lenses: { dreambook } }
 */
export const getDreambookInterpretation = async (dreamText, dreamAtmosphere, dreamDate, gender, lang = 'ru') => {
    initializeOpenAI();

    // Рассчитываем день недели
    const date = new Date(dreamDate);
    const weekdayIndex = date.getDay();
    const weekdayName = lang === 'ru' ? WEEKDAY_NAMES_RU[weekdayIndex] : WEEKDAY_NAMES_EN[weekdayIndex];

    const preferredLanguage = lang === 'ru' ? 'Russian' : lang === 'en' ? 'English' : lang;

    console.log(`[AI] Getting Dreambook interpretation for date: ${dreamDate}, weekday: ${weekdayName}, moon: ${dreamAtmosphere.moonSign.name} (${dreamAtmosphere.moonPhase.name})`);

    let response;
    try {
        response = await client.responses.create({
            prompt: {
                id: 'pmpt_68de883ddb2c8194af2c136bf403a7410bebe0a38c798ba8',
                version: '8',
                variables: {
                    language: preferredLanguage  // ← ТОЛЬКО язык в variables
                }
            },
            input: JSON.stringify({  // ← ВСЁ остальное в input, как у Astrology/Tarot
                dream: dreamText,
                context: {
                    moonPhase: dreamAtmosphere.moonPhase.name,
                    moonSign: dreamAtmosphere.moonSign.name,
                    date: dreamDate,
                    weekday: weekdayName,
                    gender: gender === 'male' ? 'мужской' : 'женский'
                }
            })
        });
    } catch (error) {
        console.error('[AI] Error calling OpenAI Responses API for dreambook:', error);
        console.error('[AI] Error details:', error.message);
        throw new Error('Failed to get dreambook interpretation from AI.');
    }

    const outputText = extractResponseText(response);

    if (!outputText) {
        console.error('[AI] Dreambook response did not contain any text output.', response);
        throw new Error('AI response did not include dreambook data.');
    }

    let dreambookData;
    try {
        dreambookData = JSON.parse(outputText);
    } catch (parseError) {
        console.error('[AI] Failed to parse dreambook JSON:', parseError, outputText);
        throw new Error('Failed to parse dreambook interpretation from AI.');
    }

    if (!dreambookData.title || !dreambookData.dreambook || !dreambookData.dreambook.content) {
        console.error('[AI] Dreambook response missing required fields:', dreambookData);
        throw new Error('AI response missing title or dreambook.content.');
    }

    // Извлекаем ключевые слова из **звёздочек** в контенте
    const content = dreambookData.dreambook.content;
    const starsRegex = /\*\*([^*]+)\*\*/g;
    const highlightWords = [];
    let match;
    while ((match = starsRegex.exec(content)) !== null) {
        highlightWords.push(match[1]); // Добавляем слово без звёздочек
    }

    // Формируем финальный объект для возврата
    const result = {
        title: dreambookData.title,
        processedText: dreamText, // Оставляем оригинальный текст (будет обработан позже, если нужно)
        lenses: {
            dreambook: {
                title: 'Сонник',
                content: content, // Сохраняем текст СО звёздочками для frontend
                highlightWords: highlightWords, // Массив слов для дополнительной подсветки
                // Добавляем метаданные для UI
                metadata: {
                    moonPhase: dreamAtmosphere.moonPhase.name,
                    moonSign: dreamAtmosphere.moonSign.name,
                    moonEmoji: dreamAtmosphere.moonSign.emoji,
                    weekday: weekdayName,
                    date: dreamDate
                }
            }
        }
    };

    console.log(`[AI] Dreambook interpretation received: title="${result.title}", highlights=${highlightWords.length} words marked with **`);

    return result;
};
