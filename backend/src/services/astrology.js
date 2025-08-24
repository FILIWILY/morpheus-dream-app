// backend/src/services/astrology.js
import swisseph from 'swisseph';

// --- Константы ---

const PLANET_IDS = {
    sun: swisseph.SE_SUN, moon: swisseph.SE_MOON, mercury: swisseph.SE_MERCURY, venus: swisseph.SE_VENUS, mars: swisseph.SE_MARS, jupiter: swisseph.SE_JUPITER, saturn: swisseph.SE_SATURN, uranus: swisseph.SE_URANUS, neptune: swisseph.SE_NEPTUNE, pluto: swisseph.SE_PLUTO,
};
const ZODIAC_SIGNS = [
  { sign: 'aries', name: 'Овен', emoji: '♈' }, { sign: 'taurus', name: 'Телец', emoji: '♉' }, { sign: 'gemini', name: 'Близнецы', emoji: '♊' }, { sign: 'cancer', name: 'Рак', emoji: '♋' }, { sign: 'leo', name: 'Лев', emoji: '♌' }, { sign: 'virgo', name: 'Дева', emoji: '♍' }, { sign: 'libra', name: 'Весы', emoji: '♎' }, { sign: 'scorpio', name: 'Скорпион', emoji: '♏' }, { sign: 'sagittarius', name: 'Стрелец', emoji: '♐' }, { sign: 'capricorn', name: 'Козерог', emoji: '♑' }, { sign: 'aquarius', name: 'Водолей', emoji: '♒' }, { sign: 'pisces', name: 'Рыбы', emoji: '♓' },
];
const MOON_PHASES = [
    { phase: 'new_moon', name: 'Новолуние' }, { phase: 'waxing_crescent', name: 'Растущий полумесяц' }, { phase: 'first_quarter', name: 'Первая четверть' }, { phase: 'waxing_gibbous', name: 'Растущая Луна' }, { phase: 'full_moon', name: 'Полнолуние' }, { phase: 'waning_gibbous', name: 'Убывающая Луна' }, { phase: 'last_quarter', name: 'Последняя четверть' }, { phase: 'waning_crescent', name: 'Убывающий полумесяц' },
];
const PLANET_NAMES_RU = {
    sun: "Солнце", moon: "Луна", mercury: "Меркурий", venus: "Венера", mars: "Марс", jupiter: "Юпитер", saturn: "Сатурн", uranus: "Уран", neptune: "Нептун", pluto: "Плутон"
};
const ASPECT_NAMES_RU = {
    conjunction: "соединении", opposition: "оппозиции", square: "квадрате", trine: "трине", sextile: "секстиле"
};
const ATMOSPHERE_PROMPT_GUIDES = {
    moon_phases: {
        new_moon: "Новолуние — время начинаний и скрытого потенциала. Объясни, как эта энергия могла повлиять на зарождение сюжета сна.",
        waxing_crescent: "Растущий полумесяц — это первый импульс к действию. Объясни, как эта энергия могла проявиться в динамике или событиях сна.",
        first_quarter: "Первая четверть — период активных действий и первых вызовов. Найди в сюжете сна отражение этой напряженной, но конструктивной энергии.",
        waxing_gibbous: "Растущая Луна — этап анализа и доработки. Покажи, как сон мог отражать процесс анализа или улучшения какой-то жизненной ситуации.",
        full_moon: "Полнолуние — пик эмоциональной энергии и ясности. Объясни, как эта интенсивная энергия могла усилить эмоции или принести откровения во сне.",
        waning_gibbous: "Убывающая Луна — время для осмысления и благодарности. Свяжи эту энергию с возможным подведением итогов или переоценкой ценностей в сюжете сна.",
        last_quarter: "Последняя четверть — кризис осознания и освобождения. Найди в сюжете сна отражение внутреннего конфликта или необходимости избавиться от чего-то.",
        waning_crescent: "Убывающий полумесяц — период завершения и отдыха. Объясни, как сон мог символизировать завершение какого-то этапа или потребность в уединении."
    },
    zodiac_signs: {
        aries: "Луна в Овне окрашивает эмоции в импульсивные и смелые тона. Покажи, как эта огненная энергия проявилась в действиях или атмосфере сна.",
        taurus: "Луна в Тельце ищет стабильности и комфорта. Объясни, как эта земная энергия могла повлиять на темы безопасности, ресурсов или удовольствий во сне.",
        gemini: "Луна в Близнецах делает настроение переменчивым и любопытным. Найди в сюжете сна отражение тем общения, информации или двойственности.",
        cancer: "Луна в Раке обостряет чувствительность и интуицию. Объясни, как эта водная энергия повлияла на эмоциональный фон сна, темы семьи или прошлого.",
        leo: "Луна во Льве создает потребность в признании и самовыражении. Покажи, как эта творческая энергия проявилась в сюжете сна.",
        virgo: "Луна в Деве подвергает эмоции анализу и критике. Найди в сюжете сна отражение тем порядка, работы, здоровья или внимания к деталям.",
        libra: "Луна в Весах ищет гармонии и баланса. Объясни, как эта воздушная энергия повлияла на темы отношений, выбора или справедливости во сне.",
        scorpio: "Луна в Скорпионе делает чувства глубокими и интенсивными. Покажи, как эта энергия повлияла на темы тайн, трансформации или власти во сне.",
        sagittarius: "Луна в Стрельце создает оптимистичное настроение и жажду свободы. Найди в сюжете сна отражение тем путешествий, знаний или расширения горизонтов.",
        capricorn: "Луна в Козероге делает эмоции сдержанными и подчиненными цели. Объясни, как эта энергия повлияла на темы карьеры, ответственности или структуры во сне.",
        aquarius: "Луна в Водолее создает потребность в свободе и оригинальности. Покажи, как эта энергия проявилась в нестандартных образах или идеях сна.",
        pisces: "Луна в Рыбах размывает границы эмоций и усиливает воображение. Объясни, как эта мистическая энергия повлияла на символизм и интуитивные прозрения во сне."
    }
};
const PASSPORT_PROMPT_GUIDES = {
    sun: {
        aries: "Солнце в Овне наделяет человека энергией первопроходца. Объясни, как эта ключевая черта могла проявиться в сюжете сна.",
        taurus: "Солнце в Тельце дает стремление к стабильности и накоплению. Объясни, как эта черта могла быть отражена во сне.",
        gemini: "Солнце в Близнецах — это любознательность и гибкость ума. Покажи, как это качество проявилось в событиях сна.",
        cancer: "Солнце в Раке дает глубокую эмоциональность и потребность в безопасности. Объясни, как сон мог символически выразить эту черту.",
        leo: "Солнце во Льве — это творческая энергия и стремление к признанию. Найди в сюжете сна отражение этой потребности.",
        virgo: "Солнце в Деве — это аналитический ум и внимание к деталям. Покажи, как это качество проявилось во сне.",
        libra: "Солнце в Весах дает стремление к гармонии и партнерству. Объясни, как сон мог отразить эту ключевую ценность.",
        scorpio: "Солнце в Скорпионе — это сильная воля и стремление к трансформации. Найди в сюжете сна символы, отражающие эту черту.",
        sagittarius: "Солнце в Стрельце — это оптимизм и любовь к свободе. Покажи, как это качество проявилось в атмосфере или событиях сна.",
        capricorn: "Солнце в Козероге — это целеустремленность и ответственность. Объясни, как сон мог символически выразить эту черту.",
        aquarius: "Солнце в Водолее — это оригинальность мышления и интерес к будущему. Найди в сюжете сна отражение этой потребности.",
        pisces: "Солнце в Рыбах — это богатое воображение и эмпатия. Покажи, как это качество могло повлиять на образы и чувства во сне."
    },
    moon: {
        aries: "Луна в Овне говорит о потребности в эмоциональной независимости. Объясни, как эта потребность могла быть отражена в реакциях или событиях сна.",
        taurus: "Луна в Тельце ищет эмоциональный комфорт через стабильность. Покажи, как эта потребность проявилась в атмосфере или сюжете сна.",
        gemini: "Луна в Близнецах нуждается в проговаривании чувств и информации. Объясни, как сон мог символически выразить эту потребность.",
        cancer: "Луна в Раке дает глубокую потребность в эмоциональной привязанности. Найди в сюжете сна отражение этой потребности.",
        leo: "Луна в Льве нуждается в признании своих чувств. Объясни, как эта эмоциональная потребность могла проявиться во сне.",
        virgo: "Луна в Деве ищет комфорт в порядке и чувстве полезности. Покажи, как эта потребность отразилась в деталях или сюжете сна.",
        libra: "Луна в Весах нуждается в гармоничном партнерстве. Объясни, как сон мог символически выразить эту потребность.",
        scorpio: "Луна в Скорпионе дает потребность в глубоких, интенсивных переживаниях. Найди в сюжете сна отражение этой эмоциональной потребности.",
        sagittarius: "Луна в Стрельце нуждается в эмоциональной свободе и пространстве. Покажи, как эта потребность проявилась во сне.",
        capricorn: "Луна в Козероге чувствует себя в безопасности, контролируя эмоции. Объясни, как эта потребность могла отразиться в сюжете сна.",
        aquarius: "Луна в Водолее дает потребность в эмоциональной свободе и дружеском принятии. Найди в сюжете сна отражение этой потребности.",
        pisces: "Луна в Рыбах говорит о глубокой чувствительности и потребности в слиянии. Покажи, как эта эмоциональная потребность проявилась во сне."
    }
};
const TRANSIT_PLANET_SCORES = { pluto: 50, uranus: 40, saturn: 30, neptune: 25, jupiter: 15 };
const ASPECT_SCORES = { conjunction: 30, opposition: 25, square: 20, trine: 10, sextile: 5 };
const MAJOR_ASPECTS = { conjunction: 0, sextile: 60, square: 90, trine: 120, opposition: 180 };
const ORB = 8.0;

