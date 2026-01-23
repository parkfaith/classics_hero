import { useState } from 'react';
import './MotivationPanel.css';

const MotivationPanel = ({
  streak,
  level,
  levelProgress,
  todayProgress,
  earnedBadges,
  newBadge,
  onDismissBadge
}) => {
  const [showBadges, setShowBadges] = useState(false);

  return (
    <>
      {/* 컴팩트 동기부여 바 */}
      <div className="motivation-bar">
        {/* 스트릭 */}
        <div className="motivation-item streak" title={`${streak}일 연속 학습 중!`}>
          <span className="motivation-icon">🔥</span>
          <span className="motivation-value">{streak}</span>
        </div>

        {/* 레벨 */}
        <div className="motivation-item level" title={`${level.name} - ${levelProgress.percentage}%`}>
          <span className="motivation-icon">{level.icon}</span>
          <span className="motivation-value">Lv.{level.level}</span>
          <div className="mini-progress">
            <div
              className="mini-progress-fill"
              style={{ width: `${levelProgress.percentage}%` }}
            />
          </div>
        </div>

        {/* 오늘 목표 */}
        <div
          className={`motivation-item today ${todayProgress.isCompleted ? 'completed' : ''}`}
          title={`오늘 ${todayProgress.current}/${todayProgress.goal} 문장 연습`}
        >
          <span className="motivation-icon">{todayProgress.isCompleted ? '✅' : '📝'}</span>
          <span className="motivation-value">{todayProgress.current}/{todayProgress.goal}</span>
        </div>

        {/* 뱃지 버튼 + 패널 */}
        {earnedBadges.length > 0 && (
          <div className="badges-btn-wrapper">
            <button
              className="motivation-item badges-btn"
              onClick={() => setShowBadges(!showBadges)}
              title={`획득한 뱃지 ${earnedBadges.length}개`}
            >
              <span className="motivation-icon">🏅</span>
              <span className="motivation-value">{earnedBadges.length}</span>
            </button>

            {/* 뱃지 목록 패널 */}
            {showBadges && (
              <div className="badges-panel">
                <div className="badges-header">
                  <h4>🏅 획득한 뱃지</h4>
                  <button className="close-badges" onClick={() => setShowBadges(false)}>×</button>
                </div>
                <div className="badges-grid">
                  {earnedBadges.map(badge => (
                    <div key={badge.id} className="badge-item">
                      <span className="badge-icon">{badge.icon}</span>
                      <div className="badge-info">
                        <span className="badge-name">{badge.name}</span>
                        <span className="badge-desc">{badge.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 새 뱃지 알림 */}
      {newBadge && (
        <div className="new-badge-toast" onClick={onDismissBadge}>
          <div className="toast-content">
            <span className="toast-icon">{newBadge.icon}</span>
            <div className="toast-text">
              <span className="toast-title">🎉 새 뱃지 획득!</span>
              <span className="toast-badge-name">{newBadge.name}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MotivationPanel;
