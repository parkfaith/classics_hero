import { useState, useCallback } from 'react';

/**
 * Pronunciation analysis hook using OpenAI API
 * Analyzes user's spoken text against the original sentence
 */
export const usePronunciationAnalysis = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState(null);

  /**
   * Simple word-level comparison to identify differences
   */
  const compareTexts = (original, spoken) => {
    const originalWords = original.toLowerCase().replace(/[.,!?;:]/g, '').split(/\s+/);
    const spokenWords = spoken.toLowerCase().replace(/[.,!?;:]/g, '').split(/\s+/);

    const wordAnalysis = [];
    const maxLength = Math.max(originalWords.length, spokenWords.length);

    for (let i = 0; i < maxLength; i++) {
      const originalWord = originalWords[i] || '';
      const spokenWord = spokenWords[i] || '';

      if (originalWord === spokenWord) {
        wordAnalysis.push({
          word: originalWord,
          status: 'correct',
          index: i
        });
      } else if (!spokenWord) {
        wordAnalysis.push({
          word: originalWord,
          status: 'missing',
          index: i
        });
      } else if (!originalWord) {
        wordAnalysis.push({
          word: spokenWord,
          status: 'extra',
          index: i
        });
      } else {
        wordAnalysis.push({
          word: originalWord,
          spokenWord: spokenWord,
          status: 'incorrect',
          index: i
        });
      }
    }

    // Calculate accuracy
    const correctWords = wordAnalysis.filter(w => w.status === 'correct').length;
    const accuracy = originalWords.length > 0
      ? Math.round((correctWords / originalWords.length) * 100)
      : 0;

    return { wordAnalysis, accuracy };
  };

  /**
   * Generate local feedback without AI (fallback)
   */
  const generateLocalFeedback = (wordAnalysis, accuracy) => {
    const incorrectWords = wordAnalysis.filter(w => w.status === 'incorrect');
    const missingWords = wordAnalysis.filter(w => w.status === 'missing');

    let feedback = '';

    if (accuracy >= 90) {
      feedback = '훌륭해요! 발음이 매우 정확합니다. 계속 이 조자를 유지해 주세요!';
    } else if (accuracy >= 70) {
      feedback = '잘했어요! ';
      if (incorrectWords.length > 0) {
        feedback += `"${incorrectWords.slice(0, 2).map(w => w.word).join('", "')}" 부분을 조금 더 연습해 보세요. `;
      }
      feedback += '꾸준히 연습하면 더 좋아질 거예요!';
    } else if (accuracy >= 50) {
      feedback = '좋은 시도예요! ';
      if (missingWords.length > 0) {
        feedback += `빠진 단어가 있어요. `;
      }
      if (incorrectWords.length > 0) {
        feedback += `"${incorrectWords.slice(0, 2).map(w => w.word).join('", "')}" 발음에 주의해 보세요. `;
      }
      feedback += '천천히 따라 읽어보세요!';
    } else {
      feedback = '괜찮아요! 먼저 원문을 천천히 들어보고, 한 단어씩 따라해 보세요. 연습하면 반드시 나아져요!';
    }

    return feedback;
  };

  /**
   * Get AI-powered pronunciation feedback
   */
  const getAIFeedback = useCallback(async (originalSentence, spokenText, wordAnalysis, accuracy) => {
    const incorrectWords = wordAnalysis
      .filter(w => w.status === 'incorrect')
      .map(w => `"${w.word}" → "${w.spokenWord}"`)
      .join(', ');

    const missingWords = wordAnalysis
      .filter(w => w.status === 'missing')
      .map(w => w.word)
      .join(', ');

    const extraWords = wordAnalysis
      .filter(w => w.status === 'extra')
      .map(w => w.word)
      .join(', ');

    const prompt = `
You are an English pronunciation coach. Analyze the following pronunciation attempt and provide helpful feedback in Korean.

Original sentence: "${originalSentence}"
What the student said: "${spokenText}"
Accuracy: ${accuracy}%

${incorrectWords ? `Incorrect words: ${incorrectWords}` : ''}
${missingWords ? `Missing words: ${missingWords}` : ''}
${extraWords ? `Extra words: ${extraWords}` : ''}

Please provide:
1. A brief assessment of the pronunciation (1-2 sentences in Korean)
2. Specific tips to improve (if accuracy < 90%)
3. Encouragement

Keep your response concise and constructive. Format in Korean.
`;

    try {
      const response = await fetch('/api/openai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'You are a helpful English pronunciation coach who provides feedback in Korean.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 300
        })
      });

      if (!response.ok) {
        // API 실패 시 로컬 피드백 사용
        console.warn('AI API 실패, 로컬 피드백 사용');
        return generateLocalFeedback(wordAnalysis, accuracy);
      }

      const data = await response.json();
      return data.content;
    } catch (err) {
      // 네트워크 오류 등의 경우 로컬 피드백 사용
      console.warn('AI API 오류, 로컬 피드백 사용:', err);
      return generateLocalFeedback(wordAnalysis, accuracy);
    }
  }, []);

  /**
   * Analyze pronunciation
   */
  const analyzePronunciation = useCallback(async (originalSentence, spokenText) => {
    if (!originalSentence || !spokenText) {
      setError('분석할 텍스트가 없습니다.');
      return null;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      // Step 1: Simple word comparison
      const { wordAnalysis, accuracy } = compareTexts(originalSentence, spokenText);

      // Step 2: Get AI feedback
      const aiFeedback = await getAIFeedback(originalSentence, spokenText, wordAnalysis, accuracy);

      const result = {
        originalSentence,
        spokenText,
        wordAnalysis,
        accuracy,
        feedback: aiFeedback,
        timestamp: Date.now()
      };

      setAnalysis(result);
      setIsAnalyzing(false);
      return result;
    } catch (err) {
      console.error('Pronunciation analysis error:', err);
      setError(err.message);
      setIsAnalyzing(false);
      return null;
    }
  }, [getAIFeedback]);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return {
    analyzePronunciation,
    clearAnalysis,
    isAnalyzing,
    analysis,
    error
  };
};
