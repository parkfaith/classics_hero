import { useState, useEffect } from 'react';
import { useTodayQuest } from '../../hooks/useTodayQuest';
import { useStatistics } from '../../hooks/useStatistics';
import { fetchBooks, fetchHeroes } from '../../api';
import QuestCard from './QuestCard';
import DailyReading from './DailyReading';
import DailySpeaking from './DailySpeaking';
import DailyChat from './DailyChat';
import confetti from 'canvas-confetti';
import './TodayQuest.css';

/**
 * Today's Quest 메인 컨테이너
 * - 3개 미션 카드 표시
 * - 개별 미션 화면 전환
 * - 전체 완료 시 confetti
 */
const TodayQuest = () => {
  const [books, setBooks] = useState([]);
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeQuest, setActiveQuest] = useState(null); // null | 'reading' | 'speaking' | 'chat'
  const [allCompletedShown, setAllCompletedShown] = useState(false);

  const quest = useTodayQuest();
  const { updateStreak, getCurrentStreak, recordQuestComplete, recordPerfectDay } = useStatistics();

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        const [booksData, heroesData] = await Promise.all([
          fetchBooks(),
          fetchHeroes()
        ]);
        setBooks(booksData);
        setHeroes(heroesData);
      } catch (err) {
        console.error('데이터 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // 오늘의 컨텐츠 계산
  const todayHero = quest.selectTodayHero(heroes);
  const todayQuote = quest.selectTodayQuote(todayHero);
  const todayPassage = quest.selectTodayPassage(books, todayHero);
  const todaySentence = quest.selectTodaySentence(books);
  const todayTopic = quest.selectTodayTopic(todayHero);

  // 미션 완료 핸들러
  const handleCompleteReading = () => {
    quest.completeReading();
    updateStreak();
    recordQuestComplete();
    checkAllCompleted();
  };

  const handleCompleteSpeaking = (accuracy) => {
    quest.completeSpeaking(accuracy);
    updateStreak();
    recordQuestComplete();
    checkAllCompleted();
  };

  const handleCompleteChat = (messageCount) => {
    quest.completeChat(messageCount);
    updateStreak();
    recordQuestComplete();
    checkAllCompleted();
  };

  // useEffect에서 상태 기반으로 전체 완료를 감지하므로 빈 함수
  const checkAllCompleted = () => {};

  // 전체 완료 시 confetti + Perfect Day 기록
  useEffect(() => {
    if (quest.isAllCompleted() && !allCompletedShown) {
      setAllCompletedShown(true);
      recordPerfectDay();
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#f59e0b', '#d97706', '#fbbf24', '#10b981', '#3b82f6'],
      });
    }
  }, [quest.todayQuests]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBackToList = () => {
    setActiveQuest(null);
    window.scrollTo(0, 0);
  };

  if (loading || !quest.isLoaded) {
    return (
      <div className="today-quest-loading">
        <div className="loading-spinner" />
        <p>오늘의 미션을 준비하고 있어요...</p>
      </div>
    );
  }

  // 개별 미션 화면
  if (activeQuest === 'reading') {
    return (
      <DailyReading
        hero={todayHero}
        quote={todayQuote}
        passage={todayPassage}
        completed={quest.isQuestCompleted('reading')}
        onComplete={handleCompleteReading}
        onBack={handleBackToList}
      />
    );
  }

  if (activeQuest === 'speaking') {
    return (
      <DailySpeaking
        sentence={todaySentence}
        completed={quest.isQuestCompleted('speaking')}
        onComplete={handleCompleteSpeaking}
        onBack={handleBackToList}
      />
    );
  }

  if (activeQuest === 'chat') {
    return (
      <DailyChat
        hero={todayHero}
        topic={todayTopic}
        completed={quest.isQuestCompleted('chat')}
        messageCount={quest.todayQuests.chat?.messageCount || 0}
        onComplete={handleCompleteChat}
        onUpdateProgress={quest.updateChatProgress}
        onBack={handleBackToList}
      />
    );
  }

  // 메인 미션 카드 목록
  const completionCount = quest.getCompletionCount();
  const streak = getCurrentStreak();

  return (
    <div className="today-quest">
      {/* 헤더 */}
      <div className="today-quest-header">
        <div className="quest-header-top">
          <h2 className="quest-header-title">Today's Quest</h2>
          <div className="quest-header-streak">
            <span className="streak-fire">🔥</span>
            <span className="streak-count">{streak}일째</span>
          </div>
        </div>
        <p className="quest-header-date">
          {new Date().toLocaleDateString('ko-KR', {
            month: 'long', day: 'numeric', weekday: 'long'
          })}
        </p>

        {/* 완료율 */}
        <div className="quest-progress-bar">
          <div
            className="quest-progress-fill"
            style={{ width: `${(completionCount / 3) * 100}%` }}
          />
        </div>
        <p className="quest-progress-text">
          {completionCount === 3
            ? 'Perfect Day! 오늘의 미션을 모두 완료했어요!'
            : `${completionCount}/3 완료`}
        </p>
      </div>

      {/* 미션 카드 */}
      <div className="quest-cards">
        <QuestCard
          icon="📖"
          title="Daily Reading"
          subtitle={todayHero ? `${todayHero.nameKo}의 명언 + 구절 읽기` : '구절 읽기'}
          duration="2~3분"
          completed={quest.isQuestCompleted('reading')}
          onClick={() => setActiveQuest('reading')}
        />
        <QuestCard
          icon="🎤"
          title="Daily Speaking"
          subtitle="문장 듣고 따라 말하기"
          duration="1~2분"
          completed={quest.isQuestCompleted('speaking')}
          onClick={() => setActiveQuest('speaking')}
        />
        <QuestCard
          icon="💬"
          title="Daily Chat"
          subtitle={todayHero ? `${todayHero.nameKo}와 대화하기` : '영웅과 대화하기'}
          duration="3~5분"
          completed={quest.isQuestCompleted('chat')}
          onClick={() => setActiveQuest('chat')}
        />
      </div>

      {/* Perfect Day 메시지 */}
      {quest.isAllCompleted() && (
        <div className="quest-perfect-day">
          <span className="perfect-day-icon">🌟</span>
          <div className="perfect-day-text">
            <strong>Perfect Day!</strong>
            <p>내일도 함께 공부해요!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TodayQuest;
