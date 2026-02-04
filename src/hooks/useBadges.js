import { useState, useEffect, useCallback } from 'react';
import { safeSetItem } from './useDataManager';

const STORAGE_KEY = 'user_badges';
const VERSION = '1.1.0';

// 배지 정의 (PRD 기준 9개)
export const BADGE_DEFINITIONS = {
  first_chapter: {
    id: 'first_chapter',
    name: 'First Step',
    nameKo: '첫 걸음',
    icon: '🎯',
    description: 'Complete your first chapter',
    descriptionKo: '첫 번째 챕터를 완료했습니다',
    condition: (stats) => stats.completedChapters >= 1,
    progress: (stats) => ({ current: Math.min(stats.completedChapters, 1), target: 1 })
  },
  chapter_10: {
    id: 'chapter_10',
    name: 'Bookworm',
    nameKo: '독서광',
    icon: '📚',
    description: 'Complete 10 chapters',
    descriptionKo: '10개 챕터를 완료했습니다',
    condition: (stats) => stats.completedChapters >= 10,
    progress: (stats) => ({ current: Math.min(stats.completedChapters, 10), target: 10 })
  },
  chapter_50: {
    id: 'chapter_50',
    name: 'Master Reader',
    nameKo: '마스터 리더',
    icon: '🏆',
    description: 'Complete 50 chapters',
    descriptionKo: '50개 챕터를 완료했습니다',
    condition: (stats) => stats.completedChapters >= 50,
    progress: (stats) => ({ current: Math.min(stats.completedChapters, 50), target: 50 })
  },
  all_heroes: {
    id: 'all_heroes',
    name: 'Hero Collector',
    nameKo: '영웅 수집가',
    icon: '🎭',
    description: 'Talk with all 6 heroes',
    descriptionKo: '6명의 영웅 모두와 대화했습니다',
    condition: (stats) => stats.talkedHeroes >= 6,
    progress: (stats) => ({ current: Math.min(stats.talkedHeroes, 6), target: 6 })
  },
  first_book: {
    id: 'first_book',
    name: 'Finisher',
    nameKo: '완독자',
    icon: '📖',
    description: 'Complete your first book',
    descriptionKo: '첫 번째 책을 완독했습니다',
    condition: (stats) => stats.completedBooks >= 1,
    progress: (stats) => ({ current: Math.min(stats.completedBooks, 1), target: 1 })
  },
  streak_7: {
    id: 'streak_7',
    name: 'Weekly Learner',
    nameKo: '주간 학습자',
    icon: '🔥',
    description: 'Study for 7 consecutive days',
    descriptionKo: '7일 연속으로 학습했습니다',
    condition: (stats) => stats.currentStreak >= 7 || stats.longestStreak >= 7,
    progress: (stats) => ({ current: Math.min(Math.max(stats.currentStreak, stats.longestStreak), 7), target: 7 })
  },
  streak_30: {
    id: 'streak_30',
    name: 'Monthly Challenger',
    nameKo: '월간 챌린저',
    icon: '⭐',
    description: 'Study for 30 consecutive days',
    descriptionKo: '30일 연속으로 학습했습니다',
    condition: (stats) => stats.currentStreak >= 30 || stats.longestStreak >= 30,
    progress: (stats) => ({ current: Math.min(Math.max(stats.currentStreak, stats.longestStreak), 30), target: 30 })
  },
  words_1000: {
    id: 'words_1000',
    name: 'Word Master',
    nameKo: '단어 마스터',
    icon: '📝',
    description: 'Read 1,000 words',
    descriptionKo: '1,000개의 단어를 읽었습니다',
    condition: (stats) => stats.totalWords >= 1000,
    progress: (stats) => ({ current: Math.min(stats.totalWords, 1000), target: 1000 })
  },
  speaking_10: {
    id: 'speaking_10',
    name: 'Pronunciation Trainee',
    nameKo: '발음 연습생',
    icon: '🎤',
    description: 'Complete Speaking mode 10 times',
    descriptionKo: 'Speaking 모드를 10회 완료했습니다',
    condition: (stats) => stats.speakingSessions >= 10,
    progress: (stats) => ({ current: Math.min(stats.speakingSessions, 10), target: 10 })
  }
};

// 배지 ID 목록
export const BADGE_IDS = Object.keys(BADGE_DEFINITIONS);

// 초기 상태
const getInitialState = () => ({
  version: VERSION,
  badges: BADGE_IDS.reduce((acc, id) => {
    acc[id] = {
      unlocked: false,
      unlockedAt: null,
      shownModal: false
    };
    return acc;
  }, {})
});

/**
 * 배지/업적 시스템 훅
 * - 9개 배지 정의 (PRD 기준)
 * - 조건 체크 및 획득 처리
 * - 새 배지 획득 알림
 */
