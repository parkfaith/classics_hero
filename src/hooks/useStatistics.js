import { useState, useEffect, useCallback, useRef } from 'react';

const STATS_KEY = 'user_statistics';
const STREAK_KEY = 'streak_data';
const VERSION = '1.1.0';

// 초기 통계 상태
const getInitialStats = () => ({
  version: VERSION,
  totalStudyTime: 0,           // 총 학습 시간 (ms)
  totalWords: 0,               // 읽은 단어 수
  completedChapters: 0,        // 완료한 챕터 수
  completedBooks: 0,           // 완료한 책 수
  heroConversations: 0,        // 영웅 대화 횟수
  speakingSessions: 0,         // Speaking 모드 완료 횟수
  weeklyActivity: {},          // 주간 활동 { '2026-W05': { mon: 1200000, ... } }
  dailyActivity: {}            // 일별 활동 { '2026-02-01': { studyTime: ..., wordsRead: ... } }
});

// 초기 스트릭 상태
const getInitialStreak = () => ({
  version: VERSION,
  lastStudyDate: null,         // 마지막 학습 날짜 (YYYY-MM-DD)
  studyDates: [],              // 학습한 날짜 목록
  currentStreak: 0,            // 현재 연속 학습일
  longestStreak: 0             // 최장 연속 기록
});

// 날짜 유틸리티
const getToday = () => new Date().toISOString().split('T')[0];

const getWeekKey = (date = new Date()) => {
  const d = new Date(date);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
};

const getDayOfWeek = (date = new Date()) => {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  return days[new Date(date).getDay()];
};

const calculateDaysDiff = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
};

/**
 * 학습 통계 훅
 * - 학습 시간 추적
 * - 단어/챕터/책 수 집계
 * - 연속 학습일 (스트릭) 관리
 * - 주간/일별 활동 기록
 */
