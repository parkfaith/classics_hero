import { useState, useEffect, useRef } from 'react';

export const useTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const utteranceRef = useRef(null);

  useEffect(() => {
    // 사용 가능한 음성 목록 로드
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      // 영어 음성만 필터링
      const englishVoices = availableVoices.filter(voice =>
        voice.lang.startsWith('en')
      );
      setVoices(englishVoices);

      // 기본 음성 설정 (US English 선호)
      const defaultVoice = englishVoices.find(voice =>
        voice.lang === 'en-US'
      ) || englishVoices[0];
      setSelectedVoice(defaultVoice);
    };

    loadVoices();

    // 일부 브라우저에서는 비동기로 로드됨
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = (text, options = {}) => {
    // 이전 음성 중지
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // 음성 설정
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    utterance.rate = options.rate || 0.9; // 속도 (0.1 ~ 10)
    utterance.pitch = options.pitch || 1; // 음높이 (0 ~ 2)
    utterance.volume = options.volume || 1; // 볼륨 (0 ~ 1)

    // 이벤트 핸들러
    utterance.onstart = () => {
      setIsPlaying(true);
      setIsPaused(false);
      if (options.onStart) options.onStart();
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setIsPaused(false);
      if (options.onEnd) options.onEnd();
    };

    utterance.onerror = (event) => {
      console.error('TTS Error:', event);
      setIsPlaying(false);
      setIsPaused(false);
      if (options.onError) options.onError(event);
    };

    utterance.onpause = () => {
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsPaused(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const pause = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
    }
  };

  const resume = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
  };

  return {
    speak,
    pause,
    resume,
    stop,
    isPlaying,
    isPaused,
    voices,
    selectedVoice,
    setSelectedVoice,
  };
};
