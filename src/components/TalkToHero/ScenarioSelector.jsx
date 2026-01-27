import { useState } from 'react';
import './ScenarioSelector.css';

const ScenarioSelector = ({ hero, onScenarioSelect, onBack, onSkip }) => {
  const [selectedScenario, setSelectedScenario] = useState(null);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return '#10b981';
      case 'medium':
        return '#f59e0b';
      case 'advanced':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getDifficultyLabel = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return '초급';
      case 'medium':
        return '중급';
      case 'advanced':
        return '고급';
      default:
        return difficulty;
    }
  };

  const handleScenarioClick = (scenario) => {
    setSelectedScenario(scenario);
  };

  const handleStart = () => {
    if (selectedScenario) {
      onScenarioSelect(selectedScenario);
    }
  };

  return (
    <div className="scenario-selector">
      <div className="scenario-header">
        <button className="back-btn" onClick={onBack}>
          ← 영웅 선택으로
        </button>
        <h1 className="scenario-title">롤플레잉 시나리오 선택</h1>
        <button className="skip-btn" onClick={onSkip}>
          자유 대화 →
        </button>
      </div>

      <div className="hero-preview">
        {hero.portraitImage ? (
          <img src={hero.portraitImage} alt={hero.name} className="hero-preview-img" />
        ) : (
          <div className="hero-preview-avatar">{hero.avatar}</div>
        )}
        <div className="hero-preview-info">
          <h2>{hero.nameKo}</h2>
          <p>{hero.profile.summaryKo}</p>
        </div>
      </div>

      <div className="scenario-intro">
        <h3>🎭 {hero.nameKo}와 함께할 특별한 시나리오를 선택하세요</h3>
        <p>
          각 시나리오는 목표가 있는 구조화된 대화입니다.
          완료하면 특별한 배지를 획득할 수 있습니다!
        </p>
      </div>

      {hero.scenarios && hero.scenarios.length > 0 ? (
        <div className="scenario-grid">
          {hero.scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className={`scenario-card ${selectedScenario?.id === scenario.id ? 'selected' : ''}`}
              onClick={() => handleScenarioClick(scenario)}
            >
              <div className="scenario-card-header">
                <span className="scenario-badge-icon">{scenario.badge.icon}</span>
                <div className="scenario-difficulty" style={{ color: getDifficultyColor(scenario.difficulty) }}>
                  {getDifficultyLabel(scenario.difficulty)}
                </div>
              </div>

              <h3 className="scenario-card-title">{scenario.titleKo}</h3>
              <p className="scenario-card-description">{scenario.descriptionKo}</p>

              <div className="scenario-meta">
                <span className="scenario-time">⏱️ {scenario.estimatedTime}</span>
              </div>

              <div className="scenario-objectives">
                <h4>학습 목표:</h4>
                <ul>
                  {scenario.objectives.slice(0, 3).map((objective, idx) => (
                    <li key={idx}>{objective}</li>
                  ))}
                </ul>
              </div>

              <div className="scenario-reward">
                <span className="reward-icon">🏆</span>
                <span>배지: {scenario.badge.nameKo}</span>
              </div>

              {selectedScenario?.id === scenario.id && (
                <div className="selected-indicator">✓ 선택됨</div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="no-scenarios">
          <p>이 영웅에게는 아직 시나리오가 없습니다.</p>
          <button className="free-chat-btn" onClick={onSkip}>
            자유 대화 시작하기
          </button>
        </div>
      )}

      {selectedScenario && (
        <div className="scenario-actions">
          <button className="start-scenario-btn" onClick={handleStart}>
            🎬 시나리오 시작하기
          </button>
        </div>
      )}
    </div>
  );
};

export default ScenarioSelector;
