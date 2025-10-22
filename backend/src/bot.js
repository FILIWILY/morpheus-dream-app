import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'User';
  const languageCode = msg.from.language_code || 'en';
  
  // Определяем язык пользователя
  const isRussian = languageCode === 'ru';
  
  // Первое сообщение - приветствие и описание
  const welcomeMessage = isRussian ? 
    `👋 Привет, ${firstName}!

🌙 *Morpheus* — твой личный толкователь снов, работающий на основе искусственного интеллекта.

✨ *Что умеет приложение:*
• 🎙️ Записывать сны голосом или текстом
• 🔮 Толковать образы с помощью AI
• 📚 Анализировать символы снов
• 💜 Давать персонализированные советы
• 📖 Хранить историю твоих снов` :
    `👋 Hi, ${firstName}!

🌙 *Morpheus* — your personal AI-powered dream interpreter.

✨ *What the app can do:*
• 🎙️ Record dreams by voice or text
• 🔮 Interpret symbols using AI
• 📚 Analyze dream meanings
• 💜 Provide personalized insights
• 📖 Save your dream history`;

  // Отправляем приветствие
  await bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown'
  });

  // Второе сообщение - инструкция с картинкой
  const instructionMessage = isRussian ?
    `🚀 *Как открыть приложение?*

Нажмите на кнопку *Menu* (🌙) в поле ввода сообщения, чтобы запустить Morpheus и начать толковать свои сны!` :
    `🚀 *How to open the app?*

Tap the *Menu* button (🌙) in the message input field to launch Morpheus and start interpreting your dreams!`;

  // Путь к картинке
  const photoPath = join(__dirname, '..', 'assets', 'bot', 'open.png');

  // Отправляем фото с инструкцией
  try {
    await bot.sendPhoto(chatId, photoPath, {
      caption: instructionMessage,
      parse_mode: 'Markdown'
    });
  } catch (error) {
    console.error('❌ Error sending photo:', error);
    // Если не получилось отправить фото, отправляем просто текст
    await bot.sendMessage(chatId, instructionMessage, {
      parse_mode: 'Markdown'
    });
  }
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

