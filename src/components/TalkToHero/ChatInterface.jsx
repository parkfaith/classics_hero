import { useState, useEffect, useRef } from 'react';
import { useHeroChat } from '../../hooks/useHeroChat';
import { useTTS } from '../../hooks/useTTS';
import { useProgress } from '../../hooks/useProgress';
import { useStatistics } from '../../hooks/useStatistics';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import InsightReport from './InsightReport';
import './ChatInterface.css';

const ChatInterface = ({ hero, scenario = null, onBack, questMode = false, onQuestMessageCount = null }) => {
  const [showReport, setShowReport] = useState(false);
  const [autoTTS, setAutoTTS] = useState(true);
  const [scenarioCompleted, setScenarioCompleted] = useState(false);
  const [conversationEnded, setConversationEnded] = useState(false);
  const { messages, isLoading, error, sendMessage, initializeChat, endConversation } = useHeroChat(hero, scenario);
  const messagesEndRef = useRef(null);
  const tts = useTTS();
  const lastMessageIdRef = useRef(null);
  const { markHeroConversation } = useProgress();
  const { recordHeroConversation } = useStatistics();
  const heroConversationTrackedRef = useRef(false);

  // 초기 인사 메시지 생성
  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  // 채팅 화면에서는 모바일 헤더 숨기기
  useEffect(() => {
    document.body.classList.add('in-chat');
    return () => document.body.classList.remove('in-chat');
  }, []);

  // 새 메시지 도착 시 스크롤 (모바일 키보드 문제 방지)
  useEffect(() => {
    if (messagesEndRef.current) {
      // 약간의 지연을 주어 레이아웃 안정화 후 스크롤
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [messages]);

  // 첫 사용자 메시지 전송 시 영웅 대화 기록
  useEffect(() => {
    if (heroConversationTrackedRef.current) return;
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 1) {
      heroConversationTrackedRef.current = true;
      markHeroConversation(hero.id);
      recordHeroConversation();
    }
  }, [messages, hero.id, markHeroConversation, recordHeroConversation]);

  // Quest 모드: 사용자 메시지 수 콜백
  useEffect(() => {
    if (!questMode || !onQuestMessageCount) return;
    const userMessageCount = messages.filter(m => m.role === 'user').length;
    onQuestMessageCount(userMessageCount);
  }, [messages, questMode, onQuestMessageCount]);

  // 영웅 메시지 자동 TTS 재생
  useEffect(() => {
    if (!autoTTS || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'hero' && lastMessage.id !== lastMessageIdRef.current) {
      lastMessageIdRef.current = lastMessage.id;
      tts.speak(lastMessage.content, hero.ttsConfig);
    }
  }, [messages, autoTTS, hero.ttsConfig, tts]);

  // 대화 종료 핸들러
  const handleEndConversation = async () => {
    tts.stop();
    await endConversation();
    setConversationEnded(true);
  };

  // 시나리오 완료 체크
  useEffect(() => {
    if (!scenario || scenarioCompleted) return;

    const checkCompletion = () => {
      // 1. 메시지 수 체크
      const userMessages = messages.filter(m => m.role === 'user');
      if (userMessages.length < scenario.successCriteria.minMessages) {
        return false;
      }

      // 2. 키워드 포함 체크
      const allText = messages.map(m => m.content.toLowerCase()).join(' ');
      const keyTopics = scenario.successCriteria.keyTopics || [];
      const matchedTopics = keyTopics.filter(topic => allText.includes(topic.toLowerCase()));

      // 키워드 중 절반 이상 포함되면 완료
      const requiredMatches = Math.ceil(keyTopics.length * 0.5);
      return matchedTopics.length >= requiredMatches;
    };

    if (checkCompletion()) {
      setScenarioCompleted(true);
      // 배지를 localStorage에 저장
      const badges = JSON.parse(localStorage.getItem('earned-badges') || '[]');
      const badgeId = `${hero.id}_${scenario.id}`;
      if (!badges.some(b => b.id === badgeId)) {
        badges.push({
          id: badgeId,
          heroId: hero.id,
          scenarioId: scenario.id,
          badge: scenario.badge,
          earnedAt: new Date().toISOString()
        });
        localStorage.setItem('earned-badges', JSON.stringify(badges));
      }
    }
  }, [messages, scenario, scenarioCompleted, hero.id]);

  return (
    <div className="chat-interface">
      <header className="chat-header">
        <div className="chat-header-inner">
          <button className="back-button-chat" onClick={onBack}>
            ← {questMode ? '돌아가기' : hero.scenarios?.length > 0 ? '시나리오 선택' : '영웅 선택'}
          </button>

          <div className="hero-info">
            {hero.portraitImage ? (
              <img src={hero.portraitImage} alt={hero.name} className="hero-info-avatar-img" />
            ) : (
              <span className="hero-info-avatar">{hero.avatar}</span>
            )}
            <div className="hero-info-text">
              <h2 className="hero-info-name">{hero.name}</h2>
              {scenario ? (
                <p className="scenario-info">
                  🎭 {scenario.titleKo}
                </p>
              ) : (
                <p className="hero-info-occupation">
                  {hero.occupation.slice(0, 2).join(' · ')}
                </p>
              )}
            </div>
          </div>

          {scenario && (
            <div className="scenario-progress">
              <div className="progress-info">
                <span>{messages.filter(m => m.role === 'user').length} / {scenario.successCriteria.minMessages} 메시지</span>
                {scenarioCompleted && <span className="completed-badge">✓ 완료!</span>}
              </div>
            </div>
          )}

          <div className="chat-header-actions">
            <button
              className={`auto-tts-btn ${autoTTS ? 'active' : ''}`}
              onClick={() => setAutoTTS(!autoTTS)}
              title={autoTTS ? '자동 음성 끄기' : '자동 음성 켜기'}
            >
              {autoTTS ? '🔊' : '🔇'}
            </button>
            {messages.length > 0 && (
              <button
                className="report-btn"
                onClick={() => setShowReport(true)}
                title="대화 리포트 보기"
              >
                📊
              </button>
            )}
            <button
              className="reset-chat-btn"
              onClick={() => window.location.reload()}
              title="대화 초기화"
            >
              🔄
            </button>
          </div>
        </div>
      </header>

      <div className="chat-messages">
        <div className="chat-messages-inner">
          {error && (
            <div className="error-banner">
              <span className="error-icon">⚠️</span>
              <p className="error-text">{error}</p>
            </div>
          )}

          <div className="hero-intro-card">
            <div className="intro-left">
              {hero.portraitImage ? (
                <img
                  src={hero.portraitImage}
                  alt={hero.name}
                  className="intro-portrait"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className="intro-avatar" style={hero.portraitImage ? { display: 'none' } : {}}>{hero.avatar}</div>
            </div>
            <div className="intro-right">
              <div className="intro-header">
                <h3 className="intro-name">{hero.nameKo}</h3>
                <span className="intro-period">{hero.period}</span>
              </div>
              <p className="intro-summary">{hero.profile.summaryKo}</p>
              <div className="intro-topics">
                <p className="intro-topics-label">💬 추천 대화 주제:</p>
                <div className="intro-topics-list">
                  {hero.recommendedTopics.map((topic, index) => (
                    <button
                      key={index}
                      className="intro-topic-btn"
                      onClick={() => sendMessage(topic.questions[0])}
                      disabled={isLoading}
                    >
                      {topic.titleKo}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} hero={hero} />
          ))}

          {isLoading && (
            <div className="typing-indicator">
              <div className="typing-avatar">{hero.avatar}</div>
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {conversationEnded ? (
        <div className="chat-ended-footer">
          <p className="chat-ended-message">대화가 종료되었습니다</p>
          <button className="chat-restart-btn" onClick={onBack}>
            돌아가기
          </button>
        </div>
      ) : (
        <ChatInput
          onSendMessage={(text) => {
              // 메시지 전송 시 AudioContext 잠금 해제 (모바일 대응)
              if (window.speechSynthesis && window.speechSynthesis.resume) {
                  window.speechSynthesis.resume();
              }
              sendMessage(text);
          }}
          isLoading={isLoading}
          isTTSSpeaking={tts.isPlaying}
          onStopTTS={tts.stop}
          questMode={questMode}
          onEndConversation={handleEndConversation}
          canEndConversation={messages.filter(m => m.role === 'user').length >= 1}
        />
      )}

      {showReport && (
        <InsightReport
          hero={hero}
          messages={messages}
          onClose={() => setShowReport(false)}
        />
      )}

      {scenarioCompleted && scenario && (
        <div className="badge-modal-overlay" onClick={() => setScenarioCompleted(false)}>
          <div className="badge-modal" onClick={(e) => e.stopPropagation()}>
            <div className="badge-celebration">🎉</div>
            <div className="badge-icon-large">{scenario.badge.icon}</div>
            <h2>축하합니다!</h2>
            <h3 className="badge-name">{scenario.badge.nameKo}</h3>
            <p className="badge-description">
              "{scenario.titleKo}" 시나리오를 성공적으로 완료했습니다!
            </p>
            <div className="scenario-objectives-completed">
              <h4>달성한 목표:</h4>
              <ul>
                {scenario.objectives.map((obj, idx) => (
                  <li key={idx}>✓ {obj}</li>
                ))}
              </ul>
            </div>
            <button className="badge-close-btn" onClick={() => setScenarioCompleted(false)}>
              계속 대화하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
