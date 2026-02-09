import { useState, useCallback } from 'react';
import ChatInterface from '../TalkToHero/ChatInterface';
import './DailyChat.css';

const REQUIRED_MESSAGES = 3;

/**
 * Daily Chat 미션
 * - 오늘의 영웅 + 대화 주제 제시
 * - ChatInterface 재활용하여 3회 이상 대화 시 완료
 */
const DailyChat = ({ hero, topic, completed, messageCount, onComplete, onUpdateProgress, onBack }) => {
  const [chatStarted, setChatStarted] = useState(false);
  const [currentMessageCount, setCurrentMessageCount] = useState(messageCount);
  const [questCompleted, setQuestCompleted] = useState(completed);

  // Quest 모드 메시지 카운트 콜백
  const handleQuestMessageCount = useCallback((count) => {
    setCurrentMessageCount(count);
    onUpdateProgress(count);

    // 3회 이상 대화 시 자동 완료
    if (count >= REQUIRED_MESSAGES && !questCompleted) {
      setQuestCompleted(true);
      onComplete(count);
    }
  }, [onUpdateProgress, onComplete, questCompleted]);

  const handleBackFromChat = () => {
    setChatStarted(false);
  };

  // 데이터가 없는 경우
  if (!hero) {
    return (
      <div className="quest-detail">
        <div className="quest-detail-header">
          <button className="quest-back-btn" onClick={onBack}>←</button>
          <h2 className="quest-detail-title">💬 Daily Chat</h2>
        </div>
        <div className="chat-quest-empty">
          <p>오늘의 영웅을 불러올 수 없습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }

  // 대화 화면 (ChatInterface)
  if (chatStarted) {
    return (
      <div className="daily-chat-wrapper">
        {/* Quest 진행률 오버레이 */}
        <div className="chat-quest-progress-bar">
          <div className="chat-quest-progress-info">
            <span>💬 {Math.min(currentMessageCount, REQUIRED_MESSAGES)}/{REQUIRED_MESSAGES} 대화</span>
            {questCompleted && <span className="chat-quest-done">미션 완료!</span>}
          </div>
          <div className="chat-quest-progress-track">
            <div
              className="chat-quest-progress-fill"
              style={{ width: `${Math.min((currentMessageCount / REQUIRED_MESSAGES) * 100, 100)}%` }}
            />
          </div>
        </div>

        <ChatInterface
          hero={hero}
          onBack={handleBackFromChat}
          questMode={true}
          onQuestMessageCount={handleQuestMessageCount}
        />
      </div>
    );
  }

  // 미션 소개 화면
  return (
    <div className="quest-detail">
      {/* 헤더 */}
      <div className="quest-detail-header">
        <button className="quest-back-btn" onClick={onBack}>←</button>
        <h2 className="quest-detail-title">💬 Daily Chat</h2>
      </div>

      {/* 영웅 소개 */}
      <div className="quest-section">
        <p className="quest-section-label">오늘의 영웅</p>
        <div className="chat-hero-card">
          {hero.portraitImage && (
            <img
              src={hero.portraitImage}
              alt={hero.nameKo}
              className="chat-hero-portrait"
            />
          )}
          <div className="chat-hero-info">
            <h3 className="chat-hero-name">{hero.nameKo}</h3>
            <p className="chat-hero-period">{hero.period}</p>
            <p className="chat-hero-summary">
              {hero.profile?.summaryKo || hero.summary_ko}
            </p>
          </div>
        </div>
      </div>

      {/* 대화 주제 */}
      {topic && (
        <div className="quest-section">
          <p className="quest-section-label">추천 대화 주제</p>
          <div className="chat-topic-card">
            <h4 className="chat-topic-title">{topic.titleKo}</h4>
            {topic.questions && (
              <ul className="chat-topic-questions">
                {topic.questions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* 미션 안내 */}
      <div className="quest-section">
        <div className="chat-mission-info">
          <span className="mission-info-icon">💡</span>
          <p>영웅과 <strong>{REQUIRED_MESSAGES}번 이상</strong> 대화하면 미션이 완료됩니다.</p>
        </div>
      </div>

      {/* 완료/시작 버튼 */}
      {completed || questCompleted ? (
        <div className="quest-completed-badge">✅ 대화 미션 완료!</div>
      ) : (
        <button
          className="quest-complete-btn"
          onClick={() => setChatStarted(true)}
        >
          대화 시작하기
        </button>
      )}
    </div>
  );
};

export default DailyChat;
