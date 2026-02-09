import './TodayQuest.css';

/**
 * 개별 미션 카드 컴포넌트
 * - 완료/미완료 상태 표시
 * - 클릭 시 미션 화면으로 전환 (완료 후에도 내용 확인 가능)
 */
const QuestCard = ({ icon, title, subtitle, duration, completed, onClick }) => {
  return (
    <button
      className={`quest-card ${completed ? 'quest-card--completed' : ''}`}
      onClick={onClick}
    >
      <div className="quest-card-icon">
        {completed ? '✅' : icon}
      </div>
      <div className="quest-card-info">
        <h3 className="quest-card-title">{title}</h3>
        <p className="quest-card-subtitle">
          {completed ? '다시 보기' : subtitle}
        </p>
      </div>
      <div className="quest-card-right">
        {completed ? (
          <span className="quest-card-done">완료</span>
        ) : (
          <span className="quest-card-duration">{duration}</span>
        )}
      </div>
    </button>
  );
};

export default QuestCard;
