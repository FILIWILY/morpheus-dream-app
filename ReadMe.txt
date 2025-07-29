## Быстрый старт

```bash
git clone https://github.com/FILIWILY/morpheus-dream-app.git
cd morpheus-dream-app

npm install           # установить dev-зависимости в корне
cd backend && npm install    # установить зависимости backend
cd ../frontend && npm install  # установить зависимости frontend
cd ..                 # вернуться в корень

npm run dev           # запуск frontend и backend вместе