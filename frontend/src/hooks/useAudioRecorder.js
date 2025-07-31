import { useState, useRef, useCallback } from 'react';

export const useAudioRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [amplitude, setAmplitude] = useState(0); // Новое состояние для амплитуды

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  // Ref'ы для анализа звука
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const animationFrameRef = useRef(null);

  const
   updateAmplitude = useCallback(() => {
    if (analyserRef.current && dataArrayRef.current) {
      analyserRef.current.getByteFrequencyData(dataArrayRef.current);
      // Простое среднее значение частот для получения одного значения амплитуды
      const average = dataArrayRef.current.reduce((a, b) => a + b, 0) / dataArrayRef.current.length;
      // Нормализуем значение в диапазон 0-1 для шейдера
      setAmplitude(average / 128.0);
      animationFrameRef.current = requestAnimationFrame(updateAmplitude);
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Настройка для записи
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Настройка для анализа звука
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 32; // Меньший размер для производительности
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      sourceRef.current.connect(analyserRef.current);


      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
        
        // Остановка анализа
        cancelAnimationFrame(animationFrameRef.current);
        if(audioContextRef.current?.state !== 'closed') {
          audioContextRef.current?.close();
        }
        setAmplitude(0);
      };

      mediaRecorder.start();
      setIsRecording(true);
      animationFrameRef.current = requestAnimationFrame(updateAmplitude); // Запуск анализа

    } catch (err) {
      console.error("Ошибка доступа к микрофону:", err);
      throw new Error("Не удалось получить доступ к микрофону.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Возвращаем новое значение амплитуды
  return { isRecording, audioBlob, amplitude, startRecording, stopRecording };
};