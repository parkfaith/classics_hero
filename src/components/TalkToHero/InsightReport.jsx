import { useRef, useCallback } from 'react';
import './InsightReport.css';

const InsightReport = ({ hero, messages, onClose }) => {
  const reportRef = useRef(null);

  // 대화 통계 계산
  const getConversationStats = () => {
    const userMessages = messages.filter(m => m.role === 'user');
    const heroMessages = messages.filter(m => m.role === 'assistant');

    const totalUserWords = userMessages.reduce((acc, m) =>
      acc + m.content.split(/\s+/).length, 0);
    const avgUserWords = userMessages.length > 0
      ? Math.round(totalUserWords / userMessages.length) : 0;

    return {
      totalExchanges: userMessages.length,
      totalUserWords,
      avgUserWords,
      heroResponses: heroMessages.length,
    };
  };

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

  const stats = getConversationStats();

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
            <div className="report-hero-avatar">{hero.avatar}</div>
            <div className="report-hero-info">
              <h2 className="report-hero-name">{hero.name}</h2>
              <p className="report-hero-period">{hero.period}</p>
            </div>
          </div>

          {/* 대화 통계 */}
          <div className="report-stats">
            <h3 className="report-section-title">Conversation Statistics</h3>
            <div className="report-stats-grid">
              <div className="stat-card">
                <span className="stat-value">{stats.totalExchanges}</span>
                <span className="stat-label">Total Exchanges</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.totalUserWords}</span>
                <span className="stat-label">Words Spoken</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.avgUserWords}</span>
                <span className="stat-label">Avg Words/Message</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{stats.heroResponses}</span>
                <span className="stat-label">Hero Responses</span>
              </div>
            </div>
          </div>

          {/* 학습 인사이트 (추후 확장 예정) */}
          <div className="report-insights">
            <h3 className="report-section-title">Learning Insights</h3>
            <div className="insight-placeholder">
              <p>대화 내용을 분석하여 학습 인사이트를 제공합니다.</p>
              <p className="insight-coming-soon">Coming Soon</p>
            </div>
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
