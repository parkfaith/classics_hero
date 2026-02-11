import { useState, useEffect, useRef } from "react";

// 남성 음성 우선순위 (높을수록 우선)
// 주의: "Google US English"는 이름에 성별 표기가 없지만 실제로는 여성 음성
const MALE_VOICE_PRIORITY = [
  // Google 남성 음성
  { pattern: /Google UK English Male/i, score: 100 },
  // Microsoft 남성 음성 (Neural)
  { pattern: /Microsoft.*Guy.*Online.*Natural/i, score: 97 },
  { pattern: /Microsoft.*Ryan.*Online.*Natural/i, score: 96 },
  { pattern: /Microsoft (Guy|Ryan|Christopher|Eric|Andrew)/i, score: 92 },
  // Apple 남성 음성
  { pattern: /Daniel/i, score: 87 },
  { pattern: /Alex$/i, score: 83 },
  // 일반 en-US (fallback)
  { pattern: /en-US/i, score: 50 },
  { pattern: /en-/i, score: 30 },
];

// 여성 음성 우선순위
const FEMALE_VOICE_PRIORITY = [
  // Google 여성 음성
  { pattern: /Google UK English Female/i, score: 100 },
  { pattern: /Google US English/i, score: 99 },
  // Microsoft 여성 음성 (Neural)
  { pattern: /Microsoft.*Jenny.*Online.*Natural/i, score: 98 },
  { pattern: /Microsoft.*Aria.*Online.*Natural/i, score: 97 },
  { pattern: /Microsoft (Jenny|Aria|Sara|Michelle)/i, score: 92 },
  // Apple 여성 음성
  { pattern: /Samantha/i, score: 87 },
  // 일반 en-US (fallback)
  { pattern: /en-US/i, score: 50 },
  { pattern: /en-/i, score: 30 },
];

// 성별 미지정 시 기본 우선순위 (기존과 동일)
const DEFAULT_VOICE_PRIORITY = [
  { pattern: /Google US English/i, score: 100 },
  { pattern: /Google UK English Male/i, score: 95 },
  { pattern: /Google UK English Female/i, score: 90 },
  { pattern: /Microsoft.*Online.*Natural/i, score: 98 },
  { pattern: /Microsoft (Guy|Ryan|Christopher|Eric|Andrew)/i, score: 92 },
  { pattern: /Microsoft (Jenny|Aria|Sara|Michelle)/i, score: 88 },
  { pattern: /Samantha/i, score: 85 },
  { pattern: /Daniel/i, score: 87 },
  { pattern: /Alex$/i, score: 83 },
  { pattern: /en-US/i, score: 50 },
  { pattern: /en-/i, score: 30 },
];

const getVoiceScore = (voice, priorityList) => {
  const nameAndLang = `${voice.name} ${voice.lang}`;
  for (const { pattern, score } of priorityList) {
    if (pattern.test(nameAndLang)) return score;
  }
  return 0;
};

const selectBestVoice = (voices, gender) => {
  if (voices.length === 0) return null;

  const priorityList =
    gender === "male"
      ? MALE_VOICE_PRIORITY
      : gender === "female"
        ? FEMALE_VOICE_PRIORITY
        : DEFAULT_VOICE_PRIORITY;

  const scored = voices
    .map((voice) => ({ voice, score: getVoiceScore(voice, priorityList) }))
    .sort((a, b) => b.score - a.score);

  return scored[0].voice;
};

export const useTTS = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const utteranceRef = useRef(null);
  const englishVoicesRef = useRef([]);

  useEffect(() => {
    // 사용 가능한 음성 목록 로드
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      // 영어 음성만 필터링
      const englishVoices = availableVoices.filter((voice) =>
        voice.lang.startsWith("en"),
      );
      setVoices(englishVoices);
      englishVoicesRef.current = englishVoices;

      // 기본 음성 선택 (성별 미지정)
      if (englishVoices.length > 0) {
        setSelectedVoice(selectBestVoice(englishVoices, null));
      }
    };

    loadVoices();

    // 일부 브라우저에서는 비동기로 로드됨
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // 모바일 브라우저 음성 로드 대기 (안드로이드 등에서 필요할 수 있음)
    if (window.speechSynthesis.getVoices().length === 0) {
      setTimeout(loadVoices, 100);
      setTimeout(loadVoices, 500);
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = (text, options = {}) => {
    // 이전 음성 중지
    window.speechSynthesis.cancel();

    // 모바일(iOS)에서 중지 후 즉시 재생 시 문제가 발생할 수 있어 resume 호출
    if (window.speechSynthesis.resume) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utteranceRef.current = utterance;

    // 성별에 따른 음성 선택
    const voiceList = englishVoicesRef.current;
    if (options.gender && voiceList.length > 0) {
      const genderVoice = selectBestVoice(voiceList, options.gender);
      utterance.voice = genderVoice;
    } else if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    // 선택된 음성이 없어도 기본 lang 설정
    if (!utterance.voice) {
      utterance.lang = "en-US";
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
      console.error("TTS Error:", event);
      setIsPlaying(false);
      setIsPaused(false);
      // cancel 이벤트는 에러가 아님 (사용자 중지 등)
      if (event.error !== "interrupted" && event.error !== "canceled") {
        if (options.onError) options.onError(event);
      }
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
