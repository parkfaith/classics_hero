import { useState, useEffect, useRef } from 'react';

// 자연스러운 음성 우선순위 (높을수록 우선)
const VOICE_PRIORITY = [
  // Google Neural / Natural 음성 (Chrome에서 가장 자연스러움)
  { pattern: /Google US English/i, score: 100 },
  { pattern: /Google UK English Male/i, score: 95 },
  { pattern: /Google UK English Female/i, score: 90 },
  // Microsoft Online (Neural) 음성 (Edge/Windows)
  { pattern: /Microsoft.*Online.*Natural/i, score: 98 },
  { pattern: /Microsoft (Guy|Ryan|Christopher|Eric|Andrew)/i, score: 92 },
  { pattern: /Microsoft (Jenny|Aria|Sara|Michelle)/i, score: 88 },
  // Apple 고품질 음성 (Safari/macOS/iOS)
  { pattern: /Samantha/i, score: 85 },
  { pattern: /Daniel/i, score: 87 },
  { pattern: /Alex$/i, score: 83 },
  // 일반 en-US 음성 (fallback)
  { pattern: /en-US/i, score: 50 },
  // 기타 영어 음성
  { pattern: /en-/i, score: 30 },
];

const getVoiceScore = (voice) => {
  const nameAndLang = `${voice.name} ${voice.lang}`;
  for (const { pattern, score } of VOICE_PRIORITY) {
    if (pattern.test(nameAndLang)) return score;
  }
  return 0;
};

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

      // 자연스러운 음성 우선순위로 정렬 후 최고 점수 선택
      if (englishVoices.length > 0) {
        const scored = englishVoices
          .map(voice => ({ voice, score: getVoiceScore(voice) }))
          .sort((a, b) => b.score - a.score);
        setSelectedVoice(scored[0].voice);
      }
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
