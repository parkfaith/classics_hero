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
   * Get AI-powered pronunciation feedback
   */
  const getAIFeedback = async (originalSentence, spokenText, wordAnalysis, accuracy) => {
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
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data = await response.json();
    return data.content;
  };

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
  }, []);

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
