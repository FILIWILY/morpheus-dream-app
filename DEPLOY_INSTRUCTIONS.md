# 🚀 Краткая инструкция по деплою

## 📋 Быстрый старт

### На сервере в первый раз:
```bash
cd ~/DI
chmod +x deploy.sh redeploy.sh
```

### Обычный деплой (сохраняет данные):
```bash
./deploy.sh
```

**Что делает:**
1. ✅ Обновляет `TELEGRAM_WEB_APP_URL` для cache busting
2. ✅ Делает `git pull`
3. ✅ Пересобирает все Docker образы
4. ✅ Перезапускает контейнеры
5. ✅ Сохраняет БД и Whisper модель

**Время:** 5-10 минут + 2-3 минуты на прогрев Whisper

---

### Полный сброс (удаляет данные):
```bash
./redeploy.sh
```

**Что делает:**
1. ✅ Обновляет `TELEGRAM_WEB_APP_URL` для cache busting
2. ✅ Удаляет все контейнеры и volumes (включая БД)
3. ✅ Делает `git pull`
4. ✅ Пересобирает все Docker образы
5. ✅ Запускает контейнеры с чистой БД

⚠️ **ВНИМАНИЕ:** Удаляет все данные пользователей!

**Время:** 5-10 минут + 3-6 минут на первую загрузку Whisper модели

---

## 🧪 Локальное тестирование

### Быстрый рестарт (без пересборки):
```bash
docker-compose restart
```

### Пересборка после изменения кода:
```bash
# Пересобрать всё
docker-compose up -d --build

# Или только нужный сервис
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

### Полная очистка локально (БЕЗ удаления Whisper кэша):
```bash
docker-compose down
docker volume rm di_postgres_data
docker-compose up -d --build
```

### Мониторинг логов:
```bash
# Все логи
docker-compose logs -f

# Только backend
docker-compose logs backend -f --tail=50

# Только whisper
docker-compose logs whisper -f --tail=20
```

### Проверка статуса:
```bash
docker-compose ps
```

---

## ⏰ Время ожидания (Whisper small)

- **Первый запуск после `docker-compose up`:** 10-15 сек (старт сервиса)
- **Первый аудио-запрос (скачивание модели):** 3-6 минут
- **Последующие запросы:** 10-15 секунд (модель из кэша)

---

## 🔧 Исправление ошибки 413 на проде

⚠️ **ВАЖНО:** У нас **ДВА Nginx** (см. `ReadMe/nginx.md` для деталей):

1. **🔵 External Nginx** (на сервере) - обновляется ВРУЧНУЮ
2. **🟢 Internal Nginx** (в Docker) - обновляется автоматически

Если получаешь ошибку **413 Request Entity Too Large** при записи аудио:

```bash
# 1. Открой конфиг внешнего Nginx
sudo nano /etc/nginx/sites-enabled/dream-interpretation.ru

# 2. Найди строку "server_name dream-interpretation.ru..."
# 3. Добавь ПОСЛЕ неё:
client_max_body_size 50M;

# 4. Проверь конфиг и перезагрузи
sudo nginx -t
sudo systemctl reload nginx
```

**Полная актуальная конфигурация:** См. `ReadMe/nginx.md` → секция "ПОЛНАЯ АКТУАЛЬНАЯ КОНФИГУРАЦИЯ"

---

## 📱 Настройка Telegram уведомлений об ошибках

1. Получи свой Telegram ID: [@userinfobot](https://t.me/userinfobot)
2. Добавь в `.env` на сервере:
```bash
ADMIN_ID=280186359
```
3. Пересобери backend:
```bash
docker compose up -d --build backend
```

Теперь при критических ошибках (5xx) будут приходить уведомления в Telegram!

---

## 📚 Полная документация

- 📖 [PRODUCTION_DEPLOYMENT.md](ReadMe/PRODUCTION_DEPLOYMENT.md) - Детальная инструкция
- 📖 [example.env.md](ReadMe/example.env.md) - Описание всех переменных окружения
- 📖 [WHISPER_INTEGRATION.md](ReadMe/WHISPER_INTEGRATION.md) - Документация Whisper

