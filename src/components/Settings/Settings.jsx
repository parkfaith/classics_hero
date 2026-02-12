import { GoogleLogin } from '@react-oauth/google';
import './Settings.css';

const Settings = ({ onClose, user, isLoggedIn, onLogin, onLogout, syncNow, isSyncing, lastSyncTime }) => {

  const formatSyncTime = (isoString) => {
    if (!isoString) return '없음';
    try {
      return new Date(isoString).toLocaleString('ko-KR');
    } catch {
      return '없음';
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>설정</h2>
          <button className="close-button" onClick={onClose}>x</button>
        </div>

        <div className="settings-content">
          {/* 계정 섹션 */}
          <section className="settings-section">
            <h3>계정</h3>
            {isLoggedIn && user ? (
              <div className="account-card">
                <div className="account-profile">
                  {user.picture ? (
                    <img src={user.picture} alt={user.name} className="account-avatar" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="account-avatar-placeholder">
                      {user.name?.charAt(0) || '?'}
                    </div>
                  )}
                  <div className="account-info">
                    <p className="account-name">{user.name}</p>
                    <p className="account-email">{user.email}</p>
                  </div>
                </div>
                <div className="sync-status">
                  <span className="sync-icon">&#9729;</span>
                  <span className="sync-text">
                    마지막 동기화: {formatSyncTime(lastSyncTime)}
                  </span>
                </div>
                <div className="account-actions">
                  <button
                    className="sync-btn"
                    onClick={syncNow}
                    disabled={isSyncing}
                  >
                    {isSyncing ? '동기화 중...' : '지금 동기화'}
                  </button>
                  <button className="logout-btn" onClick={onLogout}>
                    로그아웃
                  </button>
                </div>
              </div>
            ) : (
              <div className="login-section">
                <p className="login-description">
                  Google 계정으로 로그인하면 여러 기기에서 학습 데이터를 동기화할 수 있습니다.
                </p>
                <div className="google-login-wrapper">
                  <GoogleLogin
                    onSuccess={(credentialResponse) => {
                      if (credentialResponse.credential) {
                        onLogin(credentialResponse.credential);
                      }
                    }}
                    onError={() => {
                      console.error('Google 로그인 실패');
                    }}
                    text="signin_with"
                    shape="rectangular"
                    locale="ko"
                  />
                </div>
              </div>
            )}
          </section>

          <section className="settings-section">
            <h3>AI 언어 모델</h3>
            <div className="info-box">
              <p className="api-status-ok">OpenAI GPT-4o-mini 사용 중</p>
              <p className="api-note">
                서버에 설정된 API 키를 사용하여 번역, 대화, 발음 분석 기능이 제공됩니다.
              </p>
            </div>
          </section>

          <section className="settings-section">
            <h3>사용 안내</h3>
            <div className="info-box">
              <ul>
                <li>번역, 대화, 발음 분석 기능은 OpenAI API를 사용합니다</li>
                <li>Talk to Hero에서 역사적 인물과 영어로 대화할 수 있습니다</li>
                <li>Speaking Mode에서 발음 연습과 AI 피드백을 받을 수 있습니다</li>
                <li>텍스트를 클릭하면 한글 번역을 볼 수 있습니다</li>
              </ul>
            </div>
          </section>
        </div>

        <div className="settings-footer">
          <div className="settings-actions">
            <button className="save-btn" onClick={onClose}>
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
