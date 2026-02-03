import { useCallback } from 'react';

const APP_VERSION = '1.1.0';

// localStorage 키 목록
const STORAGE_KEYS = {
  progress: 'user_progress',
  badges: 'user_badges',
  statistics: 'user_statistics',
  streak: 'streak_data'
};

// 기존 키 목록 (마이그레이션/정리용)
const LEGACY_KEYS = [
  'learning-progress',
  'learning-motivation'
];

/**
 * 데이터 관리 훅
 * - JSON Export (다운로드)
 * - JSON Import (업로드)
 * - 데이터 유효성 검증
 * - 전체 초기화
 */
export const useDataManager = () => {

  // ==================== Export ====================

  // 모든 데이터를 JSON으로 내보내기
  const exportData = useCallback(() => {
    const data = {
      version: APP_VERSION,
      exportDate: new Date().toISOString(),
      appName: 'Classic Hero',
      progress: safeGetItem(STORAGE_KEYS.progress),
      badges: safeGetItem(STORAGE_KEYS.badges),
      statistics: safeGetItem(STORAGE_KEYS.statistics),
      streakData: safeGetItem(STORAGE_KEYS.streak)
    };

    // JSON 파일 생성 및 다운로드
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `classichero_backup_${formatDate(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);

    return data;
  }, []);

  // ==================== Import ====================

  // JSON 파일에서 데이터 가져오기
  const importData = useCallback(async (file, mode = 'overwrite') => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const data = JSON.parse(text);

          // 유효성 검증
          const validation = validateBackup(data);
          if (!validation.valid) {
            reject(new Error(validation.error));
            return;
          }

          if (mode === 'overwrite') {
            // 완전 덮어쓰기
            overwriteData(data);
          } else if (mode === 'merge') {
            // 병합 (더 높은 값 유지)
            mergeData(data);
          }

          resolve({
            success: true,
            mode,
            importedAt: new Date().toISOString()
          });
        } catch (err) {
          reject(new Error(`파일 파싱 실패: ${err.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('파일 읽기 실패'));
      };

      reader.readAsText(file);
    });
  }, []);

  // 데이터 덮어쓰기
  const overwriteData = (data) => {
    if (data.progress) {
      localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(data.progress));
    }
    if (data.badges) {
      localStorage.setItem(STORAGE_KEYS.badges, JSON.stringify(data.badges));
    }
    if (data.statistics) {
      localStorage.setItem(STORAGE_KEYS.statistics, JSON.stringify(data.statistics));
    }
    if (data.streakData) {
      localStorage.setItem(STORAGE_KEYS.streak, JSON.stringify(data.streakData));
    }
  };

  // 데이터 병합 (더 높은 값 유지)
  const mergeData = (importedData) => {
    // Progress 병합
    if (importedData.progress) {
      const current = safeGetItem(STORAGE_KEYS.progress) || { books: {}, heroes: {} };
      const merged = mergeProgressData(current, importedData.progress);
      localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(merged));
    }

    // Badges 병합 (획득한 배지 유지)
    if (importedData.badges) {
      const current = safeGetItem(STORAGE_KEYS.badges) || { badges: {} };
      const merged = mergeBadgesData(current, importedData.badges);
      localStorage.setItem(STORAGE_KEYS.badges, JSON.stringify(merged));
    }

    // Statistics 병합 (더 높은 값)
    if (importedData.statistics) {
      const current = safeGetItem(STORAGE_KEYS.statistics) || {};
      const merged = mergeStatisticsData(current, importedData.statistics);
      localStorage.setItem(STORAGE_KEYS.statistics, JSON.stringify(merged));
    }

    // Streak 병합 (최장 기록 유지)
    if (importedData.streakData) {
      const current = safeGetItem(STORAGE_KEYS.streak) || {};
      const merged = mergeStreakData(current, importedData.streakData);
      localStorage.setItem(STORAGE_KEYS.streak, JSON.stringify(merged));
    }
  };

  // Progress 데이터 병합
  const mergeProgressData = (current, imported) => {
    const merged = { ...current };

    // Books 병합
    if (imported.books) {
      merged.books = merged.books || {};
      Object.entries(imported.books).forEach(([bookId, bookData]) => {
        if (!merged.books[bookId]) {
          merged.books[bookId] = bookData;
        } else {
          // 챕터별로 완료 상태 병합
          merged.books[bookId].chapters = merged.books[bookId].chapters || {};
          Object.entries(bookData.chapters || {}).forEach(([chapterId, chapterData]) => {
            const existing = merged.books[bookId].chapters[chapterId] || {};
            merged.books[bookId].chapters[chapterId] = {
              readingCompleted: existing.readingCompleted || chapterData.readingCompleted,
              speakingCompleted: existing.speakingCompleted || chapterData.speakingCompleted,
              readingCompletedAt: existing.readingCompletedAt || chapterData.readingCompletedAt,
              speakingCompletedAt: existing.speakingCompletedAt || chapterData.speakingCompletedAt,
              wordCount: Math.max(existing.wordCount || 0, chapterData.wordCount || 0)
            };
          });
        }
      });
    }

    // Heroes 병합
    if (imported.heroes) {
      merged.heroes = merged.heroes || {};
      Object.entries(imported.heroes).forEach(([heroId, heroData]) => {
        if (!merged.heroes[heroId]) {
          merged.heroes[heroId] = heroData;
        } else {
          merged.heroes[heroId] = {
            conversationCount: Math.max(
              merged.heroes[heroId].conversationCount || 0,
              heroData.conversationCount || 0
            ),
            firstTalkDate: merged.heroes[heroId].firstTalkDate || heroData.firstTalkDate,
            lastTalkDate: heroData.lastTalkDate || merged.heroes[heroId].lastTalkDate
          };
        }
      });
    }

    return merged;
  };

  // Badges 데이터 병합
  const mergeBadgesData = (current, imported) => {
    const merged = { ...current };
    merged.badges = merged.badges || {};

    if (imported.badges) {
      Object.entries(imported.badges).forEach(([badgeId, badgeData]) => {
        // 이미 획득했거나, 가져오는 데이터에서 획득했으면 획득 상태 유지
        if (!merged.badges[badgeId]?.unlocked && badgeData.unlocked) {
          merged.badges[badgeId] = badgeData;
        }
      });
    }

    return merged;
  };

  // Statistics 데이터 병합
  const mergeStatisticsData = (current, imported) => {
    return {
      ...current,
      totalStudyTime: Math.max(current.totalStudyTime || 0, imported.totalStudyTime || 0),
      totalWords: Math.max(current.totalWords || 0, imported.totalWords || 0),
      completedChapters: Math.max(current.completedChapters || 0, imported.completedChapters || 0),
      completedBooks: Math.max(current.completedBooks || 0, imported.completedBooks || 0),
      heroConversations: Math.max(current.heroConversations || 0, imported.heroConversations || 0),
      speakingSessions: Math.max(current.speakingSessions || 0, imported.speakingSessions || 0),
      // 주간/일별 활동은 덮어쓰기 (병합 어려움)
      weeklyActivity: imported.weeklyActivity || current.weeklyActivity || {},
      dailyActivity: imported.dailyActivity || current.dailyActivity || {}
    };
  };

  // Streak 데이터 병합
  const mergeStreakData = (current, imported) => {
    return {
      ...current,
      longestStreak: Math.max(current.longestStreak || 0, imported.longestStreak || 0),
      currentStreak: imported.currentStreak || current.currentStreak || 0,
      lastStudyDate: imported.lastStudyDate || current.lastStudyDate,
      studyDates: [...new Set([
        ...(current.studyDates || []),
        ...(imported.studyDates || [])
      ])].sort()
    };
  };

  // ==================== Validation ====================

  // 백업 데이터 유효성 검증
  const validateBackup = useCallback((data) => {
    if (!data) {
      return { valid: false, error: '데이터가 비어있습니다' };
    }

    if (!data.version) {
      return { valid: false, error: '버전 정보가 없습니다' };
    }

    if (!data.appName || data.appName !== 'Classic Hero') {
      // appName이 없어도 허용 (이전 버전 호환)
      if (data.appName && data.appName !== 'Classic Hero') {
        return { valid: false, error: '다른 앱의 백업 파일입니다' };
      }
    }

    // 최소 하나의 데이터 섹션이 있어야 함
    if (!data.progress && !data.badges && !data.statistics && !data.streakData) {
      return { valid: false, error: '유효한 데이터 섹션이 없습니다' };
    }

    return { valid: true };
  }, []);

  // ==================== Reset ====================

  // 모든 데이터 초기화
  const resetAllData = useCallback(() => {
    // 신규 키 삭제
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });

    // 기존 키도 정리
    LEGACY_KEYS.forEach(key => {
      localStorage.removeItem(key);
    });

    // 책별 진행 데이터 정리 (progress-* 패턴)
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('progress-') || key.startsWith('bookmarks-'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    return { success: true, clearedAt: new Date().toISOString() };
  }, []);

  // ==================== Storage Info ====================

  // localStorage 사용량 조회
  const getStorageUsage = useCallback(() => {
    let totalSize = 0;
    const details = {};

    // 주요 키별 크기
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      const value = localStorage.getItem(key);
      const size = value ? new Blob([value]).size : 0;
      details[name] = size;
      totalSize += size;
    });

    // 기타 앱 관련 키
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('progress-') || key.startsWith('bookmarks-') ||
                  key.startsWith('pronunciation-') || key.startsWith('learned-'))) {
        const value = localStorage.getItem(key);
        const size = value ? new Blob([value]).size : 0;
        details[key] = size;
        totalSize += size;
      }
    }

    return {
      totalBytes: totalSize,
      totalKB: Math.round(totalSize / 1024 * 100) / 100,
      totalMB: Math.round(totalSize / (1024 * 1024) * 1000) / 1000,
      details,
      // localStorage 제한 (일반적으로 5-10MB)
      estimatedLimit: '5-10MB',
      usagePercent: Math.round(totalSize / (5 * 1024 * 1024) * 100) // 5MB 기준
    };
  }, []);

  // 데이터 존재 여부 확인
  const hasData = useCallback(() => {
    return Object.values(STORAGE_KEYS).some(key => localStorage.getItem(key) !== null);
  }, []);

  return {
    // Export
    exportData,

    // Import
    importData,

    // Validation
    validateBackup,

    // Reset
    resetAllData,

    // Storage Info
    getStorageUsage,
    hasData,

    // 상수
    STORAGE_KEYS
  };
};

// ==================== 유틸리티 함수 ====================

// 안전한 localStorage 읽기
const safeGetItem = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

// 날짜 포맷팅 (YYYYMMDD)
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

export default useDataManager;