export const useBadges = () => {
  const [badgeData, setBadgeData] = useState(getInitialState());
  const [newBadge, setNewBadge] = useState(null); // 방금 획득한 배지
  const [isLoaded, setIsLoaded] = useState(false);

  // 초기 로드
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 새 배지가 추가되었을 수 있으므로 병합
        const merged = mergeBadgeData(parsed);
        setBadgeData(merged);
      } catch (e) {
        console.error('배지 데이터 파싱 오류:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // 기존 데이터와 새 배지 정의 병합
  const mergeBadgeData = (saved) => {
    const initial = getInitialState();
    return {
      ...initial,
      badges: {
        ...initial.badges,
        ...saved.badges
      }
    };
  };

  // 저장 (에러 처리 포함)
  const saveBadgeData = useCallback((data) => {
    setBadgeData(data);
    const result = safeSetItem(STORAGE_KEY, data);
    if (!result.success) {
      console.error('배지 데이터 저장 실패:', result.message);
      window.dispatchEvent(new CustomEvent('storage-error', { detail: result }));
    }
  }, []);

  // 배지 조건 체크 및 획득 처리
  const checkAchievements = useCallback((stats) => {
    const newlyUnlocked = [];

    const updatedBadges = { ...badgeData.badges };

    BADGE_IDS.forEach(badgeId => {
      const badge = BADGE_DEFINITIONS[badgeId];
      const currentState = updatedBadges[badgeId];

      // 이미 획득한 배지는 스킵
      if (currentState.unlocked) return;

      // 조건 체크
      if (badge.condition(stats)) {
        updatedBadges[badgeId] = {
          unlocked: true,
          unlockedAt: new Date().toISOString(),
          shownModal: false
        };
        newlyUnlocked.push(badge);
      }
    });

    // 새로 획득한 배지가 있으면 저장
    if (newlyUnlocked.length > 0) {
      const newData = {
        ...badgeData,
        badges: updatedBadges
      };
      saveBadgeData(newData);

      // 첫 번째 새 배지를 알림용으로 설정
      setNewBadge(newlyUnlocked[0]);
    }

    return newlyUnlocked;
  }, [badgeData, saveBadgeData]);

  // 배지 획득 알림 닫기 (모달 표시됨 처리)
  const dismissNewBadge = useCallback(() => {
    if (newBadge) {
      const updatedBadges = {
        ...badgeData.badges,
        [newBadge.id]: {
          ...badgeData.badges[newBadge.id],
          shownModal: true
        }
      };

      saveBadgeData({
        ...badgeData,
        badges: updatedBadges
      });
    }
    setNewBadge(null);
  }, [badgeData, newBadge, saveBadgeData]);

  // 획득한 배지 목록
  const getUnlockedBadges = useCallback(() => {
    return BADGE_IDS
      .filter(id => badgeData.badges[id]?.unlocked)
      .map(id => ({
        ...BADGE_DEFINITIONS[id],
        unlockedAt: badgeData.badges[id].unlockedAt
      }));
  }, [badgeData.badges]);

  // 미획득 배지 목록 (진행률 포함)
  const getLockedBadges = useCallback((stats) => {
    return BADGE_IDS
      .filter(id => !badgeData.badges[id]?.unlocked)
      .map(id => {
        const badge = BADGE_DEFINITIONS[id];
        const progress = badge.progress ? badge.progress(stats) : { current: 0, target: 1 };
        return {
          ...badge,
          progress,
          progressPercent: Math.round((progress.current / progress.target) * 100)
        };
      });
  }, [badgeData.badges]);

  // 모든 배지 상태 (UI 표시용)
  const getAllBadges = useCallback((stats) => {
    return BADGE_IDS.map(id => {
      const badge = BADGE_DEFINITIONS[id];
      const state = badgeData.badges[id];
      const progress = badge.progress ? badge.progress(stats) : { current: 0, target: 1 };

      return {
        ...badge,
        unlocked: state?.unlocked || false,
        unlockedAt: state?.unlockedAt || null,
        progress,
        progressPercent: state?.unlocked ? 100 : Math.round((progress.current / progress.target) * 100)
      };
    });
  }, [badgeData.badges]);

  // 특정 배지 획득 여부
  const isBadgeUnlocked = useCallback((badgeId) => {
    return badgeData.badges[badgeId]?.unlocked || false;
  }, [badgeData.badges]);

  // 획득 배지 수
  const getUnlockedCount = useCallback(() => {
    return BADGE_IDS.filter(id => badgeData.badges[id]?.unlocked).length;
  }, [badgeData.badges]);

  // 전체 배지 수
  const getTotalCount = useCallback(() => {
    return BADGE_IDS.length;
  }, []);

  // 표시 안 된 새 배지 확인 (앱 시작 시 체크용)
  const getUnshownBadges = useCallback(() => {
    return BADGE_IDS
      .filter(id => badgeData.badges[id]?.unlocked && !badgeData.badges[id]?.shownModal)
      .map(id => BADGE_DEFINITIONS[id]);
  }, [badgeData.badges]);

  // ==================== 초기화 ====================

  // 배지 초기화
  const resetBadges = useCallback(() => {
    saveBadgeData(getInitialState());
    setNewBadge(null);
  }, [saveBadgeData]);

  // raw 데이터 반환 (Export용)
  const getRawData = useCallback(() => {
    return badgeData;
  }, [badgeData]);

  // 데이터 설정 (Import용)
  const setRawData = useCallback((data) => {
    if (data && data.version) {
      const merged = mergeBadgeData(data);
      saveBadgeData(merged);
    }
  }, [saveBadgeData]);

  return {
    // 로딩 상태
    isLoaded,

    // 배지 데이터
    badges: badgeData.badges,

    // 새 배지 알림
    newBadge,
    dismissNewBadge,

    // 조건 체크
    checkAchievements,

    // 배지 조회
    getUnlockedBadges,
    getLockedBadges,
    getAllBadges,
    isBadgeUnlocked,
    getUnlockedCount,
    getTotalCount,
    getUnshownBadges,

    // 초기화
    resetBadges,

    // 데이터 관리 (Export/Import용)
    getRawData,
    setRawData,

    // 상수
    BADGE_DEFINITIONS,
    BADGE_IDS
  };
};

export default useBadges;
