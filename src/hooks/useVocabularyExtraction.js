import { useState, useCallback } from 'react';
import { API_BASE } from '../api/index.js';

/**
 * 챕터의 중요 단어/숙어를 추출하고 DB에 캐싱
 * - 첫 호출: GPT-4o-mini로 추출 → DB 저장
 * - 이후 호출: DB에서 조회 (GPT 호출 없음)
 */
export const useVocabularyExtraction = () => {
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * DB에서 챕터의 저장된 단어 조회
   */
  const fetchFromDB = async (chapterId) => {
    try {
      const response = await fetch(`${API_BASE}/vocabulary/chapter/${chapterId}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          return data.map(item => ({
            word: item.word,
            definition: item.definition,
            example: item.example,
            is_idiom: item.is_idiom || false,
            phonetic: item.phonetic || null
          }));
        }
      }
      return null;
    } catch (err) {
      console.warn('DB 조회 실패:', err);
      return null;
    }
  };

  /**
   * GPT 추출 결과를 DB에 저장
   */
  const saveToDB = async (chapterId, vocabulary) => {
    try {
      await fetch(`${API_BASE}/vocabulary/chapter/${chapterId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chapter_id: chapterId,
          items: vocabulary
        })
      });
    } catch (err) {
      console.warn('DB 저장 실패:', err);
    }
  };

  /**
   * GPT로 중요 단어/숙어 추출
   */
  const extractWithGPT = async (chapterText, difficulty) => {
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

For each item, indicate:
- "is_idiom": true if it's an idiom/phrase (multiple words), false if it's a single word
- "phonetic": IPA pronunciation notation ONLY for single words (not idioms). e.g. "/kʌrɪdʒ/"

Return ONLY a valid JSON array in this exact format:
[
  {
    "word": "the word or phrase",
    "definition": "한글 뜻",
    "example": "example sentence from the text (if available)",
    "is_idiom": false,
    "phonetic": "/fəˈnetɪk/"
  }
]

Important: Return ONLY the JSON array, no other text. For idioms, set phonetic to null.
`;

    const response = await fetch(`${API_BASE}/openai/chat`, {
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
    let content = data.content.trim();

    // ```json ... ``` 형식 제거
    if (content.startsWith('```')) {
      content = content.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
    }

    const vocabulary = JSON.parse(content);

    if (!Array.isArray(vocabulary)) {
      throw new Error('잘못된 응답 형식');
    }

    return vocabulary;
  };

  /**
   * 챕터 텍스트에서 중요 단어/숙어 추출
   * @param {string} chapterText - 챕터 전체 텍스트
   * @param {string} difficulty - 책 난이도 (easy/medium/advanced)
   * @param {number} chapterId - 챕터 ID
   */
  const extractVocabulary = useCallback(async (chapterText, difficulty, chapterId) => {
    setIsExtracting(true);
    setError(null);

    try {
      // 1. DB에서 먼저 조회
      const dbData = await fetchFromDB(chapterId);
      if (dbData) {
        setIsExtracting(false);
        return dbData;
      }

      // 2. DB에 없으면 GPT로 추출
      const vocabulary = await extractWithGPT(chapterText, difficulty);

      // 3. 추출 결과를 DB에 저장
      await saveToDB(chapterId, vocabulary);

      setIsExtracting(false);
      return vocabulary;
    } catch (err) {
      console.error('Vocabulary extraction error:', err);
      setError(err.message);
      setIsExtracting(false);
      return null;
    }
  }, []);

  /**
   * DB 캐시 삭제 (재추출용)
   */
  const clearCache = useCallback(async (chapterId) => {
    if (chapterId) {
      try {
        await fetch(`${API_BASE}/vocabulary/chapter/${chapterId}`, {
          method: 'DELETE'
        });
      } catch (err) {
        console.warn('캐시 삭제 실패:', err);
      }
    }
  }, []);

  return {
    extractVocabulary,
    clearCache,
    isExtracting,
    error
  };
};
