import swisseph from 'swisseph';

// Планеты для расчета
const PLANET_LIST = {
    sun: swisseph.SE_SUN,
    moon: swisseph.SE_MOON,
    mercury: swisseph.SE_MERCURY,
    venus: swisseph.SE_VENUS,
    mars: swisseph.SE_MARS,
    jupiter: swisseph.SE_JUPITER,
    saturn: swisseph.SE_SATURN,
    uranus: swisseph.SE_URANUS,
    neptune: swisseph.SE_NEPTUNE,
    pluto: swisseph.SE_PLUTO,
};

/**
 * Рассчитывает и сохраняет натальную карту пользователя.
 * @param {string} birthDate - Дата рождения в формате 'YYYY-MM-DD'
 * @param {string} birthTime - Время рождения в формате 'HH:MM'
 * @param {number} latitude - Широта
 * @param {number} longitude - Долгота
 * @returns {Promise<object|null>} - Объект натальной карты или null в случае ошибки
 */
export const calculateNatalChart = async (birthDate, birthTime, latitude, longitude) => {
    try {
        if (!birthDate || !birthTime || !latitude || !longitude) {
            console.log('Недостаточно данных для расчета натальной карты.');
            return null;
        }

        // 1. Преобразование времени в UTC и Юлианский день
        const [day, month, year] = birthDate.split('.').map(Number);
        const [hour, minute] = birthTime.split(':').map(Number);
        const date = new Date(Date.UTC(year, month - 1, day, hour, minute));
        
        const julianDayUTC = swisseph.swe_julday(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCHours() + date.getUTCMinutes() / 60, swisseph.SE_GREG_CAL);

        // 2. Установка гео-координат
        swisseph.swe_set_topo(longitude, latitude, 0);

        // 3. Расчет планет
        const planets = {};
        const flags = swisseph.SEFLG_SPEED;
        for (const [name, planetId] of Object.entries(PLANET_LIST)) {
            const planetData = swisseph.swe_calc_ut(julianDayUTC, planetId, flags);
            planets[name] = {
                longitude: planetData.longitude,
            };
        }

        // 4. Расчет домов и Асцендента (система Плацидуса)
        const housesData = swisseph.swe_houses(julianDayUTC, latitude, longitude, 'P');

        const natalChart = {
            planets,
            houses: {
                cusps: housesData.house,
            },
            ascendant: {
                longitude: housesData.ascendant,
            },
        };

        return natalChart;

    } catch (error) {
        console.error('Ошибка при расчете натальной карты:', error);
        return null;
    }
};
