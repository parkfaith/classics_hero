import { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import './MessageBubble.css';

const MessageBubble = ({ message, hero }) => {
  const { translate, isTranslating } = useTranslation();
  const [translation, setTranslation] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const isHero = message.role === 'hero';

  const handleTranslate = async () => {
    if (translation) {
      setShowTranslation(!showTranslation);
      return;
    }

    const result = await translate(message.content, 'ko');
    if (result) {
      setTranslation(result);
      setShowTranslation(true);
    }
  };

  return (
    <div className={`message-bubble ${isHero ? 'hero-message' : 'user-message'}`}>
      {isHero && (
        <div className="message-avatar">
          {hero.portraitImage ? (
            <img src={hero.portraitImage} alt={hero.name} className="avatar-image" />
          ) : (
            <span className="avatar-emoji">{hero.avatar}</span>
          )}
        </div>
      )}

      <div className="message-content-wrapper">
        {isHero && (
          <div className="message-sender">
            <span className="sender-name">{hero.name}</span>
          </div>
        )}

        <div className="message-bubble-content">
          <p className="message-text">{message.content}</p>

          {showTranslation && translation && (
            <p className="message-translation">{translation}</p>
          )}

          <div className="message-actions">
            {isHero && (
              <button
                className="translate-btn"
                onClick={handleTranslate}
                title={showTranslation ? '번역 숨기기' : '한글로 번역'}
                disabled={isTranslating}
              >
                {isTranslating ? '⏳' : showTranslation ? '🇰🇷' : '🌐'}
              </button>
            )}

            <span className="message-time">
              {new Date(message.timestamp).toLocaleTimeString('ko-KR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
