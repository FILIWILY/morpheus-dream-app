import FormData from 'form-data';
import fetch from 'node-fetch';

const WHISPER_URL = process.env.WHISPER_URL || 'http://localhost:8000';

/**
 * Транскрибирует аудио с помощью Whisper
 * @param {Buffer} audioBuffer - Бинарные данные аудио файла
 * @param {string} language - Код языка (ru, en, es, de, fr)
 * @returns {Promise<string>} - Распознанный текст
 */
export async function transcribeAudio(audioBuffer, language = 'ru') {
  try {
    console.log(`[Whisper] Starting transcription. Language: ${language}, buffer size: ${audioBuffer.length} bytes`);
    console.log(`[Whisper] Target URL: ${WHISPER_URL}/v1/audio/transcriptions`);
    
    const formData = new FormData();
    formData.append('file', audioBuffer, {
      filename: 'audio.webm',
      contentType: 'audio/webm'
    });
    
    // Whisper принимает параметры в соответствии с OpenAI API
    formData.append('language', language);
    formData.append('response_format', 'json'); // или 'text', 'verbose_json'
    
    console.log(`[Whisper] Sending request... (this may take 3-6 min on first run while model downloads)`);
    
    // Длинный timeout для первой загрузки модели (6 минут для small)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6 * 60 * 1000); // 6 minutes
    
    const response = await fetch(`${WHISPER_URL}/v1/audio/transcriptions`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Whisper] HTTP Error: ${response.status} - ${errorText}`);
      throw new Error(`Whisper API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log(`[Whisper] ✅ Transcription successful. Text: "${result.text?.substring(0, 100)}..."`);
    console.log(`[Whisper] ✅ Text length: ${result.text?.length || 0} chars`);
    
    return result.text;
  } catch (error) {
    console.error('[Whisper] Transcription failed:', error);
    if (error.name === 'AbortError') {
      throw new Error('Whisper transcription timeout (6 minutes). Model might be loading for the first time.');
    }
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
}

/**
 * Проверяет здоровье Whisper сервиса
 * @returns {Promise<boolean>}
 */
export async function checkWhisperHealth() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${WHISPER_URL}/health`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    return response.ok;
  } catch (error) {
    console.error('[Whisper] Health check failed:', error);
    return false;
  }
}

