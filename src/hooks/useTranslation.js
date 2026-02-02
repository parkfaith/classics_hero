import { useState, useCallback } from 'react';
import { API_BASE } from '../api/index.js';

export const useTranslation = () => {
  const [translationCache, setTranslationCache] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState(null);

  // DB에서 챕터 번역 캐시 조회
  const fetchCachedTranslation = async (chapterId) => {
    try {
      const response = await fetch(`${API_BASE}/translations/chapter/${chapterId}`);
      if (response.ok) {
        const data = await response.json();
        return data?.translation || null;
      }
      return null;
    } catch (err) {
      console.warn('캐시 조회 실패:', err);
      return null;
    }
  };

  // DB에 챕터 번역 캐시 저장
  const saveCachedTranslation = async (chapterId, translation) => {
    try {
      await fetch(`${API_BASE}/translations/chapter/${chapterId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ translation })
      });
    } catch (err) {
      console.warn('캐시 저장 실패:', err);
    }
  };

  const translateWithOpenAI = async (text, targetLang = 'ko') => {
    const targetLanguage = targetLang === 'ko' ? 'Korean' : 'English';

    const response = await fetch(`${API_BASE}/openai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are a professional translator. Translate the given English text to ${targetLanguage}. Only provide the translation, no explanations.`
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 오류: ${response.status}`);
    }

    const data = await response.json();
    return data.content.trim();
  };

  const translateWithMyMemory = async (text, targetLang = 'ko') => {
    // MyMemory는 500자 제한이 있으므로 긴 텍스트는 분할
    const maxLength = 450;

    if (text.length > maxLength) {
      // 문장을 나누어 번역
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      const translations = [];

      for (const sentence of sentences) {
        if (sentence.trim().length === 0) continue;

        const encodedText = encodeURIComponent(sentence.trim());
        const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${targetLang}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.responseData && data.responseData.translatedText) {
          translations.push(data.responseData.translatedText);
        } else {
          translations.push(sentence);
        }

        // API 속도 제한 방지를 위한 짧은 딜레이
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return translations.join(' ');
    } else {
      const encodedText = encodeURIComponent(text);
      const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=en|${targetLang}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText;
      } else {
        throw new Error('MyMemory 번역 실패');
      }
    }
  };

  const translate = useCallback(async (text, targetLang = 'ko') => {
    // 캐시 확인
    const cacheKey = `${text}_${targetLang}`;
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    setIsTranslating(true);
    setError(null);

    try {
      let translatedText;

      // OpenAI API 우선 시도
      try {
        translatedText = await translateWithOpenAI(text, targetLang);
      } catch (openAIError) {
        // OpenAI 실패 시 MyMemory로 폴백
        console.warn('OpenAI 번역 실패, MyMemory로 전환:', openAIError.message);
        translatedText = await translateWithMyMemory(text, targetLang);
      }

      // 캐시에 저장
      setTranslationCache(prev => ({
        ...prev,
        [cacheKey]: translatedText
      }));

      setIsTranslating(false);
      return translatedText;
    } catch (err) {
      console.error('Translation error:', err);
      setError(err.message);
      setIsTranslating(false);
      return null;
    }
  }, [translationCache]);

  const clearCache = useCallback(() => {
    setTranslationCache({});
  }, []);

  // 챕터 번역 (DB 캐시 우선 사용)
  const translateChapter = useCallback(async (chapterId, content, targetLang = 'ko') => {
    // 1. 메모리 캐시 확인
    const cacheKey = `chapter_${chapterId}_${targetLang}`;
    if (translationCache[cacheKey]) {
      return translationCache[cacheKey];
    }

    setIsTranslating(true);
    setError(null);

    try {
      // 2. DB 캐시 확인
      const cachedTranslation = await fetchCachedTranslation(chapterId);
      if (cachedTranslation) {
        // 메모리 캐시에도 저장
        setTranslationCache(prev => ({ ...prev, [cacheKey]: cachedTranslation }));
        setIsTranslating(false);
        return cachedTranslation;
      }

      // 3. LLM으로 번역
      let translatedText;
      try {
        translatedText = await translateWithOpenAI(content, targetLang);
      } catch (openAIError) {
        console.warn('OpenAI 번역 실패, MyMemory로 전환:', openAIError.message);
        translatedText = await translateWithMyMemory(content, targetLang);
      }

      // 4. DB에 캐시 저장
      await saveCachedTranslation(chapterId, translatedText);

      // 5. 메모리 캐시에도 저장
      setTranslationCache(prev => ({ ...prev, [cacheKey]: translatedText }));

      setIsTranslating(false);
      return translatedText;
    } catch (err) {
      console.error('Chapter translation error:', err);
      setError(err.message);
      setIsTranslating(false);
      return null;
    }
  }, [translationCache]);

  return {
    translate,
    translateChapter,
    isTranslating,
    error,
    clearCache,
  };
};
