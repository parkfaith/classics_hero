import { useState, useEffect } from 'react';
import './BrowserCheck.css';

/**
 * Chrome 브라우저 체크 컴포넌트
 * Android에서 Chrome이 아닌 경우 설치 안내
 */
function BrowserCheck() {
  const [showWarning, setShowWarning] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();

    // Android 기기 확인
    const isAndroidDevice = /android/.test(userAgent);
    setIsAndroid(isAndroidDevice);

    // iOS는 모든 브라우저가 WebKit을 사용하므로 체크 불필요
    if (!isAndroidDevice) {
      return;
    }

    // Chrome 브라우저 확인
    const isChrome = /chrome/.test(userAgent) && !/edg/.test(userAgent) && !/opr/.test(userAgent);

    // Chrome이 아니고, 이전에 경고를 닫지 않았다면 표시
    if (!isChrome) {
      const dismissed = sessionStorage.getItem('browser-warning-dismissed');
      if (!dismissed) {
        setShowWarning(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setShowWarning(false);
    sessionStorage.setItem('browser-warning-dismissed', 'true');
  };

  const handleInstallChrome = () => {
    // Chrome 다운로드 페이지로 이동
    window.open('https://play.google.com/store/apps/details?id=com.android.chrome', '_blank');
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div className="browser-check-overlay">
      <div className="browser-check-card">
        <div className="browser-check-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8V12L14.5 14.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>

        <h3 className="browser-check-title">Chrome 브라우저 권장</h3>

        <div className="browser-check-content">
          <p className="browser-check-description">
            이 앱은 <strong>Chrome 브라우저</strong>에서 최적화되어 있습니다.
          </p>

          <div className="browser-check-features">
            <div className="browser-check-feature">
              <span className="feature-icon">🎤</span>
              <span>음성 인식 (STT)</span>
            </div>
            <div className="browser-check-feature">
              <span className="feature-icon">🔊</span>
              <span>텍스트 음성 변환 (TTS)</span>
            </div>
            <div className="browser-check-feature">
              <span className="feature-icon">📱</span>
              <span>홈화면 추가 (PWA)</span>
            </div>
          </div>

          <p className="browser-check-note">
            최상의 경험을 위해 Chrome 브라우저를 설치하고 이 페이지를 다시 열어주세요.
          </p>
        </div>

        <div className="browser-check-actions">
          <button
            className="browser-check-primary-btn"
            onClick={handleInstallChrome}
          >
            Chrome 설치하기
          </button>
          <button
            className="browser-check-secondary-btn"
            onClick={handleDismiss}
          >
            계속 진행
          </button>
        </div>
      </div>
    </div>
  );
}

export default BrowserCheck;