// --- Вспомогательные функции ---

function getJulianDay(date) {
    return swisseph.swe_julday(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCHours(), swisseph.SE_GREG_CAL);
}

function getPlanetPosition(julianDay, planetId) {
    return new Promise((resolve, reject) => {
        swisseph.swe_calc_ut(julianDay, planetId, swisseph.SEFLG_SPEED, (body) => {
            if (body.error) return reject(new Error(body.error));
            resolve(body);
        });
    });
}

function getZodiacSign(longitude) {
    const signIndex = Math.floor(longitude / 30);
    return ZODIAC_SIGNS[signIndex];
}

function getMoonPhase(moonLongitude, sunLongitude) {
    let diff = moonLongitude - sunLongitude;
    if (diff < 0) diff += 360;
    if (diff >= 0 && diff < 45) return MOON_PHASES[0]; if (diff >= 45 && diff < 90) return MOON_PHASES[1]; if (diff >= 90 && diff < 135) return MOON_PHASES[2]; if (diff >= 135 && diff < 180) return MOON_PHASES[3]; if (diff >= 225 && diff < 270) return MOON_PHASES[5]; if (diff >= 270 && diff < 315) return MOON_PHASES[6]; if (diff >= 315 && diff <= 360) return MOON_PHASES[7];
    return MOON_PHASES[4];
}