export const useStatistics = () => {
  const [stats, setStats] = useState(getInitialStats());
  const [streak, setStreak] = useState(getInitialStreak());
  const [isLoaded, setIsLoaded] = useState(false);
  const sessionStartRef = useRef(null);

  // 초기 로드
  useEffect(() => {
    // 통계 로드
    const savedStats = localStorage.getItem(STATS_KEY);
    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        console.error('통계 데이터 파싱 오류:', e);
      }
    }

    // 스트릭 로드
    const savedStreak = localStorage.getItem(STREAK_KEY);
    if (savedStreak) {
      try {
        const parsed = JSON.parse(savedStreak);
        // 스트릭 유효성 체크
        const validatedStreak = validateStreak(parsed);
        setStreak(validatedStreak);
      } catch (e) {
        console.error('스트릭 데이터 파싱 오류:', e);
      }
    }

    setIsLoaded(true);

    // 세션 시작
    sessionStartRef.current = Date.now();

    // 페이지 이탈 시 세션 시간 저장
    const handleUnload = () => {
      if (sessionStartRef.current) {
        const duration = Date.now() - sessionStartRef.current;
        saveStudyTimeToStorage(duration);
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, []);

  // 스트릭 유효성 검증 (하루 이상 지났으면 초기화)
  const validateStreak = (streakData) => {
    if (!streakData.lastStudyDate) return streakData;

    const today = getToday();
    const daysDiff = calculateDaysDiff(streakData.lastStudyDate, today);

    if (daysDiff > 1) {
      // 하루 이상 건너뛰면 스트릭 초기화
      return {
        ...streakData,
        currentStreak: 0
      };
    }

    return streakData;
  };

  // 통계 저장
  const saveStats = useCallback((newStats) => {
    setStats(newStats);
    localStorage.setItem(STATS_KEY, JSON.stringify(newStats));
  }, []);

  // 스트릭 저장
  const saveStreak = useCallback((newStreak) => {
    setStreak(newStreak);
    localStorage.setItem(STREAK_KEY, JSON.stringify(newStreak));
  }, []);

  // localStorage에 학습 시간 직접 저장 (beforeunload용)
  const saveStudyTimeToStorage = (duration) => {
    if (duration < 1000) return; // 1초 미만은 무시

    try {
      const savedStats = localStorage.getItem(STATS_KEY);
      const currentStats = savedStats ? JSON.parse(savedStats) : getInitialStats();

      const today = getToday();
      const weekKey = getWeekKey();
      const dayOfWeek = getDayOfWeek();

      // 총 학습 시간 업데이트
      currentStats.totalStudyTime = (currentStats.totalStudyTime || 0) + duration;

      // 주간 활동 업데이트
      if (!currentStats.weeklyActivity[weekKey]) {
        currentStats.weeklyActivity[weekKey] = {};
      }
      currentStats.weeklyActivity[weekKey][dayOfWeek] =
        (currentStats.weeklyActivity[weekKey][dayOfWeek] || 0) + duration;

      // 일별 활동 업데이트
      if (!currentStats.dailyActivity[today]) {
        currentStats.dailyActivity[today] = { studyTime: 0, wordsRead: 0, chaptersCompleted: 0 };
      }
      currentStats.dailyActivity[today].studyTime += duration;

      localStorage.setItem(STATS_KEY, JSON.stringify(currentStats));
    } catch (e) {
      console.error('학습 시간 저장 오류:', e);
    }
  };

  // ==================== 세션 관리 ====================

  // 세션 시작
  const startSession = useCallback(() => {
    sessionStartRef.current = Date.now();
  }, []);

  // 세션 종료 (학습 시간 누적)
  const endSession = useCallback(() => {
    if (!sessionStartRef.current) return 0;

    const duration = Date.now() - sessionStartRef.current;
    sessionStartRef.current = Date.now(); // 새 세션 시작

    if (duration < 1000) return 0; // 1초 미만은 무시

    const today = getToday();
    const weekKey = getWeekKey();
    const dayOfWeek = getDayOfWeek();

    const newStats = {
      ...stats,
      totalStudyTime: stats.totalStudyTime + duration,
      weeklyActivity: {
        ...stats.weeklyActivity,
        [weekKey]: {
          ...(stats.weeklyActivity[weekKey] || {}),
          [dayOfWeek]: (stats.weeklyActivity[weekKey]?.[dayOfWeek] || 0) + duration
        }
      },
      dailyActivity: {
        ...stats.dailyActivity,
        [today]: {
          ...(stats.dailyActivity[today] || { studyTime: 0, wordsRead: 0, chaptersCompleted: 0 }),
          studyTime: (stats.dailyActivity[today]?.studyTime || 0) + duration
        }
      }
    };

    saveStats(newStats);
    return duration;
  }, [stats, saveStats]);

  // ==================== 기록 업데이트 ====================

  // 챕터 완료 기록
  const recordChapterComplete = useCallback((wordCount = 0) => {
    const today = getToday();

    const newStats = {
      ...stats,
      completedChapters: stats.completedChapters + 1,
      totalWords: stats.totalWords + wordCount,
      dailyActivity: {
        ...stats.dailyActivity,
        [today]: {
          ...(stats.dailyActivity[today] || { studyTime: 0, wordsRead: 0, chaptersCompleted: 0 }),
          wordsRead: (stats.dailyActivity[today]?.wordsRead || 0) + wordCount,
          chaptersCompleted: (stats.dailyActivity[today]?.chaptersCompleted || 0) + 1
        }
      }
    };

    saveStats(newStats);
    updateStreak();
  }, [stats, saveStats]);

  // 책 완료 기록
  const recordBookComplete = useCallback(() => {
    const newStats = {
      ...stats,
      completedBooks: stats.completedBooks + 1
    };
    saveStats(newStats);
  }, [stats, saveStats]);

  // 영웅 대화 기록
  const recordHeroConversation = useCallback(() => {
    const newStats = {
      ...stats,
      heroConversations: stats.heroConversations + 1
    };
    saveStats(newStats);
    updateStreak();
  }, [stats, saveStats]);

  // Speaking 모드 완료 기록
  const recordSpeakingSession = useCallback(() => {
    const newStats = {
      ...stats,
      speakingSessions: stats.speakingSessions + 1
    };
    saveStats(newStats);
    updateStreak();
  }, [stats, saveStats]);

  // ==================== 스트릭 관리 ====================

  // 스트릭 업데이트
  const updateStreak = useCallback(() => {
    const today = getToday();

    // 이미 오늘 학습했으면 스킵
    if (streak.lastStudyDate === today) {
      return streak;
    }

    let newCurrentStreak = 1;

    if (streak.lastStudyDate) {
      const daysDiff = calculateDaysDiff(streak.lastStudyDate, today);

      if (daysDiff === 1) {
        // 연속 학습
        newCurrentStreak = streak.currentStreak + 1;
      } else if (daysDiff > 1) {
        // 스트릭 끊김
        newCurrentStreak = 1;
      } else if (daysDiff === 0) {
        // 같은 날
        return streak;
      }
    }

    const newStreak = {
      ...streak,
      lastStudyDate: today,
      studyDates: [...new Set([...streak.studyDates, today])].slice(-365), // 최대 1년치 보관
      currentStreak: newCurrentStreak,
      longestStreak: Math.max(streak.longestStreak, newCurrentStreak)
    };

    saveStreak(newStreak);
    return newStreak;
  }, [streak, saveStreak]);

  // ==================== 조회 함수 ====================

  // 현재 스트릭
  const getCurrentStreak = useCallback(() => {
    return streak.currentStreak;
  }, [streak.currentStreak]);

  // 최장 스트릭
  const getLongestStreak = useCallback(() => {
    return streak.longestStreak;
  }, [streak.longestStreak]);

  // 주간 활동 (차트용)
  const getWeeklyActivity = useCallback((weekKey = null) => {
    const key = weekKey || getWeekKey();
    const activity = stats.weeklyActivity[key] || {};

    return {
      mon: activity.mon || 0,
      tue: activity.tue || 0,
      wed: activity.wed || 0,
      thu: activity.thu || 0,
      fri: activity.fri || 0,
      sat: activity.sat || 0,
      sun: activity.sun || 0
    };
  }, [stats.weeklyActivity]);

  // 일별 활동
  const getDailyActivity = useCallback((date = null) => {
    const day = date || getToday();
    return stats.dailyActivity[day] || {
      studyTime: 0,
      wordsRead: 0,
      chaptersCompleted: 0
    };
  }, [stats.dailyActivity]);

  // 총 학습 시간 (포맷팅)
  const getTotalStudyTime = useCallback(() => {
    const ms = stats.totalStudyTime;
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}시간 ${minutes}분`;
    }
    return `${minutes}분`;
  }, [stats.totalStudyTime]);

  // 총 학습 시간 (ms)
  const getTotalStudyTimeMs = useCallback(() => {
    return stats.totalStudyTime;
  }, [stats.totalStudyTime]);

  // 전체 통계 요약
  const getStatsSummary = useCallback(() => {
    return {
      totalStudyTime: stats.totalStudyTime,
      totalStudyTimeFormatted: getTotalStudyTime(),
      totalWords: stats.totalWords,
      completedChapters: stats.completedChapters,
      completedBooks: stats.completedBooks,
      heroConversations: stats.heroConversations,
      speakingSessions: stats.speakingSessions,
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      lastStudyDate: streak.lastStudyDate
    };
  }, [stats, streak, getTotalStudyTime]);

  // ==================== 초기화 ====================

  // 통계 초기화
  const resetStats = useCallback(() => {
    saveStats(getInitialStats());
  }, [saveStats]);

  // 스트릭 초기화
  const resetStreak = useCallback(() => {
    saveStreak(getInitialStreak());
  }, [saveStreak]);

  // 전체 초기화
  const resetAll = useCallback(() => {
    resetStats();
    resetStreak();
  }, [resetStats, resetStreak]);

  // raw 데이터 반환 (Export용)
  const getRawData = useCallback(() => {
    return {
      statistics: stats,
      streakData: streak
    };
  }, [stats, streak]);

  // 데이터 설정 (Import용)
  const setRawData = useCallback((data) => {
    if (data.statistics) {
      saveStats(data.statistics);
    }
    if (data.streakData) {
      saveStreak(data.streakData);
    }
  }, [saveStats, saveStreak]);

  return {
    // 로딩 상태
    isLoaded,

    // 통계 데이터
    stats,
    streak,

    // 세션 관리
    startSession,
    endSession,

    // 기록 업데이트
    recordChapterComplete,
    recordBookComplete,
    recordHeroConversation,
    recordSpeakingSession,

    // 스트릭 관리
    updateStreak,
    getCurrentStreak,
    getLongestStreak,

    // 조회
    getWeeklyActivity,
    getDailyActivity,
    getTotalStudyTime,
    getTotalStudyTimeMs,
    getStatsSummary,

    // 초기화
    resetStats,
    resetStreak,
    resetAll,

    // 데이터 관리 (Export/Import용)
    getRawData,
    setRawData
  };
};

export default useStatistics;
