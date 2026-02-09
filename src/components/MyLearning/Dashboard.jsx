import { useState, useMemo } from 'react';
import { useProgress } from '../../hooks/useProgress';
import { useStatistics } from '../../hooks/useStatistics';
import { useBadges } from '../../hooks/useBadges';
import { useTodayQuest } from '../../hooks/useTodayQuest';

// 달력 유틸리티
const pad = (n) => String(n).padStart(2, '0');
const formatDateStr = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

// 학습 강도 계산 (학습 시간 기준)
const getStudyLevel = (studyTimeMs) => {
  if (!studyTimeMs || studyTimeMs <= 0) return 0;
  const minutes = studyTimeMs / (1000 * 60);
  if (minutes >= 30) return 3;
  if (minutes >= 15) return 2;
  return 1;
};

// 퀘스트 완료 여부 (3개 모두 완료 = Perfect Day)
const isPerfectDay = (questDay) => {
  if (!questDay) return false;
  return questDay.reading?.completed && questDay.speaking?.completed && questDay.chat?.completed;
};

// 월간 달력 컴포넌트
const LearningCalendar = ({ studyDates, dailyActivity, allQuests }) => {
  const [monthOffset, setMonthOffset] = useState(0); // 0 = 이번 달, -1 = 지난 달

  const today = new Date();
  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  // 현재 표시 월
  const displayDate = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const displayYear = displayDate.getFullYear();
  const displayMonth = displayDate.getMonth();

  // 달력 그리드 데이터 생성
  const calendarDays = useMemo(() => {
    const firstDay = new Date(displayYear, displayMonth, 1).getDay(); // 0=일 ~ 6=토
    const daysInMonth = new Date(displayYear, displayMonth + 1, 0).getDate();
    const days = [];

    // 이전 달 빈 칸
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: null, dateStr: null });
    }

    // 이번 달 날짜
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDateStr(displayYear, displayMonth, d);
      const isFuture = dateStr > todayStr;
      const isStudied = studyDates.includes(dateStr);
      const activity = dailyActivity[dateStr];
      const questDay = allQuests[dateStr];
      const perfect = isPerfectDay(questDay);
      const level = isStudied ? getStudyLevel(activity?.studyTime) : 0;

      days.push({
        day: d,
        dateStr,
        isFuture,
        isToday: dateStr === todayStr,
        isStudied,
        perfect,
        level
      });
    }

    return days;
  }, [displayYear, displayMonth, todayStr, studyDates, dailyActivity, allQuests]);

  // 월간 요약 통계
  const monthlySummary = useMemo(() => {
    let studiedDays = 0;
    let perfectDays = 0;
    calendarDays.forEach(d => {
      if (d.day && d.isStudied) studiedDays++;
      if (d.day && d.perfect) perfectDays++;
    });
    return { studiedDays, perfectDays };
  }, [calendarDays]);

  const canGoNext = monthOffset < 0;
  const canGoPrev = monthOffset > -11;

  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="learning-calendar dashboard-section">
      {/* 헤더: 월 표시 + 네비게이션 */}
      <div className="calendar-header">
        <h3>학습 달력</h3>
        <div className="calendar-nav">
          <button
            className="calendar-nav-btn"
            onClick={() => setMonthOffset(prev => prev - 1)}
            disabled={!canGoPrev}
          >
            ‹
          </button>
          <span className="calendar-month-label">
            {displayYear}년 {displayMonth + 1}월
          </span>
          <button
            className="calendar-nav-btn"
            onClick={() => setMonthOffset(prev => prev + 1)}
            disabled={!canGoNext}
          >
            ›
          </button>
        </div>
      </div>

      {/* 요일 헤더 */}
      <div className="calendar-grid">
        {weekdays.map(w => (
          <div key={w} className={`calendar-weekday ${w === '일' ? 'sunday' : w === '토' ? 'saturday' : ''}`}>
            {w}
          </div>
        ))}

        {/* 날짜 셀 */}
        {calendarDays.map((d, i) => {
          if (d.day === null) {
            return <div key={`empty-${i}`} className="calendar-day empty" />;
          }

          let className = 'calendar-day';
          if (d.isFuture) className += ' future';
          else if (d.perfect) className += ' perfect';
          else if (d.isStudied) className += ` studied level-${d.level}`;
          if (d.isToday) className += ' today';

          return (
            <div key={d.dateStr} className={className}>
              <span className="calendar-day-number">{d.day}</span>
              {d.perfect && <span className="calendar-day-star">★</span>}
            </div>
          );
        })}
      </div>

      {/* 범례 + 월간 요약 */}
      <div className="calendar-footer">
        <div className="calendar-legend">
          <span className="legend-item"><span className="legend-dot"></span> 미학습</span>
          <span className="legend-item"><span className="legend-dot studied"></span> 학습</span>
          <span className="legend-item"><span className="legend-dot perfect"></span> Perfect</span>
        </div>
        <div className="calendar-summary">
          {monthlySummary.studiedDays}일 학습
          {monthlySummary.perfectDays > 0 && ` / ${monthlySummary.perfectDays}일 Perfect`}
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ books }) => {
  const { getTotalProgress, getRecentActivity } = useProgress();
  const { getTotalStudyTime, getCurrentStreak, getLongestStreak, stats, streak } = useStatistics();
  const { getUnlockedCount, getTotalCount, getUnlockedBadges } = useBadges();
  const { getAllQuests } = useTodayQuest();

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

      {/* 학습 달력 */}
      <LearningCalendar
        studyDates={streak.studyDates || []}
        dailyActivity={stats.dailyActivity || {}}
        allQuests={getAllQuests()}
      />

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