// --- Основные экспортируемые функции ---

async function getDreamAtmosphere(dateString) {
    console.log(`[Astro] Calculating Dream Atmosphere for date: ${dateString}`);
    const date = new Date(dateString);
    date.setUTCHours(0, 0, 0, 0);
    const julianDay = getJulianDay(date);
    try {
        const [moonData, sunData] = await Promise.all([ getPlanetPosition(julianDay, PLANET_IDS.moon), getPlanetPosition(julianDay, PLANET_IDS.sun) ]);
        const moonSign = getZodiacSign(moonData.longitude);
        const moonPhase = getMoonPhase(moonData.longitude, sunData.longitude);
        
        console.log(`[Astro] Dream Atmosphere calculated: Moon in ${moonSign.name}, ${moonPhase.name}`);

        return {
            moonPhase: {
                name: moonPhase.name,
                phase: moonPhase.phase,
                promptGuide: ATMOSPHERE_PROMPT_GUIDES.moon_phases[moonPhase.phase]
            },
            moonSign: {
                name: moonSign.name,
                emoji: moonSign.emoji,
                promptGuide: ATMOSPHERE_PROMPT_GUIDES.zodiac_signs[moonSign.sign]
            }
        };
    } catch (error) {
        console.error("[Astro] Error calculating dream atmosphere:", error);
        return { error: "Не удалось рассчитать астрологические данные для этого сна." };
    }
}

