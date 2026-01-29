import './Settings.css';

const Settings = ({ onClose }) => {
  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>설정</h2>
          <button className="close-button" onClick={onClose}>x</button>
        </div>

        <div className="settings-content">
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
