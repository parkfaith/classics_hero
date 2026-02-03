import { useStatistics } from '../../hooks/useStatistics';
import { useProgress } from '../../hooks/useProgress';
import { useBadges } from '../../hooks/useBadges';

const DAY_LABELS = {
  mon: '월', tue: '화', wed: '수', thu: '목', fri: '금', sat: '토', sun: '일'
};

// CSS 도넛 차트 컴포넌트
const DonutChart = ({ percentage, label, color, size = 100 }) => {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="donut-chart-item">
      <svg width={size} height={size} className="donut-chart-svg">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#e5e7eb" strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x="50%" y="50%" textAnchor="middle" dy="0.35em"
          className="donut-chart-text" fill="#1f2937">
          {percentage}%
        </text>
      </svg>
      <span className="donut-chart-label">{label}</span>
    </div>
  );
};

const Statistics = ({ books }) => {
  const {
    stats,
    streak,
    getTotalStudyTime,
    getWeeklyActivity,
    getCurrentStreak,
    getLongestStreak,
  } = useStatistics();
  const { getTotalProgress } = useProgress();
  const { getUnlockedCount, getTotalCount } = useBadges();

  const weeklyActivity = getWeeklyActivity();
  const totalProgress = getTotalProgress(books || []);

  // 주간 활동 차트용 데이터
  const maxTime = Math.max(...Object.values(weeklyActivity), 1);
  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  // 시간 포맷
  const formatTime = (ms) => {
    if (ms === 0) return '0분';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    return `${minutes}분`;
  };

  return (
    <div className="statistics">
      <h2>학습 통계</h2>

      {/* 요약 카드 */}
      <div className="stats-summary-grid">
        <div className="stats-summary-item">
          <span className="summary-icon">⏱️</span>
          <span className="summary-value">{getTotalStudyTime()}</span>
          <span className="summary-label">총 학습 시간</span>
        </div>
        <div className="stats-summary-item">
          <span className="summary-icon">📝</span>
          <span className="summary-value">{(stats.totalWords || 0).toLocaleString()}</span>
          <span className="summary-label">읽은 단어</span>
        </div>
        <div className="stats-summary-item">
          <span className="summary-icon">📖</span>
          <span className="summary-value">{stats.completedChapters || 0}</span>
          <span className="summary-label">완료 챕터</span>
        </div>
        <div className="stats-summary-item">
          <span className="summary-icon">📚</span>
          <span className="summary-value">{stats.completedBooks || 0}</span>
          <span className="summary-label">완독한 책</span>
        </div>
        <div className="stats-summary-item">
          <span className="summary-icon">💬</span>
          <span className="summary-value">{stats.heroConversations || 0}</span>
          <span className="summary-label">영웅 대화</span>
        </div>
        <div className="stats-summary-item">
          <span className="summary-icon">🎤</span>
          <span className="summary-value">{stats.speakingSessions || 0}</span>
          <span className="summary-label">발음 연습</span>
        </div>
      </div>

      {/* 진행률 도넛 차트 */}
      <div className="donut-charts-section">
        <h3>목표 달성률</h3>
        <div className="donut-charts-row">
          <DonutChart
            percentage={totalProgress.overallPercentage || 0}
            label="읽기 진행률"
            color="#3b82f6"
          />
          <DonutChart
            percentage={getTotalCount() > 0 ? Math.round((getUnlockedCount() / getTotalCount()) * 100) : 0}
            label="배지 획득"
            color="#f59e0b"
          />
          <DonutChart
            percentage={totalProgress.totalBooks > 0 ? Math.round((totalProgress.completedBooks / totalProgress.totalBooks) * 100) : 0}
            label="완독률"
            color="#10b981"
          />
        </div>
      </div>

      {/* 연속 학습 */}
      <div className="streak-section">
        <h3>연속 학습</h3>
        <div className="streak-cards">
          <div className="streak-card current">
            <span className="streak-icon">🔥</span>
            <span className="streak-value">{getCurrentStreak()}</span>
            <span className="streak-label">현재 연속</span>
          </div>
          <div className="streak-card best">
            <span className="streak-icon">⭐</span>
            <span className="streak-value">{getLongestStreak()}</span>
            <span className="streak-label">최장 기록</span>
          </div>
        </div>
        {streak.lastStudyDate && (
          <p className="last-study">마지막 학습: {streak.lastStudyDate}</p>
        )}
      </div>

      {/* 주간 활동 차트 (CSS 바 차트) */}
      <div className="weekly-chart-section">
        <h3>이번 주 활동</h3>
        <div className="weekly-chart">
          {dayKeys.map(day => {
            const time = weeklyActivity[day] || 0;
            const height = maxTime > 0 ? Math.max((time / maxTime) * 100, time > 0 ? 8 : 0) : 0;
            return (
              <div key={day} className="chart-bar-wrapper">
                <div className="chart-bar-container">
                  <div
                    className={`chart-bar ${time > 0 ? 'active' : ''}`}
                    style={{ height: `${height}%` }}
                  />
                </div>
                <span className="chart-label">{DAY_LABELS[day]}</span>
                {time > 0 && (
                  <span className="chart-time">{formatTime(time)}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Statistics;
