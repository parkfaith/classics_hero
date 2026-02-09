import { useState, useEffect, useRef } from 'react';
import { useSTT } from '../../hooks/useSTT';
import './ChatInput.css';

const ChatInput = ({ onSendMessage, isLoading, isTTSSpeaking, onStopTTS, questMode = false }) => {
  const [message, setMessage] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [pendingAutoSend, setPendingAutoSend] = useState(false);
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

  // 자동 전송: STT가 끝나고 transcript가 확정되면 전송
  useEffect(() => {
    if (pendingAutoSend && !isListening && transcript.trim()) {
      const finalMessage = transcript.trim();
      onSendMessage(finalMessage);
      setMessage('');
      clearTranscript();
      setPendingAutoSend(false);
    }
  }, [pendingAutoSend, isListening, transcript, onSendMessage, clearTranscript]);

  const handleMicClick = () => {
    if (isListening) {
      setPendingAutoSend(true);
      stopListening();
    } else {
      // TTS 재생 중이면 중지하고 STT 시작
      if (isTTSSpeaking && onStopTTS) {
        onStopTTS();
      }
      setPendingAutoSend(false);
      clearTranscript();
      setMessage('');
      startListening();
    }
  };

  // 취소 버튼 - STT 결과 삭제하고 초기화
  const handleCancel = () => {
    setPendingAutoSend(false);
    if (isListening) {
      stopListening();
    }
    setMessage('');
    clearTranscript();
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();

    if (message.trim() && !isLoading) {
      if (isListening) {
        stopListening();
      }
      onSendMessage(message.trim());
      setMessage('');
      clearTranscript();
      setPendingAutoSend(false);
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

  // 로딩 중일 때만 비활성화 (TTS 중에는 마이크로 중지 가능)
  const isDisabled = isLoading;

  return (
    <div className="chat-input-container">
      {/* STT 중심 UI */}
      {!showTextInput ? (
        <div className="voice-input-mode">
          {!questMode && (
            <button
              type="button"
              className="keyboard-toggle-btn"
              onClick={toggleTextInput}
              title="키보드로 입력"
            >
              ⌨️
            </button>
          )}

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

          {/* 취소 버튼 - STT 중이거나 메시지가 있을 때 표시 */}
          {(isListening || message.trim()) && (
            <button
              type="button"
              className="voice-cancel-btn"
              onClick={handleCancel}
              disabled={isLoading}
              title="취소하고 다시 시작"
            >
              ✖️
            </button>
          )}

          {/* 전송 버튼 - STT 완료 후 메시지가 있을 때만 표시 */}
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

      {/* STT 상태 표시 - 말한 내용 전체 표시 */}
      {isListening && (
        <div className="stt-status">
          <div className="stt-indicator">
            <span className="stt-pulse"></span>
            <span className="stt-label">듣는 중</span>
          </div>
          <span className={`stt-text ${!message ? 'stt-placeholder' : ''}`}>
            {message || '영어로 말해보세요...'}
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
