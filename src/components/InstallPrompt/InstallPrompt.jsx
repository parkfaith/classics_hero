import { useState, useEffect } from 'react';
import './InstallPrompt.css';

/**
 * 홈화면 추가 안내 컴포넌트
 * PWA 설치 프롬프트를 표시
 */
function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 이미 홈화면에 추가되었는지 확인
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                                window.navigator.standalone === true;
    setIsStandalone(isInStandaloneMode);

    // iOS 기기 확인
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // 이미 설치되었거나 최근에 거부한 경우 표시하지 않음
    const installDismissed = localStorage.getItem('install-prompt-dismissed');
    if (isInStandaloneMode || installDismissed) {
      return;
    }

    // Android Chrome의 beforeinstallprompt 이벤트 처리
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // 3초 후에 프롬프트 표시
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // iOS는 자동으로 표시 (3초 후)
    if (isIOSDevice) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // 설치 버튼 클릭 (Android Chrome)
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('사용자가 홈화면 추가를 수락했습니다');
    }

    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  // 프롬프트 닫기
  const handleDismiss = () => {
    setShowPrompt(false);
    // 7일 동안 표시하지 않음
    const dismissUntil = Date.now() + (7 * 24 * 60 * 60 * 1000);
    localStorage.setItem('install-prompt-dismissed', dismissUntil);
  };

  // 이미 설치되었거나 표시하지 않을 경우
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="install-prompt-overlay">
      <div className="install-prompt-card">
        <button className="install-prompt-close" onClick={handleDismiss} aria-label="닫기">
          ✕
        </button>

        <div className="install-prompt-icon">
          <img src="/ClassicHero.png" alt="Classic Hero" />
        </div>

        <h3 className="install-prompt-title">Classic Hero 설치</h3>

        {isIOS ? (
          // iOS 안내
          <div className="install-prompt-content">
            <p className="install-prompt-description">
              홈화면에 추가하여 앱처럼 사용하세요!
            </p>
            <ol className="install-prompt-steps">
              <li>
                하단의 <span className="ios-share-icon">⎙</span> (공유) 버튼을 누르세요
              </li>
              <li>
                <strong>"홈 화면에 추가"</strong>를 선택하세요
              </li>
            </ol>
          </div>
        ) : (
          // Android Chrome 안내
          <div className="install-prompt-content">
            <p className="install-prompt-description">
              홈화면에 추가하여 앱처럼 사용하세요!
            </p>
            <button className="install-prompt-button" onClick={handleInstallClick}>
              홈화면에 추가
            </button>
          </div>
        )}

        <button className="install-prompt-later" onClick={handleDismiss}>
          나중에
        </button>
      </div>
    </div>
  );
}

export default InstallPrompt;
