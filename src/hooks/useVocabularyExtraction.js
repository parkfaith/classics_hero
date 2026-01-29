import { useState, useCallback } from 'react';

/**
 * GPT-4o-mini를 사용하여 챕터의 중요 단어/숙어를 자동 추출하고 정의를 생성
 */
export const useVocabularyExtraction = () => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * 챕터 텍스트에서 중요 단어/숙어 추출
   * @param {string} chapterText - 챕터 전체 텍스트
   * @param {string} difficulty - 책 난이도 (easy/medium/advanced)
   * @param {number} chapterId - 챕터 ID (캐시 키로 사용)
   */
  const extractVocabulary = useCallback(async (chapterText, difficulty, chapterId) => {
    // 캐시 확인
    const cacheKey = `vocabulary-${chapterId}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.warn('캐시 파싱 실패:', e);
      }
    }

    setIsExtracting(true);
    setError(null);

    try {
      // 난이도별 단어 수 조정
      const wordCount = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 7 : 10;

      const prompt = `
You are an English vocabulary teacher. Analyze the following text and extract ${wordCount} important words or idioms that English learners should know.

Text:
"""
${chapterText.substring(0, 1000)}
"""

Please extract:
- Important vocabulary words
- Useful idioms or phrases
- Words that are essential for understanding the text

Return ONLY a valid JSON array in this exact format:
[
  {
    "word": "the word or phrase",
    "definition": "한글 뜻",
    "example": "example sentence from the text (if available)"
  }
]

Important: Return ONLY the JSON array, no other text.
`;

      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful vocabulary extraction assistant. Always respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 800
        })
      });

      if (!response.ok) {
        throw new Error('단어 추출 실패');
      }

      const data = await response.json();
      let vocabulary;

      try {
        // GPT 응답에서 JSON 추출 (마크다운 코드 블록 제거)
        let content = data.content.trim();

        // ```json ... ``` 형식 제거
        if (content.startsWith('```')) {
          content = content.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
        }

        vocabulary = JSON.parse(content);

        if (!Array.isArray(vocabulary)) {
          throw new Error('잘못된 응답 형식');
        }

        // 캐시에 저장
        localStorage.setItem(cacheKey, JSON.stringify(vocabulary));

        setIsExtracting(false);
        return vocabulary;
      } catch (parseError) {
        console.error('JSON 파싱 실패:', data.content);
        throw new Error('단어 데이터 파싱 실패');
      }
    } catch (err) {
      console.error('Vocabulary extraction error:', err);
      setError(err.message);
      setIsExtracting(false);
      return null;
    }
  }, []);

  /**
   * 캐시 삭제
   */
  const clearCache = useCallback((chapterId) => {
    if (chapterId) {
      localStorage.removeItem(`vocabulary-${chapterId}`);
    }
  }, []);

  return {
    extractVocabulary,
    clearCache,
    isExtracting,
    error
  };
};