async function calculateTopTransits(natalChart, dreamDate) {
    console.log(`[Astro] Calculating Top Transits for dream date: ${dreamDate}`);
    if (!natalChart || !natalChart.planets) {
        console.error("[Astro] Natal chart is missing or invalid for transit calculation.");
        return { error: "Для расчета ключевых влияний необходимо сохранить полную информацию о рождении в профиле." };
    }
    const date = new Date(dreamDate);
    date.setUTCHours(0, 0, 0, 0);
    const dreamJulianDay = getJulianDay(date);
    const transitPlanetsToCalc = ['jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];
    try {
        const transitPromises = transitPlanetsToCalc.map(p => getPlanetPosition(dreamJulianDay, PLANET_IDS[p]));
        const transitPositionsRaw = await Promise.all(transitPromises);
        const transitPositions = transitPlanetsToCalc.reduce((acc, name, index) => {
            acc[name] = transitPositionsRaw[index];
            return acc;
        }, {});
        const foundAspects = [];
        for (const transitPlanetName of transitPlanetsToCalc) {
            for (const natalPlanetName in natalChart.planets) {
                const transitPlanetLon = transitPositions[transitPlanetName].longitude;
                const natalPlanetLon = natalChart.planets[natalPlanetName].longitude;
                let angle = Math.abs(transitPlanetLon - natalPlanetLon);
                if (angle > 180) angle = 360 - angle;
                for (const aspectName in MAJOR_ASPECTS) {
                    const aspectAngle = MAJOR_ASPECTS[aspectName];
                    if (Math.abs(angle - aspectAngle) <= ORB) {
                        const orb_exactness = Math.abs(angle - aspectAngle);
                        const planetScore = TRANSIT_PLANET_SCORES[transitPlanetName] || 0;
                        const aspectScore = ASPECT_SCORES[aspectName] || 0;
                        const orbBonus = Math.round(10 - orb_exactness);
                        const moonBonus = natalPlanetName === 'moon' ? 15 : 0;
                        const totalScore = planetScore + aspectScore + orbBonus + moonBonus;
                        foundAspects.push({ transit_planet: transitPlanetName, aspect_type: aspectName, natal_planet: natalPlanetName, score: totalScore, orb: orb_exactness });
                    }
                }
            }
        }
        const top3Aspects = foundAspects.sort((a, b) => b.score - a.score).slice(0, 3);

        console.log('[Astro] Top 3 Transits calculated:', JSON.stringify(top3Aspects.map(a => ({ transit: a.transit_planet, aspect: a.aspect_type, natal: a.natal_planet, score: a.score })), null, 2));

        return {
            title: "Ключевые Транзиты",
            insights: top3Aspects,
            explanation: "Этот блок является ядром Астрологической линзы. Его задача — ответить на главный вопрос пользователя: \"Почему именно этот сон приснился мне именно сейчас?\". Он должен показать связь между сюжетом сна и глубокими, долгосрочными психологическими процессами, которые происходят в вашей жизни, основываясь на объективных астрологических данных."
        };
    } catch (error) {
        console.error("[Astro] Error calculating top transits:", error);
        return { error: "Не удалось рассчитать транзитные влияния." };
    }
}

function getMockInterpretation(aspect) {
    const transitPlanet = aspect.transit_planet;
    const { natal_planet: natalPlanet, aspect_type: aspectType } = aspect;
    const transitPlanetName = transitPlanet.charAt(0).toUpperCase() + transitPlanet.slice(1);
    const natalPlanetName = natalPlanet.charAt(0).toUpperCase() + natalPlanet.slice(1);

    const templates = {
        jupiter: {
            interpretation: `расширяет и приносит новые возможности в сферу, за которую отвечает ваш натальный ${natalPlanetName}. Сон о поездке — это классический символ этого влияния, указывающий на стремление к новым горизонтам.`,
            lesson: "Урок этого аспекта — научиться видеть и использовать возможности для роста, которые появляются в вашей жизни. Вселенная призывает вас расширить свои горизонты и поверить в удачу.",
            recommendation: "Будьте открыты новому. Если вам предлагают поездку, обучение или новый проект — соглашайтесь. Доверяйте своему оптимизму и не бойтесь делать смелые шаги. Это время для экспансии, а не для осторожности."
        },
        saturn: {
            interpretation: `требует структуры, дисциплины и ответственности в темах, связанных с вашим натальным ${natalPlanetName}. Сон, где вы боитесь дорогостоящей ошибки, точно отражает это давление и необходимость всё контролировать.`,
            lesson: "Этот аспект — это проверка на эмоциональную и личностную зрелость. Вселенная просит вас научиться строить здоровые границы и опираться не на внешние обстоятельства, а на свой внутренний стержень.",
            recommendation: "Не бойтесь этого давления, а используйте его как тренажер. Попробуйте вести дневник своих чувств. Практикуйте говорить 'нет' тому, что нарушает ваше спокойствие. Создание четких ритуалов (например, утренняя медитация) поможет вам чувствовать себя более защищенно."
        },
        uranus: {
            interpretation: `приносит внезапные озарения, неожиданные события и потребность в свободе в сфере вашего нат. ${natalPlanetName}. Появление в сне нестандартного персонажа, как киберспортсмен, говорит о поиске нетривиальных решений.`,
            lesson: "Урок Урана — принять перемены и отпустить старые, неработающие шаблоны. Это время освобождения от внутренних и внешних ограничений. Возможность — найти гениальное и нестандартное решение своей проблемы.",
            recommendation: "Не держитесь за старое. Позвольте себе экспериментировать и пробовать новые подходы. Прислушивайтесь к внезапным идеям — именно в них сейчас скрыт ключ к вашему росту. Медитации на тему 'я отпускаю контроль' могут быть очень полезны."
        },
        neptune: {
            interpretation: `размывает границы, усиливает интуицию и творческое воображение в темах ${natalPlanetName}. Ваш сон может быть наполнен тонкими предчувствиями и символами, которые сложно понять логически.`,
            lesson: "Вселенная учит вас доверять своей интуиции и слышать тихий голос своего подсознания. Этот аспект помогает развить эмпатию, духовность и связь с творческим потоком.",
            recommendation: "Ведите дневник снов, даже если они кажутся вам странными. Занимайтесь творчеством: рисуйте, пишите, слушайте музыку. Проводите время у воды. Ответы сейчас приходят не через логику, а через образы и ощущения."
        },
        pluto: {
            interpretation: `запускает глубокую трансформацию и выявляет скрытые психологические процессы, связанные с вашим ${natalPlanetName}. Сон может поднимать темы власти, контроля или интенсивных эмоциональных переживаний.`,
            lesson: "Урок Плутона — честно взглянуть на свои тени и отпустить то, что больше не служит вашему развитию. Это мощное время для исцеления глубоких травм и обретения внутренней силы.",
            recommendation: "Не бойтесь смотреть вглубь себя. Работа с психологом или доверительные разговоры с близким другом могут быть сейчас особенно эффективны. Практики по освобождению от старых обид помогут вам пройти этот период и выйти из него обновленным."
        }
    };

    const selectedTemplate = templates[transitPlanet] || {
        interpretation: 'оказывает важное влияние на вашу жизнь.',
        lesson: 'Это время для важного внутреннего роста.',
        recommendation: 'Обратите внимание на повторяющиеся ситуации в вашей жизни, они несут в себе ключ к пониманию.'
    };
    
    return {
        interpretation: `Транзитный **${transitPlanetName}** в аспекте **${aspectType}** к вашему **${natalPlanetName}** ${selectedTemplate.interpretation}`,
        lesson: selectedTemplate.lesson,
        recommendation: selectedTemplate.recommendation,
    };
}

async function getCosmicPassport(natalChart) {
    console.log('[Astro] Calculating Cosmic Passport...');
    if (!natalChart || !natalChart.planets || !natalChart.planets.sun || !natalChart.planets.moon) {
        console.error("[Astro] Natal chart is missing or invalid for Cosmic Passport calculation.");
        return {
            title: "Ваш Космический Паспорт",
            error: "Для расчета космического паспорта необходимо сохранить полную информацию о рождении в профиле.",
            sun: null,
            moon: null,
        };
    }
    try {
        const sunSignInfo = getZodiacSign(natalChart.planets.sun.longitude);
        const moonSignInfo = getZodiacSign(natalChart.planets.moon.longitude);
        
        console.log(`[Astro] Cosmic Passport calculated: Sun in ${sunSignInfo.name}, Moon in ${moonSignInfo.name}`);

        return {
            sun: {
                sign: sunSignInfo.name,
                promptGuide: PASSPORT_PROMPT_GUIDES.sun[sunSignInfo.sign]
            },
            moon: {
                sign: moonSignInfo.name,
                promptGuide: PASSPORT_PROMPT_GUIDES.moon[moonSignInfo.sign]
            }
        };
    } catch (error) {
        console.error("[Astro] Error calculating cosmic passport:", error);
        return {
            title: "Ваш Космический Паспорт",
            error: "Произошла ошибка при расчете вашего космического паспорта.",
            sun: null,
            moon: null,
        };
    }
}

export { getDreamAtmosphere, calculateTopTransits, getCosmicPassport, PLANET_NAMES_RU, ASPECT_NAMES_RU };
