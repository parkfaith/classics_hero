import { useState } from 'react';
import HeroSelector from './HeroSelector';
import ChatInterface from './ChatInterface';

const TalkToHero = ({ onBack }) => {
  const [selectedHero, setSelectedHero] = useState(null);

  const handleHeroSelect = (hero) => {
    setSelectedHero(hero);
  };

  const handleBackToSelector = () => {
    setSelectedHero(null);
  };

  return (
    <div className="talk-to-hero">
      {!selectedHero ? (
        <HeroSelector onHeroSelect={handleHeroSelect} onBack={onBack} />
      ) : (
        <ChatInterface hero={selectedHero} onBack={handleBackToSelector} />
      )}
    </div>
  );
};

export default TalkToHero;
