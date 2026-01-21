import { useState, useEffect, useCallback } from 'react';

// 학습 진행 상황을 관리하는 훅
export const useLearningProgress = () => {
  const [allProgress, setAllProgress] = useState({});

  // 초기 로드
  useEffect(() => {
    const saved = localStorage.getItem('learning-progress');
    if (saved) {
      setAllProgress(JSON.parse(saved));
    }
  }, []);

  // localStorage에 저장
  const saveProgress = useCallback((newProgress) => {
    setAllProgress(newProgress);
    localStorage.setItem('learning-progress', JSON.stringify(newProgress));
  }, []);

  // 책의 학습 진행 상황 가져오기
  const getBookProgress = useCallback((bookId) => {
    return allProgress[bookId] || {
      chapters: {},
      lastAccessedAt: null,
      lastChapterIndex: 0,
      readingCompleted: false,
      speakingCompleted: false,
    };
  }, [allProgress]);

  // 챕터 학습 완료 표시
  const markChapterCompleted = useCallback((bookId, chapterId, mode) => {
    const bookProgress = getBookProgress(bookId);
    const chapterProgress = bookProgress.chapters[chapterId] || {
      readingCompleted: false,
      speakingCompleted: false,
      readingCompletedAt: null,
      speakingCompletedAt: null,
    };

    const now = new Date().toISOString();

    if (mode === 'reading') {
      chapterProgress.readingCompleted = true;
      chapterProgress.readingCompletedAt = now;
    } else if (mode === 'speaking') {
      chapterProgress.speakingCompleted = true;
      chapterProgress.speakingCompletedAt = now;
    }

    const newProgress = {
      ...allProgress,
      [bookId]: {
        ...bookProgress,
        chapters: {
          ...bookProgress.chapters,
          [chapterId]: chapterProgress,
        },
        lastAccessedAt: now,
      },
    };

    saveProgress(newProgress);
  }, [allProgress, getBookProgress, saveProgress]);

  // 챕터 학습 상태 확인
  const isChapterCompleted = useCallback((bookId, chapterId, mode) => {
    const bookProgress = getBookProgress(bookId);
    const chapterProgress = bookProgress.chapters[chapterId];

    if (!chapterProgress) return false;

    if (mode === 'reading') return chapterProgress.readingCompleted;
    if (mode === 'speaking') return chapterProgress.speakingCompleted;
    return chapterProgress.readingCompleted && chapterProgress.speakingCompleted;
  }, [getBookProgress]);

  // 책 전체 학습 통계
  const getBookStats = useCallback((bookId, totalChapters) => {
    const bookProgress = getBookProgress(bookId);
    const chapters = Object.values(bookProgress.chapters);

    const readingCompleted = chapters.filter(ch => ch.readingCompleted).length;
    const speakingCompleted = chapters.filter(ch => ch.speakingCompleted).length;
    const fullyCompleted = chapters.filter(ch => ch.readingCompleted && ch.speakingCompleted).length;

    return {
      readingCompleted,
      speakingCompleted,
      fullyCompleted,
      totalChapters,
      readingPercentage: totalChapters > 0 ? Math.round((readingCompleted / totalChapters) * 100) : 0,
      speakingPercentage: totalChapters > 0 ? Math.round((speakingCompleted / totalChapters) * 100) : 0,
      overallPercentage: totalChapters > 0 ? Math.round((fullyCompleted / totalChapters) * 100) : 0,
      lastAccessedAt: bookProgress.lastAccessedAt,
    };
  }, [getBookProgress]);

  // 모든 책의 학습 통계
  const getAllBooksStats = useCallback(() => {
    return Object.keys(allProgress).reduce((acc, bookId) => {
      acc[bookId] = allProgress[bookId];
      return acc;
    }, {});
  }, [allProgress]);

  // 학습 기록 초기화
  const resetBookProgress = useCallback((bookId) => {
    const newProgress = { ...allProgress };
    delete newProgress[bookId];
    saveProgress(newProgress);
  }, [allProgress, saveProgress]);

  // 전체 학습 기록 초기화
  const resetAllProgress = useCallback(() => {
    saveProgress({});
  }, [saveProgress]);

  return {
    getBookProgress,
    getBookStats,
    getAllBooksStats,
    markChapterCompleted,
    isChapterCompleted,
    resetBookProgress,
    resetAllProgress,
  };
};

export default useLearningProgress;
