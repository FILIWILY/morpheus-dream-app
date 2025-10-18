# Руководство по созданию и развертыванию Telegram Mini App

Это руководство описывает ключевые шаги и лучшие практики для создания нового Telegram Mini App с нуля, включая аутентификацию, локальную разработку, кеширование и развертывание.

## 1. Архитектура приложения

Приложение состоит из двух основных частей:
-   **Frontend:** Клиентское приложение (например, на React, Vue), которое запускается внутри Telegram.
-   **Backend:** Серверное приложение (например, на Node.js/Express), которое обрабатывает логику, взаимодействие с БД и аутентификацию.

## 2. Аутентификация пользователя через Telegram

Telegram Mini Apps имеют встроенный механизм безопасной аутентификации. Когда пользователь открывает ваше приложение, Telegram передает специальную строку `initData`, которая содержит информацию о пользователе и подписана вашим токеном бота.

### Backend: Проверка `initData`

На бэкенде вы должны проверять подлинность `initData` при каждом запросе, чтобы убедиться, что он действительно пришел от Telegram.

**Ключевые переменные окружения (`.env`):**

```
TELEGRAM_BOT_TOKEN=...
# Установите в 'true' ТОЛЬКО для локальной разработки
DANGEROUSLY_BYPASS_AUTH=false
DATABASE_URL=...
```

**Пример middleware для Express.js:**

```javascript
// backend/src/middleware/auth.js
import crypto from 'crypto';
import * as db from '../services/database.js'; // Ваш модуль для работы с БД

/**
 * Middleware для проверки аутентификации Telegram.
 */
export async function verifyTelegramAuth(req, res, next) {
    const bypassAuth = process.env.DANGEROUSLY_BYPASS_AUTH === 'true';
    const initDataString = req.headers['x-telegram-init-data'];

    // 1. Режим обхода для локальной разработки
    if (bypassAuth) {
        const userId = req.headers['x-telegram-user-id'];
        if (!userId) {
            return res.status(401).json({ error: 'В режиме обхода требуется заголовок X-Telegram-User-ID' });
        }
        console.warn(`[AUTH] ⚠️ ВНИМАНИЕ: Обход аутентификации для пользователя ${userId}. НЕ ИСПОЛЬЗОВАТЬ В ПРОДАШКЕНЕ.`);
        
        try {
            await db.findOrCreateUser(userId); // Убедимся, что пользователь есть в БД
            req.userId = userId;
            return next();
        } catch (error) {
            console.error('Ошибка при создании пользователя в режиме обхода:', error);
            return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
        }
    }

    // 2. В продакшен-режиме `initData` обязательна
    if (!initDataString) {
        return res.status(401).json({ error: 'Требуется заголовок X-Telegram-Init-Data' });
    }

    // 3. Криптографическая проверка
    try {
        const isValid = await validateInitData(initDataString, process.env.TELEGRAM_BOT_TOKEN);
        if (!isValid) {
            return res.status(403).json({ error: 'Неверные данные от Telegram' });
        }
        
        const params = new URLSearchParams(initDataString);
        const user = JSON.parse(params.get('user'));
        
        if (!user || !user.id) {
            return res.status(403).json({ error: 'Не найдены данные пользователя в initData' });
        }

        // 4. Создаем или находим пользователя в БД
        await db.findOrCreateUser(user.id.toString());
        req.userId = user.id.toString();
        
        next();
    } catch (error) {
        console.error('Ошибка валидации данных Telegram:', error);
        return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
}

/**
 * Валидирует строку initData от Telegram.
 * @see https://core.telegram.org/bots/webapps#validating-data-received-via-the-web-app
 */
async function validateInitData(initDataString, botToken) {
    const params = new URLSearchParams(initDataString);
    const hash = params.get('hash');
    
    // Проверка времени данных (например, не старше 24 часов)
    const authDate = params.get('auth_date');
    const authTimestamp = parseInt(authDate, 10);
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (currentTimestamp - authTimestamp > 3600 * 24) { // 24 часа
        console.error('Данные initData устарели');
        return false;
    }

    params.delete('hash');
    const keys = Array.from(params.keys()).sort();
    const dataCheckString = keys.map(key => `${key}=${params.get(key)}`).join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    
    return computedHash === hash;
}
```

### Взаимодействие с Базой Данных

Вам понадобится функция, которая находит пользователя по `telegram_id` или создает нового, если он не найден.

**Пример `findOrCreateUser` (для PostgreSQL):**

```javascript
// backend/src/services/database.js
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export async function findOrCreateUser(telegramId) {
    const query = `
        INSERT INTO users (telegram_id)
        VALUES ($1)
        ON CONFLICT (telegram_id) DO NOTHING;
    `;
    await pool.query(query, [telegramId]);

    const result = await pool.query('SELECT * FROM users WHERE telegram_id = $1', [telegramId]);
    return result.rows[0];
}
```

