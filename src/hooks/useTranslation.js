import { useState, useCallback } from 'react';

export const useTranslation = () => {
  const [translationCache, setTranslationCache] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState(null);

  const getApiKey = () => {
    return localStorage.getItem('openai_api_key');
  };

  const translateWithOpenAI = async (text, targetLang = 'ko') => {
    const apiKey = getApiKey();

    if (!apiKey) {
      throw new Error('NO_API_KEY');
    }

    const targetLanguage = targetLang === 'ko' ? 'Korean' : 'English';

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
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
      return data.choices[0].message.content.trim();
    } catch (err) {
      throw err;
    }
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
        if (openAIError.message === 'NO_API_KEY') {
          console.log('OpenAI API 키 없음, MyMemory 사용');
        } else {
          console.warn('OpenAI 번역 실패, MyMemory로 전환:', openAIError.message);
        }
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

  return {
    translate,
    isTranslating,
    error,
    clearCache,
  };
};
