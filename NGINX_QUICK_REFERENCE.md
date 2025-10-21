# 🔵🟢 Два Nginx - Быстрая Справка

## 🏗️ Архитектура

```
Internet (HTTPS/443)
    ↓
🔵 EXTERNAL NGINX (на сервере Ubuntu)
   /etc/nginx/sites-enabled/dream-interpretation.ru
   • SSL, Security, Routing
   • ОБНОВЛЯЕТСЯ ВРУЧНУЮ ⚠️
   ↓
   ├─→ http://127.0.0.1:8080 (Frontend)
   │      ↓
   │   🟢 INTERNAL NGINX (Docker контейнер)
   │      frontend/nginx.conf
   │      • Раздача статики, кэширование
   │      • ОБНОВЛЯЕТСЯ АВТОМАТИЧЕСКИ ✅
   │      ↓
   │   React SPA
   │
   └─→ http://127.0.0.1:9000 (Backend)
          Express.js
```

---

## 🔵 EXTERNAL NGINX (твоя зона ответственности)

**Где:** `/etc/nginx/sites-enabled/dream-interpretation.ru` (на сервере)

**Как обновить:**
```bash
sudo nano /etc/nginx/sites-enabled/dream-interpretation.ru
sudo nginx -t
sudo systemctl reload nginx
```

**Когда обновлять:**
- ⚠️ Лимиты загрузки (client_max_body_size)
- ⚠️ Security headers
- ⚠️ SSL конфигурация
- ⚠️ Новые location блоки

**Полный конфиг:** См. `ReadMe/nginx.md` → "ПОЛНАЯ АКТУАЛЬНАЯ КОНФИГУРАЦИЯ"

---

## 🟢 INTERNAL NGINX (автоматически)

**Где:** `frontend/nginx.conf` (в репозитории)

**Как обновить:**
```bash
# Локально
docker compose up -d --build frontend

# На проде
./deploy.sh
```

**Когда обновляется:** Автоматически при любой пересборке frontend контейнера

---

## 🚨 КРИТИЧНО: Исправление ошибки 413

**Проблема:** Аудио > 1MB не загружается (413 Request Entity Too Large)

**Решение:**

### 1️⃣ Internal Nginx - ✅ УЖЕ ИСПРАВЛЕН
Файл `frontend/nginx.conf` уже содержит `client_max_body_size 50M;`

### 2️⃣ External Nginx - ⚠️ ИСПРАВЬ ВРУЧНУЮ

```bash
# На сервере:
sudo nano /etc/nginx/sites-enabled/dream-interpretation.ru

# Найди эту секцию:
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dream-interpretation.ru www.dream-interpretation.ru;
    
    # ⭐ ДОБАВЬ ЭТУ СТРОКУ:
    client_max_body_size 50M;
    
    # ... остальная конфигурация
}

# Примени:
sudo nginx -t
sudo systemctl reload nginx
```

**Проверка:**
```bash
# Убедись что строка добавлена:
grep "client_max_body_size" /etc/nginx/sites-enabled/dream-interpretation.ru
# Должно вывести: client_max_body_size 50M;
```

---

## 📚 Детальная документация

Полная информация: **`ReadMe/nginx.md`**

