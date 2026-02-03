import { useProgress } from '../../hooks/useProgress';
import { useStatistics } from '../../hooks/useStatistics';
import { useBadges } from '../../hooks/useBadges';

const Dashboard = ({ books }) => {
  const { getTotalProgress, getRecentActivity } = useProgress();
  const { getTotalStudyTime, getCurrentStreak, getLongestStreak, stats } = useStatistics();
  const { getUnlockedCount, getTotalCount, getUnlockedBadges } = useBadges();

  const totalProgress = getTotalProgress(books || []);
  const recentActivity = getRecentActivity();
  const unlockedBadges = getUnlockedBadges();
  const recentBadges = unlockedBadges.slice(-3).reverse();

  // 최근 읽은 책 정보
  const recentBook = recentActivity && books
    ? books.find(b => String(b.id) === String(recentActivity.bookId))
    : null;

  return (
    <div className="dashboard">
      {/* 환영 메시지 */}
      <div className="dashboard-welcome">
        <h2>학습 현황</h2>
        <p>꾸준히 학습하고 있어요!</p>
      </div>

      {/* 핵심 통계 카드 */}
      <div className="stats-cards">
        <div className="stat-card">
          <span className="stat-card-icon">⏱️</span>
          <div className="stat-card-info">
            <span className="stat-card-value">{getTotalStudyTime()}</span>
            <span className="stat-card-label">총 학습 시간</span>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-card-icon">🔥</span>
          <div className="stat-card-info">
            <span className="stat-card-value">{getCurrentStreak()}일</span>
            <span className="stat-card-label">연속 학습</span>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-card-icon">📖</span>
          <div className="stat-card-info">
            <span className="stat-card-value">{totalProgress.completedChapters}</span>
            <span className="stat-card-label">완료 챕터</span>
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-card-icon">📝</span>
          <div className="stat-card-info">
            <span className="stat-card-value">{(stats.totalWords || 0).toLocaleString()}</span>
            <span className="stat-card-label">읽은 단어</span>
          </div>
        </div>
      </div>

      {/* 진행률 요약 */}
      <div className="dashboard-section">
        <h3>전체 진행률</h3>
        <div className="progress-overview">
          <div className="progress-bar-large">
            <div
              className="progress-fill-large"
              style={{ width: `${totalProgress.overallPercentage}%` }}
            />
          </div>
          <div className="progress-details">
            <span>{totalProgress.completedChapters}/{totalProgress.totalChapters} 챕터</span>
            <span>{totalProgress.completedBooks}/{totalProgress.totalBooks} 완독</span>
            <span className="progress-percent">{totalProgress.overallPercentage}%</span>
          </div>
        </div>
      </div>

      {/* 이어 읽기 */}
      {recentBook && (
        <div className="dashboard-section">
          <h3>이어 읽기</h3>
          <div className="recent-book-card">
            <div className="recent-book-cover" style={{ background: recentBook.coverColor || '#3b82f6' }}>
              {recentBook.coverImage ? (
                <img src={recentBook.coverImage} alt={recentBook.title} onError={(e) => { e.target.style.display = 'none'; }} />
              ) : (
                <span className="recent-book-initial">{recentBook.title?.charAt(0)}</span>
              )}
            </div>
            <div className="recent-book-info">
              <h4>{recentBook.title}</h4>
              <p>{recentBook.author}</p>
              <span className="recent-chapter">챕터 {(recentActivity.lastChapterIndex || 0) + 1}</span>
            </div>
          </div>
        </div>
      )}

      {/* 배지 미리보기 */}
      <div className="dashboard-section">
        <h3>배지 ({getUnlockedCount()}/{getTotalCount()})</h3>
        {recentBadges.length > 0 ? (
          <div className="badge-preview">
            {recentBadges.map(badge => (
              <div key={badge.id} className="badge-preview-item">
                <span className="badge-preview-icon">{badge.icon}</span>
                <span className="badge-preview-name">{badge.nameKo}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-message">아직 획득한 배지가 없습니다. 학습을 시작해보세요!</p>
        )}
      </div>

      {/* 추가 통계 */}
      <div className="dashboard-section">
        <h3>기록</h3>
        <div className="record-list">
          <div className="record-item">
            <span className="record-label">최장 연속 학습</span>
            <span className="record-value">{getLongestStreak()}일</span>
          </div>
          <div className="record-item">
            <span className="record-label">영웅 대화</span>
            <span className="record-value">{stats.heroConversations}회</span>
          </div>
          <div className="record-item">
            <span className="record-label">발음 연습</span>
            <span className="record-value">{stats.speakingSessions}회</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
