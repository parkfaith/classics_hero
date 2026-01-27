import { useState, useEffect } from 'react';
import HeroCard from './HeroCard';
import { fetchHeroes } from '../../api';
import LoadingScreen from '../LoadingScreen/LoadingScreen';
import './HeroSelector.css';

const HeroSelector = ({ onHeroSelect }) => {
  const [heroes, setHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHeroes = async () => {
      try {
        setLoading(true);
        const data = await fetchHeroes();
        setHeroes(data);
        setError(null);
      } catch (err) {
        setError('영웅 목록을 불러오는데 실패했습니다.');
        console.error('Failed to fetch heroes:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHeroes();
  }, []);

  if (loading) {
    return (
      <LoadingScreen
        message="영웅들을 불러오는 중"
        subMessage={
          <>
            역사 속 위인들을 준비하고 있어요.<br />
            곧 대화를 시작할 수 있어요!
          </>
        }
        icon="🏛️"
      />
    );
  }

  if (error) {
    return (
      <div className="hero-selector">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="hero-selector">
      <header className="hero-selector-header">
        <h1>Talk to Hero</h1>
        <p>역사 속 위인과 영어로 대화해보세요</p>
      </header>

      <div className="hero-list">
        {heroes.map((hero) => (
          <HeroCard key={hero.id} hero={hero} onSelect={onHeroSelect} />
        ))}
      </div>
    </div>
  );
};

export default HeroSelector;
