import { useState } from 'react';
import HeroSelector from './HeroSelector';
import ScenarioSelector from './ScenarioSelector';
import ChatInterface from './ChatInterface';

const TalkToHero = ({ onBack }) => {
  const [selectedHero, setSelectedHero] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [view, setView] = useState('heroSelector'); // 'heroSelector', 'scenarioSelector', 'chat'

  const handleHeroSelect = (hero) => {
    setSelectedHero(hero);
    // 시나리오가 있으면 시나리오 선택 화면으로, 없으면 바로 채팅으로
    if (hero.scenarios && hero.scenarios.length > 0) {
      setView('scenarioSelector');
    } else {
      setView('chat');
    }
  };

  const handleScenarioSelect = (scenario) => {
    setSelectedScenario(scenario);
    setView('chat');
  };

  const handleSkipScenario = () => {
    setSelectedScenario(null);
    setView('chat');
  };

  const handleBackToHeroSelector = () => {
    setSelectedHero(null);
    setSelectedScenario(null);
    setView('heroSelector');
  };

  const handleBackToScenarioSelector = () => {
    setSelectedScenario(null);
    setView('scenarioSelector');
  };

  return (
    <div className="talk-to-hero">
      {view === 'heroSelector' && (
        <HeroSelector onHeroSelect={handleHeroSelect} onBack={onBack} />
      )}

      {view === 'scenarioSelector' && (
        <ScenarioSelector
          hero={selectedHero}
          onScenarioSelect={handleScenarioSelect}
          onBack={handleBackToHeroSelector}
          onSkip={handleSkipScenario}
        />
      )}

      {view === 'chat' && (
        <ChatInterface
          hero={selectedHero}
          scenario={selectedScenario}
          onBack={
            // 시나리오가 있는 영웅은 시나리오 선택으로, 없으면 영웅 선택으로
            selectedHero?.scenarios?.length > 0
              ? handleBackToScenarioSelector
              : handleBackToHeroSelector
          }
        />
      )}
    </div>
  );
};

export default TalkToHero;
