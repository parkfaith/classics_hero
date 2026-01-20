import { useState, useEffect } from 'react';
import HeroCard from './HeroCard';
import { fetchHeroes } from '../../api';
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
      <div className="hero-selector">
        <div className="loading">영웅 목록을 불러오는 중...</div>
      </div>
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
        <div className="hero-selector-title">
          <h1>Talk to the Hero</h1>
          <p className="hero-selector-subtitle">
            역사 속 위대한 영웅들과 영어로 대화하며 배워보세요
          </p>
        </div>
      </header>

      <div className="hero-grid">
        {heroes.map((hero) => (
          <HeroCard key={hero.id} hero={hero} onSelect={onHeroSelect} />
        ))}
      </div>

      <div className="hero-selector-tip">
        <span className="tip-icon">💡</span>
        <p>난이도별로 영웅을 선택해보세요. Easy는 기본적인 대화, Medium은 중급 수준의 대화, Advanced는 고급 주제를 다룹니다.</p>
      </div>
    </div>
  );
};

export default HeroSelector;
