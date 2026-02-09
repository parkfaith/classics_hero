import { useState, useCallback } from 'react';
import { useTTS } from '../../hooks/useTTS';
import { useSTT } from '../../hooks/useSTT';
import { useTranslation } from '../../hooks/useTranslation';
import './DailySpeaking.css';

// 단어 단위 정확도 계산
const calculateAccuracy = (original, spoken) => {
  if (!original || !spoken) return 0;

  const normalize = (text) =>
    text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 0);

  const origWords = normalize(original);
  const spokenWords = normalize(spoken);

  if (origWords.length === 0) return 0;

  let matches = 0;
  origWords.forEach((word, i) => {
    if (spokenWords[i] === word) matches++;
  });

  return Math.round((matches / origWords.length) * 100);
};

/**
 * Daily Speaking 미션
 * - 문장 TTS 듣기 → STT로 따라 말하기 → 정확도 비교
 */
const DailySpeaking = ({ sentence, completed, onComplete, onBack }) => {
  const [accuracy, setAccuracy] = useState(null);
  const [hasListened, setHasListened] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [sentenceTranslation, setSentenceTranslation] = useState(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const tts = useTTS();
  const stt = useSTT();
  const { translate, isTranslating } = useTranslation();

  const handleListen = () => {
    if (!sentence?.text) return;
    tts.speak(sentence.text, {
      rate: 0.85,
      onEnd: () => setHasListened(true)
    });
  };

  // 번역 토글
  const handleToggleTranslation = async () => {
    if (showTranslation) {
      setShowTranslation(false);
      return;
    }
    if (!sentenceTranslation && sentence?.text) {
      const result = await translate(sentence.text);
      if (result) setSentenceTranslation(result);
    }
    setShowTranslation(true);
  };

  const handleStartRecording = useCallback(() => {
    tts.stop();
    stt.clearTranscript();
    setAccuracy(null);
    setShowResult(false);
    stt.startListening();
  }, [tts, stt]);

  // 녹음 완료 → 결과 보기
  const handleStopAndShowResult = useCallback(() => {
    stt.stopListening();
    setTimeout(() => {
      const spoken = stt.getFullTranscript();
      if (spoken && sentence?.text) {
        const acc = calculateAccuracy(sentence.text, spoken);
        setAccuracy(acc);
        setAttempts(prev => prev + 1);
        setShowResult(true);
      }
    }, 500);
  }, [stt, sentence]);

  // 녹음 취소
  const handleCancelRecording = useCallback(() => {
    stt.stopListening();
    stt.clearTranscript();
    setAccuracy(null);
    setShowResult(false);
  }, [stt]);

  const handleComplete = () => {
    tts.stop();
    stt.stopListening();
    onComplete(accuracy || 0);
  };

  const handleRetry = () => {
    stt.clearTranscript();
    setAccuracy(null);
    setShowResult(false);
  };

  if (!sentence?.text) {
    return (
      <div className="quest-detail">
        <div className="quest-detail-header">
          <button className="quest-back-btn" onClick={onBack}>←</button>
          <h2 className="quest-detail-title">🎤 Daily Speaking</h2>
        </div>
        <div className="speaking-empty">
          <p>오늘의 문장을 불러올 수 없습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quest-detail">
      {/* 헤더 */}
      <div className="quest-detail-header">
        <button className="quest-back-btn" onClick={() => { tts.stop(); stt.stopListening(); onBack(); }}>
          ←
        </button>
        <h2 className="quest-detail-title">🎤 Daily Speaking</h2>
      </div>

      {/* 원문 표시 */}
      <div className="quest-section">
        <p className="quest-section-label">오늘의 문장</p>
        <div className="speaking-sentence-card">
          <p className="speaking-sentence-text">{sentence.text}</p>
          <p className="speaking-sentence-source">{sentence.bookTitle}</p>
          {showTranslation && sentenceTranslation && (
            <p className="speaking-translation">{sentenceTranslation}</p>
          )}
          <div className="speaking-btn-row">
            <button
              className="speaking-listen-btn"
              onClick={handleListen}
              disabled={tts.isPlaying}
            >
              {tts.isPlaying ? '🔊 재생 중...' : '🔊 원어민 발음 듣기'}
            </button>
            <button
              className="speaking-translate-btn"
              onClick={handleToggleTranslation}
              disabled={isTranslating}
            >
              {isTranslating && !sentenceTranslation ? '번역 중...' : showTranslation ? '🇰🇷 번역 숨기기' : '🇰🇷 번역하기'}
            </button>
          </div>
        </div>
      </div>

      {/* 녹음 섹션 */}
      {!completed && !showResult && (
        <div className="quest-section">
          <p className="quest-section-label">따라 말해보세요</p>
          <div className="speaking-record-area">
            {!stt.isSupported ? (
              <p className="speaking-unsupported">
                이 브라우저는 음성 인식을 지원하지 않습니다. Chrome을 사용해주세요.
              </p>
            ) : !stt.isListening ? (
              /* 녹음 시작 버튼 - 크고 직관적 */
              <button
                className="speaking-record-btn"
                onClick={handleStartRecording}
                disabled={tts.isPlaying}
              >
                <span className="record-btn-icon">🎙️</span>
                <span className="record-btn-label">녹음 시작</span>
                <span className="record-btn-hint">버튼을 누르고 문장을 따라 읽어보세요</span>
              </button>
            ) : (
              /* 녹음 중 UI */
              <div className="speaking-recording-controls">
                <div className="recording-indicator">
                  <span className="recording-dot"></span>
                  <span className="recording-label">녹음 중...</span>
                </div>

                {/* STT 실시간 표시 */}
                <div className="speaking-live-transcript">
                  <p className="live-text">
                    {stt.transcript || stt.interimTranscript || '말씀해주세요...'}
                  </p>
                </div>

                <div className="recording-actions">
                  <button
                    className="recording-cancel-btn"
                    onClick={handleCancelRecording}
                  >
                    ✕ 취소
                  </button>
                  <button
                    className="recording-done-btn"
                    onClick={handleStopAndShowResult}
                  >
                    ✓ 결과 보기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 결과 표시 */}
      {showResult && accuracy !== null && !completed && (
        <div className="quest-section">
          <p className="quest-section-label">결과</p>
          <div className="speaking-result-card">
            <div className="speaking-accuracy-display">
              <div
                className={`accuracy-circle ${
                  accuracy >= 80 ? 'accuracy-high' :
                  accuracy >= 50 ? 'accuracy-mid' : 'accuracy-low'
                }`}
              >
                <span className="accuracy-number">{accuracy}</span>
                <span className="accuracy-percent">%</span>
              </div>
              <p className="accuracy-label">
                {accuracy >= 80 ? '훌륭해요!' :
                 accuracy >= 50 ? '좋은 시도예요!' : '다시 도전해볼까요?'}
              </p>
            </div>

            <div className="speaking-transcript-compare">
              <div className="transcript-row">
                <span className="transcript-label">원문</span>
                <p className="transcript-text">{sentence.text}</p>
              </div>
              <div className="transcript-row">
                <span className="transcript-label">내 발음</span>
                <p className="transcript-text transcript-spoken">
                  {stt.transcript || '(인식 결과 없음)'}
                </p>
              </div>
            </div>

            <div className="speaking-result-actions">
              <button className="speaking-retry-btn" onClick={handleRetry}>
                🔄 다시 도전
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 완료 버튼 */}
      {completed ? (
        <div className="quest-completed-badge">✅ 발음 연습 완료!</div>
      ) : (
        <button
          className="quest-complete-btn"
          onClick={handleComplete}
          disabled={attempts === 0 && accuracy === null}
        >
          {showResult && accuracy !== null ? '완료하기' : '발음을 녹음해주세요'}
        </button>
      )}
    </div>
  );
};

export default DailySpeaking;
