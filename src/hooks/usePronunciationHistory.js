import { useState, useCallback, useEffect } from 'react';

/**
 * 발음 연습 기록을 관리하는 훅
 * localStorage에 챕터별 연습 기록을 저장하고 통계를 계산
 */
const usePronunciationHistory = (bookId, chapterId) => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const storageKey = `pronunciation-history-${bookId}-${chapterId}`;

  // 저장된 기록 불러오기
  useEffect(() => {
    setIsLoading(true);
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        setHistory(JSON.parse(saved));
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error('발음 기록 로드 실패:', error);
      setHistory([]);
    }
    setIsLoading(false);
  }, [storageKey]);

  // 기록 저장
  const saveToStorage = useCallback((records) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(records));
    } catch (error) {
      console.error('발음 기록 저장 실패:', error);
    }
  }, [storageKey]);

  // 새 연습 결과 추가
  const addRecord = useCallback((record) => {
    const newRecord = {
      ...record,
      id: Date.now(),
      timestamp: new Date().toISOString()
    };

    setHistory(prev => {
      // 같은 문장의 이전 기록이 있으면 업데이트, 없으면 추가
      const existingIndex = prev.findIndex(r => r.sentenceIndex === record.sentenceIndex);
      let updated;

      if (existingIndex >= 0) {
        const existing = prev[existingIndex];

        // attemptHistory 배열이 없으면 생성 (기존 데이터 마이그레이션)
        const attemptHistory = existing.attemptHistory || [
          {
            accuracy: existing.accuracy,
            timestamp: existing.timestamp,
            spokenText: existing.spokenText,
            feedback: existing.feedback
          }
        ];

        // 새 시도 추가
        attemptHistory.push({
          accuracy: record.accuracy,
          timestamp: newRecord.timestamp,
          spokenText: record.spokenText,
          feedback: record.feedback,
          wordAnalysis: record.wordAnalysis
        });

        updated = [...prev];
        updated[existingIndex] = {
          ...newRecord,
          attemptHistory,
          accuracy: Math.max(...attemptHistory.map(a => a.accuracy)), // 최고 점수
          attempts: attemptHistory.length
        };
      } else {
        // 첫 시도
        updated = [...prev, {
          ...newRecord,
          attemptHistory: [{
            accuracy: record.accuracy,
            timestamp: newRecord.timestamp,
            spokenText: record.spokenText,
            feedback: record.feedback,
            wordAnalysis: record.wordAnalysis
          }],
          attempts: 1
        }];
      }

      saveToStorage(updated);
      return updated;
    });

    return newRecord;
  }, [saveToStorage]);

  // 특정 문장의 기록 가져오기
  const getRecordBySentence = useCallback((sentenceIndex) => {
    return history.find(r => r.sentenceIndex === sentenceIndex);
  }, [history]);

  // 연습 완료된 문장 인덱스 목록
  const getCompletedSentences = useCallback(() => {
    return history.map(r => r.sentenceIndex);
  }, [history]);

  // 통계 계산
  const getStatistics = useCallback((totalSentences) => {
    if (history.length === 0) {
      return {
        completedCount: 0,
        totalSentences,
        completionRate: 0,
        averageAccuracy: 0,
        bestScore: 0,
        worstScore: 0,
        totalAttempts: 0,
        incorrectWords: [],
        missingWords: [],
        records: []
      };
    }

    const scores = history.map(r => r.accuracy);
    const totalAttempts = history.reduce((sum, r) => sum + (r.attempts || 1), 0);

    // 틀린 단어들 수집
    const incorrectWords = [];
    const missingWords = [];

    history.forEach(record => {
      if (record.wordAnalysis) {
        record.wordAnalysis.forEach(word => {
          if (word.status === 'incorrect') {
            incorrectWords.push({
              word: word.word,
              spokenAs: word.spokenWord,
              sentence: record.originalSentence
            });
          } else if (word.status === 'missing') {
            missingWords.push({
              word: word.word,
              sentence: record.originalSentence
            });
          }
        });
      }
    });

    return {
      completedCount: history.length,
      totalSentences,
      completionRate: Math.round((history.length / totalSentences) * 100),
      averageAccuracy: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      bestScore: Math.max(...scores),
      worstScore: Math.min(...scores),
      totalAttempts,
      incorrectWords,
      missingWords,
      records: history.sort((a, b) => a.sentenceIndex - b.sentenceIndex)
    };
  }, [history]);

  // 기록 초기화
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  // 특정 문장 기록 삭제
  const removeRecord = useCallback((sentenceIndex) => {
    setHistory(prev => {
      const updated = prev.filter(r => r.sentenceIndex !== sentenceIndex);
      saveToStorage(updated);
      return updated;
    });
  }, [saveToStorage]);

  // 개선율 계산
  const getImprovementRate = useCallback((sentenceIndex) => {
    const record = history.find(r => r.sentenceIndex === sentenceIndex);

    if (!record || !record.attemptHistory || record.attemptHistory.length < 2) {
      return null;
    }

    const firstScore = record.attemptHistory[0].accuracy;
    const latestScore = record.attemptHistory[record.attemptHistory.length - 1].accuracy;
    const previousScore = record.attemptHistory[record.attemptHistory.length - 2].accuracy;

    return {
      overall: latestScore - firstScore,        // 전체 개선율
      recent: latestScore - previousScore,      // 직전 대비
      firstScore,
      latestScore,
      previousScore,
      isImproved: latestScore > previousScore,
      isFirstAttempt: record.attemptHistory.length === 1
    };
  }, [history]);

  return {
    history,
    isLoading,
    addRecord,
    getRecordBySentence,
    getCompletedSentences,
    getStatistics,
    clearHistory,
    removeRecord,
    getImprovementRate
  };
};

export default usePronunciationHistory;
