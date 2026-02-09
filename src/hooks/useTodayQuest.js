import { useState, useEffect, useCallback } from 'react';
import { safeSetItem } from './useDataManager';

const STORAGE_KEY = 'today_quest_data';
const VERSION = '1.0.0';
const MAX_DAYS = 30; // 최대 30일치 데이터 보관

// 날짜 유틸리티
const getToday = () => new Date().toISOString().split('T')[0];

// 날짜 문자열 → 숫자 시드
const getDateSeed = (dateStr) => parseInt(dateStr.replace(/-/g, ''), 10);

// Seeded Random (Linear Congruential Generator)
const createSeededRandom = (seed) => {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
};

// 시드 기반으로 배열에서 아이템 선택
const selectByDate = (items, dateStr, offset = 0) => {
  if (!items || items.length === 0) return null;
  const random = createSeededRandom(getDateSeed(dateStr) + offset);
  const index = Math.floor(random() * items.length);
  return { item: items[index], index };
};

// 챕터 content에서 문장 분리
const splitSentences = (content) => {
  if (!content) return [];
  return content
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);
};

// 초기 상태
const getInitialState = () => ({
  version: VERSION,
  quests: {}
});

// 오늘의 퀘스트 초기 상태
const getInitialDayQuests = () => ({
  reading: { completed: false, completedAt: null },
  speaking: { completed: false, completedAt: null, accuracy: null },
  chat: { completed: false, completedAt: null, messageCount: 0 }
});

/**
 * Today's Quest 훅
 * - 날짜 기반 시드로 매일 다른 컨텐츠 선택
 * - localStorage에 미션 완료 상태 저장
 * - 스트릭/배지 시스템과 연동
 */
