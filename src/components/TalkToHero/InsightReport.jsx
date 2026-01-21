import { useRef, useCallback, useMemo } from 'react';
import './InsightReport.css';

const InsightReport = ({ hero, messages, onClose }) => {
  const reportRef = useRef(null);

  // 대화 통계 계산
  const stats = useMemo(() => {
    const userMessages = messages.filter(m => m.role === 'user');
    const heroMessages = messages.filter(m => m.role === 'assistant');

    const totalUserWords = userMessages.reduce((acc, m) =>
      acc + m.content.split(/\s+/).filter(w => w.length > 0).length, 0);
    const avgUserWords = userMessages.length > 0
      ? Math.round(totalUserWords / userMessages.length) : 0;

    // 대화 시간 추정 (메시지당 약 30초)
    const estimatedMinutes = Math.max(1, Math.round((userMessages.length + heroMessages.length) * 0.5));

    return {
      totalExchanges: userMessages.length,
      totalUserWords,
      avgUserWords,
      heroResponses: heroMessages.length,
      estimatedMinutes,
    };
  }, [messages]);

  // 사용한 표현 분석
  const expressions = useMemo(() => {
    const userMessages = messages.filter(m => m.role === 'user');
    const allText = userMessages.map(m => m.content).join(' ').toLowerCase();

    const patterns = [
      { pattern: /i think/gi, label: 'I think...' },
      { pattern: /i believe/gi, label: 'I believe...' },
      { pattern: /what do you (think|mean)/gi, label: 'What do you think/mean...' },
      { pattern: /could you/gi, label: 'Could you...' },
      { pattern: /can you/gi, label: 'Can you...' },
      { pattern: /how (do|can|would)/gi, label: 'How do/can/would...' },
      { pattern: /why (do|did|is|are)/gi, label: 'Why...' },
      { pattern: /tell me/gi, label: 'Tell me...' },
      { pattern: /i want to/gi, label: 'I want to...' },
      { pattern: /i would like/gi, label: 'I would like...' },
      { pattern: /thank you/gi, label: 'Thank you' },
      { pattern: /that's (interesting|amazing|great)/gi, label: "That's interesting/amazing..." },
    ];

    const found = [];
    patterns.forEach(({ pattern, label }) => {
      const matches = allText.match(pattern);
      if (matches && matches.length > 0) {
        found.push({ label, count: matches.length });
      }
    });

    return found.sort((a, b) => b.count - a.count).slice(0, 5);
  }, [messages]);

  // 학습한 어휘 추출 (영웅 메시지에서 자주 사용된 단어)
  const vocabulary = useMemo(() => {
    const heroMessages = messages.filter(m => m.role === 'assistant');
    const allText = heroMessages.map(m => m.content).join(' ');

    // 고급 단어 패턴 (일반적이지 않은 단어들)
    const advancedWords = [
      // 철학/지혜
      { word: 'wisdom', meaning: '지혜' },
      { word: 'virtue', meaning: '덕, 미덕' },
      { word: 'stoic', meaning: '스토아적, 금욕적' },
      { word: 'philosophy', meaning: '철학' },
      { word: 'contemplate', meaning: '숙고하다' },
      { word: 'reflection', meaning: '성찰' },
      { word: 'discipline', meaning: '절제, 규율' },
      { word: 'prudence', meaning: '신중함' },
      { word: 'courage', meaning: '용기' },
      { word: 'integrity', meaning: '진실성' },
      // 역사/문화
      { word: 'liberty', meaning: '자유' },
      { word: 'perseverance', meaning: '인내' },
      { word: 'adversity', meaning: '역경' },
      { word: 'endeavor', meaning: '노력' },
      { word: 'legacy', meaning: '유산' },
      { word: 'principle', meaning: '원칙' },
      { word: 'morality', meaning: '도덕성' },
      { word: 'destiny', meaning: '운명' },
      { word: 'fortune', meaning: '운, 행운' },
      { word: 'cunning', meaning: '교활한' },
    ];

    const found = [];
    advancedWords.forEach(({ word, meaning }) => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      if (regex.test(allText)) {
        found.push({ word, meaning });
      }
    });

    return found.slice(0, 6);
  }, [messages]);

  // 학습 점수 계산
  const learningScore = useMemo(() => {
    let score = 0;

    // 대화 길이 점수 (최대 30점)
    score += Math.min(30, stats.totalExchanges * 5);

    // 평균 문장 길이 점수 (최대 30점)
    if (stats.avgUserWords >= 10) score += 30;
    else if (stats.avgUserWords >= 7) score += 20;
    else if (stats.avgUserWords >= 4) score += 10;

    // 표현 다양성 점수 (최대 20점)
    score += Math.min(20, expressions.length * 4);

    // 어휘 노출 점수 (최대 20점)
    score += Math.min(20, vocabulary.length * 4);

    return Math.min(100, score);
  }, [stats, expressions, vocabulary]);

  // 피드백 메시지 생성
  const feedback = useMemo(() => {
    const tips = [];

    if (stats.avgUserWords < 5) {
      tips.push('더 긴 문장으로 답변해 보세요. 영어 표현력 향상에 도움이 됩니다.');
    }
    if (stats.totalExchanges < 5) {
      tips.push('더 많은 대화를 나눠보세요. 다양한 주제로 대화를 확장해 보세요.');
    }
    if (expressions.length < 2) {
      tips.push('질문하기 표현(What, How, Why)을 더 활용해 보세요.');
    }
    if (stats.avgUserWords >= 8) {
      tips.push('긴 문장을 잘 사용하고 있습니다! 계속 이어가세요.');
    }
    if (expressions.length >= 3) {
      tips.push('다양한 표현을 활용하고 있습니다! 훌륭해요.');
    }

    return tips.slice(0, 3);
  }, [stats, expressions]);

  // 이미지로 저장
  const handleSaveAsImage = useCallback(async () => {
    if (!reportRef.current) return;

    try {
      // html2canvas 동적 로드
      const html2canvas = (await import('html2canvas')).default;

      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `classic-hero-insight-${hero.name.replace(/\s+/g, '-')}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Failed to save image:', error);
      alert('이미지 저장에 실패했습니다. 다시 시도해주세요.');
    }
  }, [hero.name]);

  return (
    <div className="insight-report-overlay" onClick={onClose}>
      <div className="insight-report-modal" onClick={e => e.stopPropagation()}>
        <div className="insight-report-content" ref={reportRef}>
          {/* 로고 헤더 */}
          <div className="report-header">
            <img
              src="/ClassicHero.png"
              alt="Classic Hero"
              className="report-logo"
            />
            <h1 className="report-title">Conversation Insight</h1>
            <p className="report-subtitle">Classic Hero Learning Report</p>
          </div>

          {/* 영웅 정보 */}
          <div className="report-hero-section">
            {hero.portraitImage ? (
              <img src={hero.portraitImage} alt={hero.name} className="report-hero-portrait" />
            ) : (
              <div className="report-hero-avatar">{hero.avatar}</div>
            )}
            <div className="report-hero-info">
              <h2 className="report-hero-name">{hero.name}</h2>
              <p className="report-hero-period">{hero.period}</p>
            </div>
            <div className="report-score-circle">
              <span className="score-value">{learningScore}</span>
              <span className="score-label">점</span>
            </div>
          </div>

          {/* 대화 통계 */}
          <div className="report-stats">
            <h3 className="report-section-title">📊 대화 통계</h3>
            <div className="report-stats-grid">
              <div className="stat-card">
                <span className="stat-value">{stats.totalExchanges}</span>
                <span className="stat-label">내 메시지</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.totalUserWords}</span>
                <span className="stat-label">사용 단어</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.avgUserWords}</span>
                <span className="stat-label">평균 단어/문장</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">~{stats.estimatedMinutes}분</span>
                <span className="stat-label">예상 학습 시간</span>
              </div>
            </div>
          </div>

          {/* 사용한 표현 */}
          {expressions.length > 0 && (
            <div className="report-expressions">
              <h3 className="report-section-title">📝 사용한 표현</h3>
              <div className="expressions-list">
                {expressions.map((expr, idx) => (
                  <div key={idx} className="expression-item">
                    <span className="expression-label">{expr.label}</span>
                    <span className="expression-count">{expr.count}회</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 학습한 어휘 */}
          {vocabulary.length > 0 && (
            <div className="report-vocabulary">
              <h3 className="report-section-title">💡 접한 어휘</h3>
              <div className="vocabulary-list">
                {vocabulary.map((v, idx) => (
                  <div key={idx} className="vocabulary-item">
                    <span className="vocab-word">{v.word}</span>
                    <span className="vocab-meaning">{v.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 학습 피드백 */}
          <div className="report-feedback">
            <h3 className="report-section-title">🎯 학습 피드백</h3>
            <ul className="feedback-list">
              {feedback.map((tip, idx) => (
                <li key={idx} className="feedback-item">{tip}</li>
              ))}
            </ul>
          </div>

          {/* 푸터 */}
          <div className="report-footer">
            <p className="report-date">
              Generated on {new Date().toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p className="report-watermark">Classic Hero - Learn English with Timeless Literature</p>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="report-actions">
          <button className="report-save-btn" onClick={handleSaveAsImage}>
            📥 이미지로 저장
          </button>
          <button className="report-close-btn" onClick={onClose}>
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};

export default InsightReport;