### Frontend: Отправка `initData`

На фронтенде вам нужно получить `initData` из Telegram SDK и передавать ее в заголовках каждого API-запроса.

```javascript
// frontend/src/services/api.js

const getInitData = () => {
    // В продакшене
    if (window.Telegram && window.Telegram.WebApp) {
        return window.Telegram.WebApp.initData;
    }
    // Для локальной разработки
    console.warn("Telegram WebApp SDK не найдено. Используются моковые данные.");
    return ""; // Возвращаем пустую строку, бэкенд будет использовать обход
}

export const api = {
    async get(endpoint) {
        const headers = {
            'Content-Type': 'application/json',
            'x-telegram-init-data': getInitData()
        };

        // В режиме обхода добавляем ID пользователя
        if (process.env.NODE_ENV === 'development') {
            headers['x-telegram-user-id'] = '123456789'; // Пример ID для тестов
        }
        
        const response = await fetch(`/api/${endpoint}`, { headers });
        return response.json();
    }
};
```

## 3. Механизм Cache Busting (Сброс кеша)

Чтобы пользователи всегда видели последнюю версию вашего приложения, а не закешированную старую, необходимо использовать "cache busting". Самый надежный способ — добавлять уникальный хеш к именам файлов CSS и JS при каждой сборке.

**Решение:** Используйте современные сборщики, такие как **Vite** или **Webpack**. Они делают это автоматически.

**Пример конфигурации Vite (`vite.config.js`):**
Vite по умолчанию генерирует файлы с хешами в именах при запуске `npm run build`. Например, `index-a8b4c2d1.js`. Вам не нужна дополнительная настройка.

Когда вы загружаете эти файлы в `index.html`, они будут выглядеть так:
```html
<script type="module" crossorigin src="/assets/index-a8b4c2d1.js"></script>
<link rel="stylesheet" href="/assets/index-b9e3f1a2.css">
```
При следующей сборке хеши изменятся, и браузер будет вынужден загрузить новые версии.

## 4. Развертывание (Deploy) и роль домена

### Почему нужен домен?

Telegram Mini Apps — это, по сути, веб-сайты, открывающиеся внутри Telegram. **Telegram требует, чтобы ваше приложение было доступно по публичному домену с HTTPS.** Локальные адреса (`localhost`) работать не будут.

### Шаги по развертыванию:

1.  **Купите домен:** Приобретите доменное имя (например, `your-app.com`).
2.  **Настройте сервер:** Арендуйте виртуальный сервер (VPS/VDS).
3.  **Загрузите код:** Скопируйте собранный фронтенд (`dist` папка) и бэкенд на сервер.
4.  **Настройте реверс-прокси (Nginx):** Nginx будет "смотреть" в интернет и распределять запросы:
    *   Запросы к `/api/*` будут перенаправляться на ваш работающий бэкенд.
    *   Все остальные запросы будут отдавать файлы вашего фронтенда.
5.  **Получите SSL-сертификат:** Используйте Let's Encrypt для получения бесплатного SSL-сертификата, чтобы ваш сайт работал по HTTPS.

**Пример конфигурации Nginx:**

```nginx
server {
    server_name your-app.com;

    # Путь к собранным файлам фронтенда
    root /var/www/your-app/frontend/dist; 
    index index.html;

    # API запросы перенаправляем на бэкенд
    location /api/ {
        proxy_pass http://localhost:3000/; # Предполагается, что ваш бэкенд работает на порту 3000
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Все остальные запросы отдают фронтенд
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Настройки SSL
    listen 443 ssl; 
    ssl_certificate /etc/letsencrypt/live/your-app.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-app.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

# Редирект с HTTP на HTTPS
server {
    listen 80;
    server_name your-app.com;
    return 301 https://$host$request_uri;
}
```

## 5. Распространенные ошибки и на что обращать внимание

1.  **Секретный токен в коде:** Никогда не храните `TELEGRAM_BOT_TOKEN` на фронтенде или в открытом виде на бэкенде. Используйте переменные окружения (`.env`).
2.  **Неправильная валидация `initData`:** Ключи в `dataCheckString` **обязательно** должны быть отсортированы по алфавиту перед генерацией хеша.
3.  **Забытый `DANGEROUSLY_BYPASS_AUTH` в продакшене:** Перед развертыванием всегда проверяйте, что эта переменная установлена в `false`. Это критически важно для безопасности.
4.  **Проблемы с кешем:** Если вы не используете cache busting, пользователи могут столкнуться с неработающим приложением после обновления, так как у них загрузится старый JS-код и новый HTML (или наоборот).
5.  **CORS ошибки:** При правильной настройке Nginx (когда и фронтенд, и API на одном домене), проблем с CORS быть не должно. Если они возникают, значит, что-то настроено неверно.
