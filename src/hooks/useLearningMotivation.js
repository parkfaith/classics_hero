import { useState, useEffect, useCallback } from 'react';

// 뱃지 정의
const BADGES = {
  firstSentence: {
    id: 'firstSentence',
    name: '첫 발걸음',
    description: '첫 문장 연습 완료',
    icon: '🎯',
    condition: (stats) => stats.totalPracticed >= 1
  },
  tenSentences: {
    id: 'tenSentences',
    name: '꾸준한 학습자',
    description: '10문장 연습 완료',
    icon: '📚',
    condition: (stats) => stats.totalPracticed >= 10
  },
  fiftySentences: {
    id: 'fiftySentences',
    name: '열정적인 학습자',
    description: '50문장 연습 완료',
    icon: '🔥',
    condition: (stats) => stats.totalPracticed >= 50
  },
  perfectScore: {
    id: 'perfectScore',
    name: '완벽한 발음',
    description: '90점 이상 달성',
    icon: '⭐',
    condition: (stats) => stats.highestScore >= 90
  },
  superScore: {
    id: 'superScore',
    name: '발음 마스터',
    description: '95점 이상 달성',
    icon: '👑',
    condition: (stats) => stats.highestScore >= 95
  },
  threeStreak: {
    id: 'threeStreak',
    name: '3일 연속',
    description: '3일 연속 학습',
    icon: '🔥',
    condition: (stats) => stats.currentStreak >= 3
  },
  sevenStreak: {
    id: 'sevenStreak',
    name: '일주일 챌린지',
    description: '7일 연속 학습',
    icon: '💪',
    condition: (stats) => stats.currentStreak >= 7
  },
  improvement: {
    id: 'improvement',
    name: '성장하는 중',
    description: '점수 10점 이상 향상',
    icon: '📈',
    condition: (stats) => stats.biggestImprovement >= 10
  }
};

// 레벨 정의
const LEVELS = [
  { level: 1, name: '입문자', minXP: 0, icon: '🌱' },
  { level: 2, name: '초보', minXP: 50, icon: '🌿' },
  { level: 3, name: '중급', minXP: 150, icon: '🌳' },
  { level: 4, name: '숙련자', minXP: 300, icon: '🌲' },
  { level: 5, name: '전문가', minXP: 500, icon: '🏆' },
  { level: 6, name: '마스터', minXP: 800, icon: '👑' }
];

const STORAGE_KEY = 'learning-motivation';

