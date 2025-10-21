import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const webAppUrl = process.env.TELEGRAM_WEB_APP_URL;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN not found in environment variables');
  process.exit(1);
}

if (!webAppUrl) {
  console.error('❌ TELEGRAM_WEB_APP_URL not found in environment variables');
  process.exit(1);
}

// Создаем бота
const bot = new TelegramBot(token, { polling: true });

console.log('🤖 Telegram Bot started successfully!');

// Команда /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'User';
  const languageCode = msg.from.language_code || 'en';
  
  // Определяем язык пользователя
  const isRussian = languageCode === 'ru';
  
  const message = isRussian ? 
    `👋 Привет, ${firstName}!

🌙 *Morpheus* — твой личный толкователь снов, работающий на основе искусственного интеллекта.

✨ *Что умеет приложение:*
• 🎙️ Записывать сны голосом или текстом
• 🔮 Толковать образы с помощью AI
• 📚 Анализировать символы снов
• 💜 Давать персонализированные советы
• 📖 Хранить историю твоих снов

Откройте приложение, чтобы начать толковать свои сны! 👇` :
    `👋 Hi, ${firstName}!

🌙 *Morpheus* — your personal AI-powered dream interpreter.

✨ *What the app can do:*
• 🎙️ Record dreams by voice or text
• 🔮 Interpret symbols using AI
• 📚 Analyze dream meanings
• 💜 Provide personalized insights
• 📖 Save your dream history

Open the app to start interpreting your dreams! 👇`;

  const keyboard = {
    inline_keyboard: [[
      {
        text: isRussian ? '🌙 Открыть приложение' : '🌙 Open App',
        web_app: { url: webAppUrl }
      }
    ]]
  };

  bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
});

// Команда /open
bot.onText(/\/open/, (msg) => {
  const chatId = msg.chat.id;
  const languageCode = msg.from.language_code || 'en';
  const isRussian = languageCode === 'ru';
  
  const message = isRussian ?
    '🌙 Нажмите на кнопку ниже, чтобы открыть приложение:' :
    '🌙 Click the button below to open the app:';
  
  const keyboard = {
    inline_keyboard: [[
      {
        text: isRussian ? '🌙 Открыть Morpheus' : '🌙 Open Morpheus',
        web_app: { url: webAppUrl }
      }
    ]]
  };

  bot.sendMessage(chatId, message, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  });
});

// Обработка ошибок
bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.message);
});

bot.on('error', (error) => {
  console.error('❌ Bot error:', error.message);
});

console.log('✅ Bot is running. Waiting for commands...');
console.log(`📱 Web App URL: ${webAppUrl}`);

