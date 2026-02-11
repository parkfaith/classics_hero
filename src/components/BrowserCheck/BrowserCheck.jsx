import { useState, useEffect } from 'react';
import './BrowserCheck.css';

/**
 * Chrome 브라우저 체크 컴포넌트
 * Android에서 Chrome이 아닌 경우 설치 안내
 */
function BrowserCheck() {
  // 초기 상태 로직을 useState 초기화 함수로 이동
  const [isAndroid] = useState(() => /android/i.test(navigator.userAgent));
  
  const [showWarning, setShowWarning] = useState(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // PC/Mac 등 모바일이 아닌 경우 체크 건너뛰기 (여기서는 간단히 터치 포인트와 문맥으로 판단)
    // 실제로는 더 복잡할 수 있으나, 기존 로직 유지
    const isAndroidDevice = /android/.test(userAgent);
    const isIOSDevice = (/ipad|iphone|ipod/.test(userAgent) && !window.MSStream) ||
      (navigator.maxTouchPoints > 1 && /macintosh/.test(userAgent));

    if (!isAndroidDevice && !isIOSDevice) return false;

    // Chrome 체크
    const isChrome = isAndroidDevice
      ? (/chrome/.test(userAgent) && !/edg/.test(userAgent) && !/opr/.test(userAgent))
      : /crios/.test(userAgent);

    if (!isChrome) {
      const dismissed = localStorage.getItem('browser-warning-dismissed');
      return !dismissed;
    }
    return false;
  });

  useEffect(() => {
    // 필요한 경우 추가적인 사이드 이펙트 처리
  }, []);

  const handleDismiss = () => {
    setShowWarning(false);
    localStorage.setItem('browser-warning-dismissed', 'true');
  };

  const handleInstallChrome = () => {
    // Chrome 다운로드 페이지로 이동
    const chromeUrl = isAndroid
      ? 'https://play.google.com/store/apps/details?id=com.android.chrome'
      : 'https://apps.apple.com/app/google-chrome/id535886823';
    window.open(chromeUrl, '_blank');
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
              <span className="feature-icon">💬</span>
              <span>영웅과 음성 대화</span>
            </div>
          </div>

          <p className="browser-check-note">
            {isAndroid
              ? '최상의 경험을 위해 Chrome 브라우저를 설치하고 이 페이지를 다시 열어주세요.'
              : 'Safari는 음성 인식 기능을 지원하지 않습니다. Chrome 브라우저를 설치하고 이 페이지를 다시 열어주세요.'
            }
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
