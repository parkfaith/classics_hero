import { useState, useEffect } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onComplete }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // 2초 후 페이드아웃 시작
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2000);

    // 2.5초 후 완료 콜백
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="splash-content">
        <div className="splash-logo-container">
          <img
            src="/ClassicHero.png"
            alt="Classic Hero"
            className="splash-logo"
          />
        </div>
        <div className="splash-title-wrapper">
          <span className="splash-brand">joBible</span>
          <h1 className="splash-title">Classic Heros</h1>
        </div>
        <p className="splash-subtitle">Learn English with Timeless Literature</p>
        <div className="splash-loading">
          <div className="splash-loading-bar"></div>
        </div>
        <p className="splash-credit">made by ParkJunHyoung</p>
      </div>
    </div>
  );
};

export default SplashScreen;
