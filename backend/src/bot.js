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

// Локализованные сообщения
const messages = {
  ru: {
    welcome: (name) => `👋 Привет, ${name}!

🌙 *Morpheus* — твой личный толкователь снов, работающий на основе искусственного интеллекта.

✨ *Что умеет приложение:*
• 🎙️ Записывать сны голосом или текстом
• 🔮 Толковать образы с помощью AI
• 📚 Анализировать символы снов
• 💜 Давать персонализированные советы
• 📖 Хранить историю твоих снов`,
    instruction: `🚀 *Как открыть приложение?*

Нажмите на кнопку *Open* в поле ввода сообщения, чтобы запустить Morpheus и начать толковать свои сны!`
  },
  en: {
    welcome: (name) => `👋 Hi, ${name}!

🌙 *Morpheus* — your personal AI-powered dream interpreter.

✨ *What the app can do:*
• 🎙️ Record dreams by voice or text
• 🔮 Interpret symbols using AI
• 📚 Analyze dream meanings
• 💜 Provide personalized insights
• 📖 Save your dream history`,
    instruction: `🚀 *How to open the app?*

Tap the *Open* button in the message input field to launch Morpheus and start interpreting your dreams!`
  },
  de: {
    welcome: (name) => `👋 Hallo, ${name}!

🌙 *Morpheus* — dein persönlicher KI-gestützter Traumdeuter.

✨ *Was die App kann:*
• 🎙️ Träume per Sprache oder Text aufzeichnen
• 🔮 Symbole mit KI interpretieren
• 📚 Traumbedeutungen analysieren
• 💜 Personalisierte Einblicke erhalten
• 📖 Traumgeschichte speichern`,
    instruction: `🚀 *Wie öffne ich die App?*

Tippe auf die *Open*-Schaltfläche im Nachrichteneingabefeld, um Morpheus zu starten und deine Träume zu deuten!`
  },
  es: {
    welcome: (name) => `👋 ¡Hola, ${name}!

🌙 *Morpheus* — tu intérprete de sueños personal impulsado por IA.

✨ *Lo que puede hacer la aplicación:*
• 🎙️ Grabar sueños por voz o texto
• 🔮 Interpretar símbolos usando IA
• 📚 Analizar significados de sueños
• 💜 Proporcionar perspectivas personalizadas
• 📖 Guardar tu historial de sueños`,
    instruction: `🚀 *¿Cómo abrir la aplicación?*

¡Toca el botón *Open* en el campo de entrada de mensajes para iniciar Morpheus y comenzar a interpretar tus sueños!`
  },
  fr: {
    welcome: (name) => `👋 Salut, ${name}!

🌙 *Morpheus* — votre interprète de rêves personnel alimenté par l'IA.

✨ *Ce que l'application peut faire:*
• 🎙️ Enregistrer les rêves par voix ou texte
• 🔮 Interpréter les symboles avec l'IA
• 📚 Analyser les significations des rêves
• 💜 Fournir des perspectives personnalisées
• 📖 Sauvegarder votre historique de rêves`,
    instruction: `🚀 *Comment ouvrir l'application?*

Appuyez sur le bouton *Open* dans le champ de saisie de message pour lancer Morpheus et commencer à interpréter vos rêves!`
  }
};

// Команда /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from.first_name || 'User';
  const languageCode = msg.from.language_code || 'en';
  
  // Определяем язык пользователя (поддерживаем ru, en, de, es, fr)
  const supportedLanguages = ['ru', 'en', 'de', 'es', 'fr'];
  const userLanguage = supportedLanguages.includes(languageCode) ? languageCode : 'en';
  
  const userMessages = messages[userLanguage];
  
  // Первое сообщение - приветствие и описание
  const welcomeMessage = userMessages.welcome(firstName);

  // Отправляем приветствие
  await bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown'
  });

  // Второе сообщение - инструкция с картинкой
  const instructionMessage = userMessages.instruction;

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

