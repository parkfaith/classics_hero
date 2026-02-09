import { useState, useRef, useEffect } from 'react';
import { useTTS } from '../../hooks/useTTS';
import { useTranslation } from '../../hooks/useTranslation';
import './DailyReading.css';

/**
 * Daily Reading 미션
 * - 영웅 명언(워밍업) + 짧은 구절 읽기 + TTS
 * - 구절 하이라이트 + 번역 기능
 */
const DailyReading = ({ hero, quote, passage, completed, onComplete, onBack }) => {
  const [quoteListened, setQuoteListened] = useState(false);
  const [passageListened, setPassageListened] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [quoteTranslation, setQuoteTranslation] = useState(null);
  const [passageTranslation, setPassageTranslation] = useState(null);
  const [showQuoteTranslation, setShowQuoteTranslation] = useState(false);
  const [showPassageTranslation, setShowPassageTranslation] = useState(false);
  const tts = useTTS();
  const { translate, isTranslating } = useTranslation();
  const sentencesRef = useRef([]);

  // 구절을 문장 단위로 분리
  useEffect(() => {
    if (passage?.text) {
      sentencesRef.current = passage.text
        .split(/(?<=[.!?])\s+/)
        .map(s => s.trim())
        .filter(s => s.length > 0);
    }
  }, [passage?.text]);

  const handlePlayQuote = () => {
    if (!quote) return;
    tts.speak(quote, {
      rate: 0.85,
      onEnd: () => setQuoteListened(true)
    });
  };

  const handlePlayPassage = () => {
    if (!passage?.text) return;
    setHighlightIndex(0);

    // 문장별 순차 재생
    const sentences = sentencesRef.current;
    let currentIdx = 0;

    const speakNext = () => {
      if (currentIdx >= sentences.length) {
        setHighlightIndex(-1);
        setPassageListened(true);
        return;
      }
      setHighlightIndex(currentIdx);
      const idx = currentIdx;
      currentIdx++;
      tts.speak(sentences[idx], {
        rate: 0.85,
        onEnd: speakNext
      });
    };
    speakNext();
  };

  const handleStopPassage = () => {
    tts.stop();
    setHighlightIndex(-1);
  };

  // 번역 토글
  const handleToggleQuoteTranslation = async () => {
    if (showQuoteTranslation) {
      setShowQuoteTranslation(false);
      return;
    }
    if (!quoteTranslation && quote) {
      const result = await translate(quote);
      if (result) setQuoteTranslation(result);
    }
    setShowQuoteTranslation(true);
  };

  const handleTogglePassageTranslation = async () => {
    if (showPassageTranslation) {
      setShowPassageTranslation(false);
      return;
    }
    if (!passageTranslation && passage?.text) {
      const result = await translate(passage.text);
      if (result) setPassageTranslation(result);
    }
    setShowPassageTranslation(true);
  };

  const handleComplete = () => {
    tts.stop();
    onComplete();
  };

  return (
    <div className="quest-detail">
      {/* 헤더 */}
      <div className="quest-detail-header">
        <button className="quest-back-btn" onClick={() => { tts.stop(); onBack(); }}>
          <span className="back-arrow">←</span>
          <span className="back-label">Today's Quest</span>
        </button>
        <h2 className="quest-detail-title">📖 Daily Reading</h2>
      </div>

      {/* 영웅 명언 섹션 */}
      {hero && quote && (
        <div className="quest-section">
          <p className="quest-section-label">오늘의 명언</p>
          <div className="reading-quote-card">
            {hero.portrait_image && (
              <img
                src={hero.portrait_image}
                alt={hero.nameKo}
                className="reading-hero-avatar"
              />
            )}
            <div className="reading-quote-content">
              <p className="reading-quote-name">{hero.nameKo}</p>
              <blockquote className="reading-quote-text">
                &ldquo;{quote}&rdquo;
              </blockquote>
              {showQuoteTranslation && quoteTranslation && (
                <p className="reading-translation">{quoteTranslation}</p>
              )}
              <div className="reading-btn-row">
                <button
                  className="reading-listen-btn"
                  onClick={handlePlayQuote}
                  disabled={tts.isPlaying}
                >
                  {tts.isPlaying && !passageListened ? '🔊 재생 중...' : '🔊 들어보기'}
                </button>
                <button
                  className="reading-translate-btn"
                  onClick={handleToggleQuoteTranslation}
                  disabled={isTranslating}
                >
                  {isTranslating && !quoteTranslation ? '번역 중...' : showQuoteTranslation ? '🇰🇷 번역 숨기기' : '🇰🇷 번역하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 구절 읽기 섹션 */}
      {passage && (
        <div className="quest-section">
          <p className="quest-section-label">오늘의 구절</p>
          <div className="reading-passage-card">
            <div className="reading-passage-meta">
              <span className="reading-passage-book">{passage.bookTitle}</span>
              {passage.chapterTitle && (
                <span className="reading-passage-chapter">{passage.chapterTitle}</span>
              )}
            </div>
            {/* 구절 설명 */}
            <p className="reading-passage-desc">
              {hero
                ? `「${passage.bookTitle}」에서 발췌한 구절입니다. 천천히 읽어보세요.`
                : `「${passage.bookTitle}」에서 발췌한 구절입니다.`}
            </p>
            {/* 문장별 하이라이트 표시 */}
            <div className="reading-passage-text">
              {sentencesRef.current.length > 0
                ? sentencesRef.current.map((sentence, i) => (
                    <span
                      key={i}
                      className={`reading-sentence ${highlightIndex === i ? 'highlight' : ''}`}
                    >
                      {sentence}{' '}
                    </span>
                  ))
                : passage.text
              }
            </div>
            {showPassageTranslation && passageTranslation && (
              <p className="reading-translation passage">{passageTranslation}</p>
            )}
            <div className="reading-btn-row">
              {highlightIndex >= 0 ? (
                <button className="reading-listen-btn stop" onClick={handleStopPassage}>
                  ⏹ 정지
                </button>
              ) : (
                <button
                  className="reading-listen-btn"
                  onClick={handlePlayPassage}
                  disabled={tts.isPlaying}
                >
                  🔊 구절 듣기
                </button>
              )}
              <button
                className="reading-translate-btn"
                onClick={handleTogglePassageTranslation}
                disabled={isTranslating}
              >
                {isTranslating && !passageTranslation ? '번역 중...' : showPassageTranslation ? '🇰🇷 번역 숨기기' : '🇰🇷 번역하기'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 데이터가 없는 경우 */}
      {!passage && !quote && (
        <div className="reading-empty">
          <p>오늘의 읽기 자료를 불러올 수 없습니다.</p>
          <p>잠시 후 다시 시도해주세요.</p>
        </div>
      )}

      {/* 완료 버튼 */}
      {completed ? (
        <div className="quest-completed-badge">✅ 읽기 미션 완료!</div>
      ) : (
        <button
          className="quest-complete-btn"
          onClick={handleComplete}
        >
          읽었어요
        </button>
      )}
    </div>
  );
};

export default DailyReading;
