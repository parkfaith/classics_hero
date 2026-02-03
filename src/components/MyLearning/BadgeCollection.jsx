import { useBadges } from '../../hooks/useBadges';
import { useStatistics } from '../../hooks/useStatistics';
import { useProgress } from '../../hooks/useProgress';

const BadgeCollection = () => {
  const { getAllBadges, getUnlockedCount, getTotalCount } = useBadges();
  const { getStatsSummary } = useStatistics();
  const { getTalkedHeroesCount } = useProgress();

  const stats = {
    ...getStatsSummary(),
    talkedHeroes: getTalkedHeroesCount(),
  };

  const allBadges = getAllBadges(stats);
  const unlockedCount = getUnlockedCount();
  const totalCount = getTotalCount();

  return (
    <div className="badge-collection">
      <div className="badge-collection-header">
        <h2>배지 컬렉션</h2>
        <span className="badge-count">{unlockedCount}/{totalCount} 획득</span>
      </div>

      <div className="badge-progress-bar">
        <div
          className="badge-progress-fill"
          style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
        />
      </div>

      <div className="badges-grid">
        {allBadges.map(badge => (
          <div
            key={badge.id}
            className={`badge-card ${badge.unlocked ? 'unlocked' : 'locked'}`}
          >
            <div className="badge-icon-wrapper">
              <span className="badge-icon">{badge.unlocked ? badge.icon : '🔒'}</span>
            </div>
            <h4 className="badge-name">{badge.nameKo}</h4>
            <p className="badge-desc">{badge.descriptionKo}</p>

            {badge.unlocked ? (
              <span className="badge-date">
                {new Date(badge.unlockedAt).toLocaleDateString('ko-KR')} 획득
              </span>
            ) : (
              <div className="badge-progress">
                <div className="badge-progress-mini">
                  <div
                    className="badge-progress-mini-fill"
                    style={{ width: `${badge.progressPercent}%` }}
                  />
                </div>
                <span className="badge-progress-text">
                  {badge.progress.current}/{badge.progress.target}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BadgeCollection;
