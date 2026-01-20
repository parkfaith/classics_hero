import { useState, useEffect, useCallback } from 'react';
import './PracticeSummary.css';

/**
 * 발음 연습 전체 Summary 모달
 * 챕터 완료 시 또는 사용자가 요청 시 표시
 */
const PracticeSummary = ({
  isOpen,
  onClose,
  statistics,
  chapterTitle,
  onRetryWeakSentences,
  onClearHistory
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  // TTS 기능
  const speakWord = useCallback((word) => {
    if ('speechSynthesis' in window) {
      // 기존 음성 중지
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      utterance.pitch = 1;

      window.speechSynthesis.speak(utterance);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setActiveTab('overview');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const {
    completedCount,
    totalSentences,
    completionRate,
    averageAccuracy,
    bestScore,
    worstScore,
    totalAttempts,
    incorrectWords,
    missingWords,
    records
  } = statistics;

  // 점수에 따른 등급 및 메시지
  const getGrade = (score) => {
    if (score >= 90) return { grade: 'A', emoji: '🌟', message: '훌륭해요!', color: '#10b981' };
    if (score >= 80) return { grade: 'B', emoji: '👏', message: '잘했어요!', color: '#3b82f6' };
    if (score >= 70) return { grade: 'C', emoji: '👍', message: '좋아요!', color: '#8b5cf6' };
    if (score >= 60) return { grade: 'D', emoji: '💪', message: '조금만 더!', color: '#f59e0b' };
    return { grade: 'F', emoji: '📚', message: '연습이 필요해요', color: '#ef4444' };
  };

  const gradeInfo = getGrade(averageAccuracy);

  // 약점 문장 (70점 미만)
  const weakSentences = records.filter(r => r.accuracy < 70);

  // 강점 문장 (90점 이상)
  const strongSentences = records.filter(r => r.accuracy >= 90);

  return (
    <div className="summary-overlay" onClick={onClose}>
      <div className="summary-modal" onClick={e => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="summary-header">
          <h2>연습 결과 요약</h2>
          <p className="chapter-title">{chapterTitle}</p>
          <button className="summary-close-btn" onClick={onClose}>×</button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="summary-tabs">
          <button
            className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            전체 요약
          </button>
          <button
            className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            문장별 결과
          </button>
          <button
            className={`tab-btn ${activeTab === 'words' ? 'active' : ''}`}
            onClick={() => setActiveTab('words')}
          >
            단어 분석
          </button>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="summary-content">
          {/* 전체 요약 탭 */}
          {activeTab === 'overview' && (
            <div className="overview-tab">
              {/* 메인 점수 */}
              <div className="main-score-section">
                <div
                  className="big-score-circle"
                  style={{ borderColor: gradeInfo.color }}
                >
                  <span className="score-emoji">{gradeInfo.emoji}</span>
                  <span className="score-value">{averageAccuracy}</span>
                  <span className="score-unit">점</span>
                </div>
                <div className="grade-info">
                  <span className="grade-badge" style={{ backgroundColor: gradeInfo.color }}>
                    {gradeInfo.grade}등급
                  </span>
                  <p className="grade-message">{gradeInfo.message}</p>
                </div>
              </div>

              {/* 통계 카드들 */}
              <div className="summary-stats-grid">
                <div className="summary-stat-card">
                  <span className="summary-stat-icon">📝</span>
                  <div className="summary-stat-info">
                    <span className="summary-stat-value">{completedCount} / {totalSentences}</span>
                    <span className="summary-stat-label">연습한 문장</span>
                  </div>
                </div>
                <div className="summary-stat-card">
                  <span className="summary-stat-icon">📊</span>
                  <div className="summary-stat-info">
                    <span className="summary-stat-value">{completionRate}%</span>
                    <span className="summary-stat-label">완료율</span>
                  </div>
                </div>
                <div className="summary-stat-card best">
                  <span className="summary-stat-icon">🏆</span>
                  <div className="summary-stat-info">
                    <span className="summary-stat-value">{bestScore}점</span>
                    <span className="summary-stat-label">최고 점수</span>
                  </div>
                </div>
                <div className="summary-stat-card">
                  <span className="summary-stat-icon">🔄</span>
                  <div className="summary-stat-info">
                    <span className="summary-stat-value">{totalAttempts}회</span>
                    <span className="summary-stat-label">총 시도</span>
                  </div>
                </div>
              </div>

              {/* 점수 분포 바 */}
              <div className="score-distribution">
                <h4>점수 분포</h4>
                <div className="distribution-bar">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${averageAccuracy}%`,
                      backgroundColor: gradeInfo.color
                    }}
                  />
                  <div className="bar-markers">
                    <span className="marker" style={{ left: `${worstScore}%` }}>
                      {worstScore}
                    </span>
                    <span className="marker best-marker" style={{ left: `${bestScore}%` }}>
                      {bestScore}
                    </span>
                  </div>
                </div>
                <div className="distribution-labels">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>

              {/* 약점/강점 요약 */}
              {(weakSentences.length > 0 || strongSentences.length > 0) && (
                <div className="strength-weakness">
                  {strongSentences.length > 0 && (
                    <div className="strength-box">
                      <h4>💪 강점 ({strongSentences.length}문장)</h4>
                      <p>90점 이상 달성한 문장이 {strongSentences.length}개 있어요!</p>
                    </div>
                  )}
                  {weakSentences.length > 0 && (
                    <div className="weakness-box">
                      <h4>📚 복습 필요 ({weakSentences.length}문장)</h4>
                      <p>70점 미만 문장을 다시 연습해보세요.</p>
                      {onRetryWeakSentences && (
                        <button
                          className="retry-weak-btn"
                          onClick={() => onRetryWeakSentences(weakSentences.map(s => s.sentenceIndex))}
                        >
                          약점 문장 다시 연습
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 문장별 결과 탭 */}
          {activeTab === 'details' && (
            <div className="details-tab">
              {records.length === 0 ? (
                <p className="no-data">아직 연습한 문장이 없습니다.</p>
              ) : (
                <div className="sentence-list">
                  {records.map((record, index) => (
                    <div
                      key={record.id || index}
                      className={`sentence-item ${record.accuracy >= 90 ? 'excellent' : record.accuracy < 70 ? 'weak' : ''}`}
                    >
                      <div className="sentence-header">
                        <span className="sentence-number">#{record.sentenceIndex + 1}</span>
                        <span
                          className="sentence-score"
                          style={{ color: getGrade(record.accuracy).color }}
                        >
                          {record.accuracy}점
                        </span>
                        {record.attempts > 1 && (
                          <span className="attempt-badge">{record.attempts}회 시도</span>
                        )}
                      </div>
                      <p className="sentence-text">{record.originalSentence}</p>
                      {record.spokenText && record.spokenText !== record.originalSentence && (
                        <p className="spoken-text">
                          <span className="spoken-label">인식된 발음:</span> {record.spokenText}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 단어 분석 탭 */}
          {activeTab === 'words' && (
            <div className="words-tab">
              {incorrectWords.length === 0 && missingWords.length === 0 ? (
                <div className="no-issues">
                  <span className="success-icon">🎉</span>
                  <p>모든 단어를 정확하게 발음했어요!</p>
                </div>
              ) : (
                <>
                  {incorrectWords.length > 0 && (
                    <div className="word-section incorrect-section">
                      <h4>🔴 틀린 단어 ({incorrectWords.length}개)</h4>
                      <div className="word-chips">
                        {incorrectWords.map((item, index) => (
                          <div key={index} className="word-chip incorrect">
                            <button
                              className="word-tts-btn"
                              onClick={() => speakWord(item.word)}
                              title="발음 듣기"
                            >
                              🔊
                            </button>
                            <span className="original-word">{item.word}</span>
                            <span className="arrow">→</span>
                            <span className="spoken-word">{item.spokenAs}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {missingWords.length > 0 && (
                    <div className="word-section missing-section">
                      <h4>🟡 빠진 단어 ({missingWords.length}개)</h4>
                      <div className="word-chips">
                        {missingWords.map((item, index) => (
                          <div key={index} className="word-chip missing">
                            <button
                              className="word-tts-btn"
                              onClick={() => speakWord(item.word)}
                              title="발음 듣기"
                            >
                              🔊
                            </button>
                            <span className="original-word">{item.word}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="tip-box">
                    <span className="tip-icon">💡</span>
                    <p>🔊 버튼을 눌러 원어민 발음을 듣고 따라해보세요!</p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 푸터 액션 */}
        <div className="summary-footer">
          <button className="secondary-btn" onClick={onClearHistory}>
            기록 초기화
          </button>
          <button className="primary-btn" onClick={onClose}>
            계속 연습하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default PracticeSummary;
