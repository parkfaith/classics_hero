import { useState, useEffect, useRef } from 'react';
import { useHeroChat } from '../../hooks/useHeroChat';
import { useTTS } from '../../hooks/useTTS';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import InsightReport from './InsightReport';
import './ChatInterface.css';

const ChatInterface = ({ hero, onBack }) => {
  const [showReport, setShowReport] = useState(false);
  const [autoTTS, setAutoTTS] = useState(true);
  const { messages, isLoading, error, sendMessage, initializeChat } = useHeroChat(hero);
  const messagesEndRef = useRef(null);
  const tts = useTTS();
  const lastMessageIdRef = useRef(null);

  // 초기 인사 메시지 생성
  useEffect(() => {
    initializeChat();
  }, [initializeChat]);

  // 새 메시지 도착 시 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 영웅 메시지 자동 TTS 재생
  useEffect(() => {
    if (!autoTTS || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'hero' && lastMessage.id !== lastMessageIdRef.current) {
      lastMessageIdRef.current = lastMessage.id;
      tts.speak(lastMessage.content, hero.ttsConfig);
    }
  }, [messages, autoTTS, hero.ttsConfig, tts]);

  return (
    <div className="chat-interface">
      <header className="chat-header">
        <div className="chat-header-inner">
          <button className="back-button-chat" onClick={onBack}>
            ← 영웅 선택
          </button>

          <div className="hero-info">
            {hero.portraitImage ? (
              <img src={hero.portraitImage} alt={hero.name} className="hero-info-avatar-img" />
            ) : (
              <span className="hero-info-avatar">{hero.avatar}</span>
            )}
            <div className="hero-info-text">
              <h2 className="hero-info-name">{hero.name}</h2>
              <p className="hero-info-occupation">
                {hero.occupation.slice(0, 2).join(' · ')}
              </p>
            </div>
          </div>

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

      <ChatInput onSendMessage={sendMessage} isLoading={isLoading} isTTSSpeaking={tts.isSpeaking} />

      {showReport && (
        <InsightReport
          hero={hero}
          messages={messages}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
};

export default ChatInterface;