export const useTodayQuest = () => {
  const [questData, setQuestData] = useState(getInitialState());
  const [isLoaded, setIsLoaded] = useState(false);
  const today = getToday();

  // 초기 로드
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setQuestData(parsed);
      } catch (e) {
        console.error('퀘스트 데이터 파싱 오류:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // 30일 이전 데이터 자동 정리
  useEffect(() => {
    if (!isLoaded) return;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - MAX_DAYS);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const oldKeys = Object.keys(questData.quests).filter(d => d < cutoffStr);
    if (oldKeys.length > 0) {
      const cleaned = { ...questData.quests };
      oldKeys.forEach(k => delete cleaned[k]);
      saveQuestData({ ...questData, quests: cleaned });
    }
  }, [isLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // 저장
  const saveQuestData = useCallback((data) => {
    setQuestData(data);
    const result = safeSetItem(STORAGE_KEY, data);
    if (!result.success) {
      console.error('퀘스트 데이터 저장 실패:', result.message);
    }
  }, []);

  // 오늘 퀘스트 데이터 가져오기 (없으면 초기화)
  const getTodayQuests = useCallback(() => {
    return questData.quests[today] || getInitialDayQuests();
  }, [questData.quests, today]);

  // ==================== 컨텐츠 선택 로직 ====================

  // 오늘의 영웅 선택 (6명 로테이션)
  const selectTodayHero = useCallback((heroes) => {
    if (!heroes || heroes.length === 0) return null;
    const result = selectByDate(heroes, today, 0);
    return result?.item || null;
  }, [today]);

  // 오늘의 명언 선택
  const selectTodayQuote = useCallback((hero) => {
    if (!hero) return null;
    let quotes = hero.quotes;
    if (typeof quotes === 'string') {
      try { quotes = JSON.parse(quotes); } catch { return null; }
    }
    if (!Array.isArray(quotes) || quotes.length === 0) return null;
    const result = selectByDate(quotes, today, 10);
    return result?.item || null;
  }, [today]);

  // 오늘의 읽기 구절 선택 (챕터에서 3~5문장)
  const selectTodayPassage = useCallback((books, hero) => {
    if (!books || books.length === 0) return null;

    // 해당 영웅의 책 우선, 없으면 전체에서 선택
    const heroBooks = hero ? books.filter(b => b.heroId === hero.id) : [];
    const targetBooks = heroBooks.length > 0 ? heroBooks : books;
    const bookResult = selectByDate(targetBooks, today, 20);
    if (!bookResult) return null;

    const book = bookResult.item;
    const chapters = book.chapters || [];
    if (chapters.length === 0) return null;

    const chapterResult = selectByDate(chapters, today, 30);
    if (!chapterResult) return null;

    const chapter = chapterResult.item;
    const sentences = splitSentences(chapter.content);
    if (sentences.length === 0) return null;

    // 3~5문장 추출
    const random = createSeededRandom(getDateSeed(today) + 40);
    const count = 3 + Math.floor(random() * 3); // 3~5
    const maxStart = Math.max(0, sentences.length - count);
    const start = Math.floor(random() * (maxStart + 1));
    const passage = sentences.slice(start, start + count).join(' ');

    return {
      text: passage,
      bookTitle: book.title,
      chapterTitle: chapter.title,
      sentenceCount: Math.min(count, sentences.length)
    };
  }, [today]);

  // 오늘의 Speaking 문장 선택 (짧은 문장 1개)
  const selectTodaySentence = useCallback((books) => {
    if (!books || books.length === 0) return null;

    const bookResult = selectByDate(books, today, 100);
    if (!bookResult) return null;

    const book = bookResult.item;
    const chapters = book.chapters || [];
    if (chapters.length === 0) return null;

    const chapterResult = selectByDate(chapters, today, 110);
    if (!chapterResult) return null;

    const sentences = splitSentences(chapterResult.item.content);
    // 적당한 길이의 문장 필터 (5~20단어)
    const suitable = sentences.filter(s => {
      const wordCount = s.split(/\s+/).length;
      return wordCount >= 5 && wordCount <= 20;
    });

    if (suitable.length === 0) return null;
    const result = selectByDate(suitable, today, 120);
    return {
      text: result?.item || null,
      bookTitle: book.title
    };
  }, [today]);

  // 오늘의 대화 주제 선택
  const selectTodayTopic = useCallback((hero) => {
    if (!hero) return null;
    let topics = hero.recommended_topics;
    if (typeof topics === 'string') {
      try { topics = JSON.parse(topics); } catch { return null; }
    }
    if (!Array.isArray(topics) || topics.length === 0) return null;
    const result = selectByDate(topics, today, 200);
    return result?.item || null;
  }, [today]);

  // ==================== 미션 완료 처리 ====================

  const completeQuest = useCallback((questType, extraData = {}) => {
    const todayQuests = questData.quests[today] || getInitialDayQuests();
    if (todayQuests[questType]?.completed) return; // 이미 완료

    const updatedDay = {
      ...todayQuests,
      [questType]: {
        ...todayQuests[questType],
        completed: true,
        completedAt: new Date().toISOString(),
        ...extraData
      }
    };

    const newData = {
      ...questData,
      quests: {
        ...questData.quests,
        [today]: updatedDay
      }
    };

    saveQuestData(newData);
  }, [questData, today, saveQuestData]);

  const completeReading = useCallback(() => {
    completeQuest('reading');
  }, [completeQuest]);

  const completeSpeaking = useCallback((accuracy) => {
    completeQuest('speaking', { accuracy });
  }, [completeQuest]);

  const completeChat = useCallback((messageCount) => {
    completeQuest('chat', { messageCount });
  }, [completeQuest]);

  // Daily Chat 메시지 카운트 업데이트 (완료 전 진행률)
  const updateChatProgress = useCallback((messageCount) => {
    const todayQuests = questData.quests[today] || getInitialDayQuests();
    if (todayQuests.chat?.completed) return;

    const updatedDay = {
      ...todayQuests,
      chat: {
        ...todayQuests.chat,
        messageCount
      }
    };

    const newData = {
      ...questData,
      quests: {
        ...questData.quests,
        [today]: updatedDay
      }
    };
    saveQuestData(newData);
  }, [questData, today, saveQuestData]);

  // ==================== 조회 함수 ====================

  const isQuestCompleted = useCallback((questType) => {
    const todayQuests = getTodayQuests();
    return todayQuests[questType]?.completed || false;
  }, [getTodayQuests]);

  const getCompletionCount = useCallback(() => {
    const todayQuests = getTodayQuests();
    return Object.values(todayQuests).filter(q => q.completed).length;
  }, [getTodayQuests]);

  const isAllCompleted = useCallback(() => {
    return getCompletionCount() === 3;
  }, [getCompletionCount]);

  // Perfect Day 총 횟수
  const getPerfectDayCount = useCallback(() => {
    return Object.values(questData.quests).filter(day => {
      return day.reading?.completed && day.speaking?.completed && day.chat?.completed;
    }).length;
  }, [questData.quests]);

  // 연속 Perfect Day 계산
  const getConsecutivePerfectDays = useCallback(() => {
    let count = 0;
    const d = new Date();
    for (let i = 0; i < MAX_DAYS; i++) {
      const dateStr = d.toISOString().split('T')[0];
      const day = questData.quests[dateStr];
      if (day?.reading?.completed && day?.speaking?.completed && day?.chat?.completed) {
        count++;
      } else {
        break;
      }
      d.setDate(d.getDate() - 1);
    }
    return count;
  }, [questData.quests]);

  // 총 완료한 미션 수
  const getTotalQuestsCompleted = useCallback(() => {
    let total = 0;
    Object.values(questData.quests).forEach(day => {
      if (day.reading?.completed) total++;
      if (day.speaking?.completed) total++;
      if (day.chat?.completed) total++;
    });
    return total;
  }, [questData.quests]);

  // ==================== 데이터 관리 ====================

  const resetQuests = useCallback(() => {
    saveQuestData(getInitialState());
  }, [saveQuestData]);

  const getRawData = useCallback(() => {
    return questData;
  }, [questData]);

  const setRawData = useCallback((data) => {
    if (data && data.version) {
      saveQuestData(data);
    }
  }, [saveQuestData]);

  return {
    isLoaded,
    today,

    // 오늘의 퀘스트 상태
    todayQuests: getTodayQuests(),

    // 컨텐츠 선택
    selectTodayHero,
    selectTodayQuote,
    selectTodayPassage,
    selectTodaySentence,
    selectTodayTopic,

    // 미션 완료
    completeReading,
    completeSpeaking,
    completeChat,
    updateChatProgress,

    // 조회
    isQuestCompleted,
    getCompletionCount,
    isAllCompleted,
    getPerfectDayCount,
    getConsecutivePerfectDays,
    getTotalQuestsCompleted,
    getAllQuests: () => questData.quests,

    // 데이터 관리
    resetQuests,
    getRawData,
    setRawData
  };
};

export default useTodayQuest;
