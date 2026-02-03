import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'user_progress';
const LEGACY_KEY = 'learning-progress';
const VERSION = '1.1.0';

// 초기 상태
const getInitialState = () => ({
  version: VERSION,
  books: {},
  heroes: {}
});

/**
 * 진행도 추적 훅
 * - 책/챕터별 학습 진행 관리
 * - 영웅 대화 추적
 * - 기존 useLearningProgress 확장
 */
export const useProgress = () => {
  const [progress, setProgress] = useState(getInitialState());
  const [isLoaded, setIsLoaded] = useState(false);

  // 초기 로드 및 마이그레이션
  useEffect(() => {
    const loadData = () => {
      // 새 키에서 로드 시도
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setProgress(parsed);
          setIsLoaded(true);
          return;
        } catch (e) {
          console.error('user_progress 파싱 오류:', e);
        }
      }

      // 기존 데이터 마이그레이션
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        try {
          const legacyData = JSON.parse(legacy);
          const migrated = migrateFromLegacy(legacyData);
          setProgress(migrated);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          setIsLoaded(true);
          return;
        } catch (e) {
          console.error('legacy 데이터 마이그레이션 오류:', e);
        }
      }

      // 새로 시작
      setIsLoaded(true);
    };

    loadData();
  }, []);

  // localStorage에 저장
  const saveProgress = useCallback((newProgress) => {
    setProgress(newProgress);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress));
  }, []);

  // 기존 데이터 마이그레이션
  const migrateFromLegacy = (legacyData) => {
    const migrated = getInitialState();

    // 기존 books 데이터 변환
    Object.entries(legacyData).forEach(([bookId, bookData]) => {
      migrated.books[bookId] = {
        chapters: {},
        lastChapterIndex: bookData.lastChapterIndex || 0,
        lastAccessedAt: bookData.lastAccessedAt || null
      };

      // 챕터 데이터 변환
      if (bookData.chapters) {
        Object.entries(bookData.chapters).forEach(([chapterId, chapterData]) => {
          migrated.books[bookId].chapters[chapterId] = {
            readingCompleted: chapterData.readingCompleted || false,
            speakingCompleted: chapterData.speakingCompleted || false,
            readingCompletedAt: chapterData.readingCompletedAt || null,
            speakingCompletedAt: chapterData.speakingCompletedAt || null,
            wordCount: chapterData.wordCount || 0
          };
        });
      }
    });

    return migrated;
  };

  // ==================== 책/챕터 관련 ====================

  // 책의 학습 진행 상황 가져오기
  const getBookProgress = useCallback((bookId) => {
    return progress.books[bookId] || {
      chapters: {},
      lastChapterIndex: 0,
      lastAccessedAt: null
    };
  }, [progress.books]);

  // 챕터 학습 완료 표시
  const markChapterCompleted = useCallback((bookId, chapterId, mode, wordCount = 0) => {
    const bookProgress = getBookProgress(bookId);
    const chapterProgress = bookProgress.chapters[chapterId] || {
      readingCompleted: false,
      speakingCompleted: false,
      readingCompletedAt: null,
      speakingCompletedAt: null,
      wordCount: 0
    };

    const now = new Date().toISOString();

    if (mode === 'reading') {
      chapterProgress.readingCompleted = true;
      chapterProgress.readingCompletedAt = now;
      // 단어 수 업데이트 (첫 완료 시에만)
      if (wordCount > 0 && chapterProgress.wordCount === 0) {
        chapterProgress.wordCount = wordCount;
      }
    } else if (mode === 'speaking') {
      chapterProgress.speakingCompleted = true;
      chapterProgress.speakingCompletedAt = now;
    }

    const newProgress = {
      ...progress,
      books: {
        ...progress.books,
        [bookId]: {
          ...bookProgress,
          chapters: {
            ...bookProgress.chapters,
            [chapterId]: chapterProgress
          },
          lastAccessedAt: now
        }
      }
    };

    saveProgress(newProgress);
    return chapterProgress;
  }, [progress, getBookProgress, saveProgress]);

  // 챕터 학습 상태 확인
  const isChapterCompleted = useCallback((bookId, chapterId, mode) => {
    const bookProgress = getBookProgress(bookId);
    const chapterProgress = bookProgress.chapters[chapterId];

    if (!chapterProgress) return false;

    if (mode === 'reading') return chapterProgress.readingCompleted;
    if (mode === 'speaking') return chapterProgress.speakingCompleted;
    return chapterProgress.readingCompleted && chapterProgress.speakingCompleted;
  }, [getBookProgress]);

  // 마지막 챕터 인덱스 업데이트
  const updateLastChapterIndex = useCallback((bookId, chapterIndex) => {
    const bookProgress = getBookProgress(bookId);
    const now = new Date().toISOString();

    const newProgress = {
      ...progress,
      books: {
        ...progress.books,
        [bookId]: {
          ...bookProgress,
          lastChapterIndex: chapterIndex,
          lastAccessedAt: now
        }
      }
    };

    saveProgress(newProgress);
  }, [progress, getBookProgress, saveProgress]);

  // 책 전체 학습 통계
  const getBookStats = useCallback((bookId, totalChapters) => {
    const bookProgress = getBookProgress(bookId);
    const chapters = Object.values(bookProgress.chapters);

    const readingCompleted = chapters.filter(ch => ch.readingCompleted).length;
    const speakingCompleted = chapters.filter(ch => ch.speakingCompleted).length;
    const fullyCompleted = chapters.filter(ch => ch.readingCompleted && ch.speakingCompleted).length;
    const totalWords = chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);

    return {
      readingCompleted,
      speakingCompleted,
      fullyCompleted,
      totalChapters,
      totalWords,
      readingPercentage: totalChapters > 0 ? Math.round((readingCompleted / totalChapters) * 100) : 0,
      speakingPercentage: totalChapters > 0 ? Math.round((speakingCompleted / totalChapters) * 100) : 0,
      overallPercentage: totalChapters > 0 ? Math.round((fullyCompleted / totalChapters) * 100) : 0,
      lastAccessedAt: bookProgress.lastAccessedAt,
      lastChapterIndex: bookProgress.lastChapterIndex
    };
  }, [getBookProgress]);

  // ==================== 영웅 대화 관련 ====================

  // 영웅 대화 기록
  const markHeroConversation = useCallback((heroId) => {
    const heroProgress = progress.heroes[heroId] || {
      conversationCount: 0,
      firstTalkDate: null,
      lastTalkDate: null
    };

    const now = new Date().toISOString();

    const updatedHero = {
      ...heroProgress,
      conversationCount: heroProgress.conversationCount + 1,
      firstTalkDate: heroProgress.firstTalkDate || now,
      lastTalkDate: now
    };

    const newProgress = {
      ...progress,
      heroes: {
        ...progress.heroes,
        [heroId]: updatedHero
      }
    };

    saveProgress(newProgress);
    return updatedHero;
  }, [progress, saveProgress]);

  // 영웅별 대화 통계
  const getHeroStats = useCallback((heroId) => {
    return progress.heroes[heroId] || {
      conversationCount: 0,
      firstTalkDate: null,
      lastTalkDate: null
    };
  }, [progress.heroes]);

  // 대화한 영웅 수
  const getTalkedHeroesCount = useCallback(() => {
    return Object.keys(progress.heroes).filter(
      heroId => progress.heroes[heroId].conversationCount > 0
    ).length;
  }, [progress.heroes]);

  // 모든 영웅 대화 통계
  const getAllHeroesStats = useCallback(() => {
    return progress.heroes;
  }, [progress.heroes]);

  // ==================== 전체 통계 ====================

  // 전체 진행률 (모든 책)
  const getTotalProgress = useCallback((booksData) => {
    if (!booksData || booksData.length === 0) {
      return {
        totalBooks: 0,
        completedBooks: 0,
        totalChapters: 0,
        completedChapters: 0,
        totalWords: 0,
        overallPercentage: 0
      };
    }

    let totalChapters = 0;
    let completedChapters = 0;
    let completedBooks = 0;
    let totalWords = 0;

    booksData.forEach(book => {
      const bookChapterCount = book.chapters?.length || 0;
      totalChapters += bookChapterCount;

      const stats = getBookStats(book.id, bookChapterCount);
      completedChapters += stats.readingCompleted;
      totalWords += stats.totalWords;

      // 모든 챕터 읽기 완료 시 완독
      if (stats.readingCompleted === bookChapterCount && bookChapterCount > 0) {
        completedBooks++;
      }
    });

    return {
      totalBooks: booksData.length,
      completedBooks,
      totalChapters,
      completedChapters,
      totalWords,
      overallPercentage: totalChapters > 0
        ? Math.round((completedChapters / totalChapters) * 100)
        : 0
    };
  }, [getBookStats]);

  // 최근 활동 (마지막 읽은 책)
  const getRecentActivity = useCallback(() => {
    const bookEntries = Object.entries(progress.books);
    if (bookEntries.length === 0) return null;

    // 가장 최근 접근한 책 찾기
    const sorted = bookEntries
      .filter(([, data]) => data.lastAccessedAt)
      .sort((a, b) => new Date(b[1].lastAccessedAt) - new Date(a[1].lastAccessedAt));

    if (sorted.length === 0) return null;

    const [bookId, bookData] = sorted[0];
    return {
      bookId,
      lastAccessedAt: bookData.lastAccessedAt,
      lastChapterIndex: bookData.lastChapterIndex
    };
  }, [progress.books]);

  // ==================== 초기화 ====================

  // 책별 진행 초기화
  const resetBookProgress = useCallback((bookId) => {
    const newProgress = { ...progress };
    delete newProgress.books[bookId];
    saveProgress(newProgress);
  }, [progress, saveProgress]);

  // 영웅 대화 기록 초기화
  const resetHeroProgress = useCallback((heroId) => {
    const newProgress = { ...progress };
    delete newProgress.heroes[heroId];
    saveProgress(newProgress);
  }, [progress, saveProgress]);

  // 전체 진행 초기화
  const resetAllProgress = useCallback(() => {
    const fresh = getInitialState();
    saveProgress(fresh);
  }, [saveProgress]);

  // raw 데이터 반환 (Export용)
  const getRawData = useCallback(() => {
    return progress;
  }, [progress]);

  // 데이터 설정 (Import용)
  const setRawData = useCallback((data) => {
    if (data && data.version) {
      saveProgress(data);
    }
  }, [saveProgress]);

  return {
    // 로딩 상태
    isLoaded,

    // 책/챕터 관련
    getBookProgress,
    markChapterCompleted,
    isChapterCompleted,
    updateLastChapterIndex,
    getBookStats,

    // 영웅 대화 관련
    markHeroConversation,
    getHeroStats,
    getTalkedHeroesCount,
    getAllHeroesStats,

    // 전체 통계
    getTotalProgress,
    getRecentActivity,

    // 초기화
    resetBookProgress,
    resetHeroProgress,
    resetAllProgress,

    // 데이터 관리 (Export/Import용)
    getRawData,
    setRawData
  };
};

export default useProgress;