export const useLearningMotivation = () => {
  const [data, setData] = useState({
    // 스트릭
    currentStreak: 0,
    longestStreak: 0,
    lastPracticeDate: null,

    // 통계
    totalPracticed: 0,
    totalXP: 0,
    highestScore: 0,
    biggestImprovement: 0,

    // 뱃지
    earnedBadges: [],

    // 오늘 학습
    todayPracticed: 0,
    todayGoal: 5 // 오늘 목표 문장 수
  });

  const [newBadge, setNewBadge] = useState(null); // 새로 획득한 뱃지 알림용

  // localStorage에서 데이터 로드
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);

      // 오늘 날짜 체크하여 스트릭 및 오늘 학습 초기화
      const today = new Date().toDateString();
      const lastDate = parsed.lastPracticeDate;

      if (lastDate) {
        const lastDateObj = new Date(lastDate);
        const todayObj = new Date(today);
        const diffDays = Math.floor((todayObj - lastDateObj) / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
          // 하루 이상 건너뛰면 스트릭 초기화
          parsed.currentStreak = 0;
        }

        if (diffDays >= 1) {
          // 새로운 날이면 오늘 학습 초기화
          parsed.todayPracticed = 0;
        }
      }

      setData(parsed);
    }
  }, []);

  // 데이터 저장
  const saveData = useCallback((newData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    setData(newData);
  }, []);

  // 연습 기록 추가
  const recordPractice = useCallback((score, previousScore = null) => {
    const today = new Date().toDateString();
    const lastDate = data.lastPracticeDate;

    let newStreak = data.currentStreak;

    // 스트릭 계산
    if (lastDate !== today) {
      if (lastDate) {
        const lastDateObj = new Date(lastDate);
        const todayObj = new Date(today);
        const diffDays = Math.floor((todayObj - lastDateObj) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          // 연속 학습
          newStreak = data.currentStreak + 1;
        } else if (diffDays > 1) {
          // 스트릭 끊김
          newStreak = 1;
        }
      } else {
        newStreak = 1;
      }
    }

    // XP 계산 (점수 기반)
    const earnedXP = Math.floor(score / 10) + 5; // 기본 5XP + 점수/10

    // 향상도 계산
    let improvement = 0;
    if (previousScore !== null && score > previousScore) {
      improvement = score - previousScore;
    }

    const newData = {
      ...data,
      currentStreak: newStreak,
      longestStreak: Math.max(data.longestStreak, newStreak),
      lastPracticeDate: today,
      totalPracticed: data.totalPracticed + 1,
      totalXP: data.totalXP + earnedXP,
      highestScore: Math.max(data.highestScore, score),
      biggestImprovement: Math.max(data.biggestImprovement, improvement),
      todayPracticed: lastDate === today ? data.todayPracticed + 1 : 1
    };

    // 뱃지 체크
    const stats = {
      totalPracticed: newData.totalPracticed,
      highestScore: newData.highestScore,
      currentStreak: newData.currentStreak,
      biggestImprovement: newData.biggestImprovement
    };

    const newBadges = [...data.earnedBadges];
    let justEarnedBadge = null;

    Object.values(BADGES).forEach(badge => {
      if (!newBadges.includes(badge.id) && badge.condition(stats)) {
        newBadges.push(badge.id);
        justEarnedBadge = badge;
      }
    });

    newData.earnedBadges = newBadges;

    saveData(newData);

    // 새 뱃지 알림
    if (justEarnedBadge) {
      setNewBadge(justEarnedBadge);
      setTimeout(() => setNewBadge(null), 3000);
    }

    return {
      earnedXP,
      newStreak,
      justEarnedBadge
    };
  }, [data, saveData]);

  // 현재 레벨 계산
  const getCurrentLevel = useCallback(() => {
    let currentLevel = LEVELS[0];
    for (const level of LEVELS) {
      if (data.totalXP >= level.minXP) {
        currentLevel = level;
      } else {
        break;
      }
    }
    return currentLevel;
  }, [data.totalXP]);

  // 다음 레벨까지 진행률
  const getLevelProgress = useCallback(() => {
    const currentLevel = getCurrentLevel();
    const currentLevelIndex = LEVELS.findIndex(l => l.level === currentLevel.level);
    const nextLevel = LEVELS[currentLevelIndex + 1];

    if (!nextLevel) {
      return { current: data.totalXP, max: data.totalXP, percentage: 100 };
    }

    const currentMin = currentLevel.minXP;
    const nextMin = nextLevel.minXP;
    const progress = data.totalXP - currentMin;
    const needed = nextMin - currentMin;

    return {
      current: progress,
      max: needed,
      percentage: Math.floor((progress / needed) * 100)
    };
  }, [data.totalXP, getCurrentLevel]);

  // 획득한 뱃지 목록
  const getEarnedBadges = useCallback(() => {
    return data.earnedBadges.map(id => BADGES[id]).filter(Boolean);
  }, [data.earnedBadges]);

  // 오늘 목표 달성률
  const getTodayProgress = useCallback(() => {
    return {
      current: data.todayPracticed,
      goal: data.todayGoal,
      percentage: Math.min(100, Math.floor((data.todayPracticed / data.todayGoal) * 100)),
      isCompleted: data.todayPracticed >= data.todayGoal
    };
  }, [data.todayPracticed, data.todayGoal]);

  // 뱃지 알림 닫기
  const dismissNewBadge = useCallback(() => {
    setNewBadge(null);
  }, []);

  return {
    // 데이터
    streak: data.currentStreak,
    longestStreak: data.longestStreak,
    totalPracticed: data.totalPracticed,
    totalXP: data.totalXP,
    highestScore: data.highestScore,

    // 함수
    recordPractice,
    getCurrentLevel,
    getLevelProgress,
    getEarnedBadges,
    getTodayProgress,

    // 뱃지 알림
    newBadge,
    dismissNewBadge,

    // 상수
    BADGES,
    LEVELS
  };
};

export default useLearningMotivation;
