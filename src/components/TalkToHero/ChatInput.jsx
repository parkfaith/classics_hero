import { useState, useEffect, useRef } from 'react';
import { useSTT } from '../../hooks/useSTT';
import './ChatInput.css';

const ChatInput = ({ onSendMessage, isLoading, isTTSSpeaking }) => {
  const [message, setMessage] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const textareaRef = useRef(null);
  const {
    isListening,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    clearTranscript
  } = useSTT();

  // STT 결과를 메시지에 반영
  useEffect(() => {
    if (transcript || interimTranscript) {
      setMessage(transcript + interimTranscript);
    }
  }, [transcript, interimTranscript]);

  // STT 종료 후 텍스트가 있으면 자동 전송
  useEffect(() => {
    if (!isListening && transcript.trim() && !isLoading) {
      const timer = setTimeout(() => {
        onSendMessage(transcript.trim());
        setMessage('');
        clearTranscript();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isListening, transcript, isLoading, onSendMessage, clearTranscript]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      clearTranscript();
      setMessage('');
      startListening();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (message.trim() && !isLoading) {
      if (isListening) {
        stopListening();
      }
      onSendMessage(message.trim());
      setMessage('');
      clearTranscript();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleTextInput = () => {
    setShowTextInput(!showTextInput);
    if (!showTextInput) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  };

  // TTS 재생 중이거나 로딩 중일 때는 비활성화
  const isDisabled = isLoading || isTTSSpeaking;

  return (
    <div className="chat-input-container">
      {/* STT 중심 UI */}
      {!showTextInput ? (
        <div className="voice-input-mode">
          <button
            type="button"
            className="keyboard-toggle-btn"
            onClick={toggleTextInput}
            title="키보드로 입력"
          >
            ⌨️
          </button>

          <button
            type="button"
            className={`main-mic-button ${isListening ? 'listening' : ''}`}
            onClick={handleMicClick}
            disabled={isDisabled}
            title={isListening ? '음성 인식 중지' : '눌러서 말하기'}
          >
            {isListening ? (
              <span className="mic-icon-listening">🎙️</span>
            ) : (
              <span className="mic-icon">🎤</span>
            )}
          </button>

          {message.trim() && !isListening && (
            <button
              type="button"
              className="voice-send-btn"
              onClick={handleSubmit}
              disabled={isDisabled}
              title="전송"
            >
              📤
            </button>
          )}
        </div>
      ) : (
        /* 텍스트 입력 모드 */
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <button
            type="button"
            className="mic-toggle-btn"
            onClick={toggleTextInput}
            title="음성으로 입력"
          >
            🎤
          </button>

          <textarea
            ref={textareaRef}
            className="chat-input-textarea"
            placeholder="Type your message in English..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={isDisabled}
            rows={1}
            maxLength={500}
          />

          <button
            type="submit"
            className="send-button"
            disabled={!message.trim() || isDisabled}
            title="Send message"
          >
            {isLoading ? '⏳' : '📤'}
          </button>
        </form>
      )}

      {/* STT 상태 표시 */}
      {isListening && (
        <div className="stt-status">
          <span className="stt-pulse"></span>
          <span className="stt-text">
            {message ? message : '영어로 말해보세요...'}
          </span>
        </div>
      )}

      {/* TTS 재생 중 표시 */}
      {isTTSSpeaking && (
        <div className="tts-status">
          <span className="tts-icon">🔊</span>
          <span className="tts-text">영웅이 말하고 있습니다...</span>
        </div>
      )}
    </div>
  );
};

export default ChatInput;
