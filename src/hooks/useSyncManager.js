import { useState, useCallback, useEffect, useRef } from 'react';
import { getSyncData, putSyncData } from '../api/index';
import {
  mergeProgressData,
  mergeBadgesData,
  mergeStatisticsData,
  mergeStreakData,
  mergeTodayQuestData,
  mergeLearningProgress,
  mergeReadingProgress,
  mergeBookmarks,
} from './useDataManager';

const STORAGE_KEYS = {
  progress: 'user_progress',
  badges: 'user_badges',
  statistics: 'user_statistics',
  streak: 'streak_data',
  todayQuest: 'today_quest_data',
  learningProgress: 'learning-progress',
};

// 동기화 대상 키 목록 (정적 키)
const SYNC_KEYS = new Set(Object.values(STORAGE_KEYS));

// 동적 키 프리픽스 (progress-{bookId}, bookmarks-{bookId})
const SYNC_KEY_PREFIXES = ['progress-', 'bookmarks-'];

const isSyncTarget = (key) => {
  if (SYNC_KEYS.has(key)) return true;
  return SYNC_KEY_PREFIXES.some(prefix => key.startsWith(prefix));
};

const DEBOUNCE_MS = 2000;

const safeGetItem = (key) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

// localStorage에서 프리픽스로 시작하는 모든 키의 데이터를 수집
const collectPrefixedItems = (prefix) => {
  const result = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key.startsWith(prefix)) {
      const id = key.slice(prefix.length);
      const value = safeGetItem(key);
      if (value !== null) {
        result[id] = value;
      }
    }
  }
  return result;
};

export const useSyncManager = ({ isLoggedIn, getToken }) => {
  const [lastSyncTime, setLastSyncTime] = useState(
    () => localStorage.getItem('last_sync_time') || null
  );
  const [isSyncing, setIsSyncing] = useState(false);
  const debounceRef = useRef(null);
  const isSyncingRef = useRef(false);

  // 로컬 데이터 수집
  const getLocalData = useCallback(() => {
    return {
      progress: safeGetItem(STORAGE_KEYS.progress),
      statistics: safeGetItem(STORAGE_KEYS.statistics),
      streakData: safeGetItem(STORAGE_KEYS.streak),
      badges: safeGetItem(STORAGE_KEYS.badges),
      todayQuestData: safeGetItem(STORAGE_KEYS.todayQuest),
      learningProgress: safeGetItem(STORAGE_KEYS.learningProgress),
      readingProgress: collectPrefixedItems('progress-'),
      bookmarks: collectPrefixedItems('bookmarks-'),
    };
  }, []);

  // 병합 결과를 localStorage에 저장
  const saveLocalData = useCallback((data) => {
    if (data.progress) localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(data.progress));
    if (data.statistics) localStorage.setItem(STORAGE_KEYS.statistics, JSON.stringify(data.statistics));
    if (data.streakData) localStorage.setItem(STORAGE_KEYS.streak, JSON.stringify(data.streakData));
    if (data.badges) localStorage.setItem(STORAGE_KEYS.badges, JSON.stringify(data.badges));
    if (data.todayQuestData) localStorage.setItem(STORAGE_KEYS.todayQuest, JSON.stringify(data.todayQuestData));
    if (data.learningProgress) localStorage.setItem(STORAGE_KEYS.learningProgress, JSON.stringify(data.learningProgress));
    if (data.readingProgress) {
      Object.entries(data.readingProgress).forEach(([bookId, progress]) => {
        localStorage.setItem(`progress-${bookId}`, JSON.stringify(progress));
      });
    }
    if (data.bookmarks) {
      Object.entries(data.bookmarks).forEach(([bookId, marks]) => {
        localStorage.setItem(`bookmarks-${bookId}`, JSON.stringify(marks));
      });
    }
  }, []);

  // 로컬 + 서버 데이터 병합
  const mergeAllData = useCallback((local, server) => {
    if (!server) return local;
    return {
      progress: mergeProgressData(local.progress || { books: {}, heroes: {} }, server.progress || { books: {}, heroes: {} }),
      statistics: mergeStatisticsData(local.statistics || {}, server.statistics || {}),
      streakData: mergeStreakData(local.streakData || {}, server.streakData || {}),
      badges: mergeBadgesData(local.badges || { badges: {} }, server.badges || { badges: {} }),
      todayQuestData: mergeTodayQuestData(local.todayQuestData || {}, server.todayQuestData || {}),
      learningProgress: mergeLearningProgress(local.learningProgress || {}, server.learningProgress || {}),
      readingProgress: mergeReadingProgress(local.readingProgress || {}, server.readingProgress || {}),
      bookmarks: mergeBookmarks(local.bookmarks || {}, server.bookmarks || {}),
    };
  }, []);

  // 전체 동기화 (Pull → Merge → Push)
  const syncNow = useCallback(async () => {
    const token = getToken();
    if (!isLoggedIn || !token || isSyncingRef.current) return;

    isSyncingRef.current = true;
    setIsSyncing(true);
    try {
      // 1. Pull
      const serverResponse = await getSyncData(token);
      const serverData = serverResponse.data;

      // 2. Get local
      const localData = getLocalData();

      // 3. Merge
      const merged = mergeAllData(localData, serverData);

      // 4. Save to localStorage
      saveLocalData(merged);

      // 5. Push to server
      await putSyncData(token, merged);

      const now = new Date().toISOString();
      setLastSyncTime(now);
      localStorage.setItem('last_sync_time', now);
    } catch (err) {
      console.error('동기화 실패:', err);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [isLoggedIn, getToken, getLocalData, saveLocalData, mergeAllData]);

  // 디바운스 Push (데이터 변경 시)
  const pushDebounced = useCallback(() => {
    const token = getToken();
    if (!isLoggedIn || !token) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if (isSyncingRef.current) return;
      const localData = getLocalData();
      try {
        await putSyncData(token, localData);
        const now = new Date().toISOString();
        setLastSyncTime(now);
        localStorage.setItem('last_sync_time', now);
      } catch (err) {
        console.error('데이터 Push 실패:', err);
      }
    }, DEBOUNCE_MS);
  }, [isLoggedIn, getToken, getLocalData]);

  // 로그인 상태에서 앱 로드 시 자동 동기화
  useEffect(() => {
    if (isLoggedIn) {
      syncNow();
    }
  }, [isLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  // storage-sync 이벤트 리스너 (데이터 변경 감지)
  useEffect(() => {
    const handler = (e) => {
      // 동기화 대상 키에 대해서만 push (정적 키 + 동적 프리픽스)
      if (e.detail?.key && isSyncTarget(e.detail.key)) {
        pushDebounced();
      }
    };
    window.addEventListener('storage-sync', handler);
    return () => window.removeEventListener('storage-sync', handler);
  }, [pushDebounced]);

  // visibilitychange 리스너 (앱 복귀 시 동기화)
  useEffect(() => {
    const handler = () => {
      if (document.visibilityState === 'visible' && isLoggedIn) {
        syncNow();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [isLoggedIn, syncNow]);

  // cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { syncNow, isSyncing, lastSyncTime };
};
