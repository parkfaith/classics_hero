import './HeroCard.css';

const HeroCard = ({ hero, onSelect }) => {
  const getDifficultyBadge = (difficulty) => {
    const badges = {
      easy: { label: 'Easy', emoji: '⭐', color: '#10b981' },
      medium: { label: 'Medium', emoji: '⭐⭐', color: '#f59e0b' },
      hard: { label: 'Hard', emoji: '⭐⭐⭐', color: '#ef4444' }
    };
    return badges[difficulty] || badges.easy;
  };

  const difficulty = getDifficultyBadge(hero.difficulty);

  return (
    <div className="hero-card" onClick={() => onSelect(hero)}>
      <div className="hero-card-avatar">
        {hero.portraitImage ? (
          <img
            src={hero.portraitImage}
            alt={hero.name}
            className="hero-avatar-image"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'inline-block';
            }}
          />
        ) : null}
        <span
          className="hero-avatar-emoji"
          style={hero.portraitImage ? { display: 'none' } : {}}
        >
          {hero.avatar}
        </span>
      </div>

      <div className="hero-card-content">
        <h3 className="hero-name">{hero.name}</h3>
        <p className="hero-name-ko">{hero.nameKo}</p>

        <div className="hero-meta">
          <span className="hero-period">{hero.period}</span>
          <span className="hero-separator">·</span>
          <span className="hero-nationality">{hero.nationalityKo}</span>
        </div>

        <div className="hero-topics">
          <p className="topics-label">💬 대화 주제:</p>
          <ul className="topics-list">
            {hero.recommendedTopics.slice(0, 2).map((topic, index) => (
              <li key={index}>{topic.titleKo}</li>
            ))}
          </ul>
        </div>

        <div className="hero-difficulty">
          <span className="difficulty-emoji">{difficulty.emoji}</span>
          <span className="difficulty-label" style={{ color: difficulty.color }}>
            {difficulty.label}
          </span>
        </div>
      </div>

      <div className="hero-card-footer">
        <button className="start-conversation-btn">
          대화 시작하기 →
        </button>
      </div>
    </div>
  );
};

export default HeroCard;
