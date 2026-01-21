import './HeroCard.css';

const HeroCard = ({ hero, onSelect }) => {
  const getDifficultyBadge = (difficulty) => {
    const badges = {
      easy: { label: 'Easy', color: '#10b981' },
      medium: { label: 'Medium', color: '#f59e0b' },
      hard: { label: 'Hard', color: '#ef4444' }
    };
    return badges[difficulty] || badges.easy;
  };

  const difficulty = getDifficultyBadge(hero.difficulty);

  return (
    <div className="hero-card" onClick={() => onSelect(hero)}>
      <div className="hero-card-left">
        {hero.portraitImage ? (
          <img
            src={hero.portraitImage}
            alt={hero.name}
            className="hero-avatar-image"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
        ) : null}
        <span
          className="hero-avatar-emoji"
          style={hero.portraitImage ? { display: 'none' } : {}}
        >
          {hero.avatar}
        </span>
        <span
          className="difficulty-badge"
          style={{ backgroundColor: difficulty.color }}
        >
          {difficulty.label}
        </span>
      </div>

      <div className="hero-card-right">
        <div className="hero-card-header">
          <h3 className="hero-name">{hero.nameKo}</h3>
          <span className="hero-period">{hero.period}</span>
        </div>

        <p className="hero-summary">{hero.profile?.summaryKo || ''}</p>

        <div className="hero-topics">
          {hero.recommendedTopics.slice(0, 2).map((topic, index) => (
            <span key={index} className="topic-tag">{topic.titleKo}</span>
          ))}
        </div>

        <button className="start-btn">
          대화하기 →
        </button>
      </div>
    </div>
  );
};

export default HeroCard;
