import { useState, useEffect } from 'react';
import './Settings.css';

const Settings = ({ onClose }) => {
  const [llmProvider, setLlmProvider] = useState('openai');
  const [openaiKey, setOpenaiKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    // 저장된 설정 불러오기
    const savedProvider = localStorage.getItem('llm_provider') || 'openai';
    const savedOpenaiKey = localStorage.getItem('openai_api_key') || '';
    const savedClaudeKey = localStorage.getItem('claude_api_key') || '';
    const savedGeminiKey = localStorage.getItem('gemini_api_key') || '';

    setLlmProvider(savedProvider);
    setOpenaiKey(savedOpenaiKey);
    setClaudeKey(savedClaudeKey);
    setGeminiKey(savedGeminiKey);
  }, []);

  const handleSave = () => {
    // LLM 제공자 저장
    localStorage.setItem('llm_provider', llmProvider);

    // API 키 저장
    if (openaiKey.trim()) {
      localStorage.setItem('openai_api_key', openaiKey.trim());
    }
    if (claudeKey.trim()) {
      localStorage.setItem('claude_api_key', claudeKey.trim());
    }
    if (geminiKey.trim()) {
      localStorage.setItem('gemini_api_key', geminiKey.trim());
    }

    setSavedMessage('✅ 설정이 저장되었습니다!');
    setTimeout(() => {
      setSavedMessage('');
    }, 3000);
  };

  const handleClearKey = (provider) => {
    switch (provider) {
      case 'openai':
        setOpenaiKey('');
        localStorage.removeItem('openai_api_key');
        break;
      case 'claude':
        setClaudeKey('');
        localStorage.removeItem('claude_api_key');
        break;
      case 'gemini':
        setGeminiKey('');
        localStorage.removeItem('gemini_api_key');
        break;
    }
  };

  const maskApiKey = (key) => {
    if (!key || key.length < 8) return key;
    return key.substring(0, 4) + '•••••••' + key.substring(key.length - 4);
  };

  const providerInfo = {
    openai: {
      name: 'OpenAI',
      description: 'GPT-4, GPT-3.5 등 OpenAI 모델 사용',
      link: 'https://platform.openai.com/api-keys',
      linkText: 'API 키 발급받기',
      emoji: '🤖'
    },
    claude: {
      name: 'Claude (Anthropic)',
      description: 'Claude 3.5 Sonnet 등 Anthropic 모델 사용 (준비 중)',
      link: 'https://console.anthropic.com/settings/keys',
      linkText: 'API 키 발급받기',
      emoji: '🧠',
      disabled: true
    },
    gemini: {
      name: 'Google Gemini',
      description: 'Gemini Pro 등 Google AI 모델 사용 (준비 중)',
      link: 'https://makersuite.google.com/app/apikey',
      linkText: 'API 키 발급받기',
      emoji: '✨',
      disabled: true
    }
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>⚙️ 설정</h2>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        <div className="settings-content">
          <section className="settings-section">
            <h3>AI 언어 모델 선택</h3>
            <p className="section-description">
              번역, 대화, 발음 분석 기능에 사용할 AI 모델을 선택하세요
            </p>

            <div className="provider-selector">
              {Object.entries(providerInfo).map(([key, info]) => (
                <label
                  key={key}
                  className={`provider-option ${llmProvider === key ? 'active' : ''} ${info.disabled ? 'disabled' : ''}`}
                >
                  <input
                    type="radio"
                    name="llm_provider"
                    value={key}
                    checked={llmProvider === key}
                    onChange={(e) => setLlmProvider(e.target.value)}
                    disabled={info.disabled}
                  />
                  <div className="provider-info">
                    <div className="provider-name">
                      <span className="provider-emoji">{info.emoji}</span>
                      {info.name}
                      {info.disabled && <span className="coming-soon">곧 지원</span>}
                    </div>
                    <p className="provider-description">{info.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <h3>API 키 관리</h3>
            <p className="section-description">
              선택한 AI 서비스의 API 키를 입력하세요. 키는 브라우저에만 안전하게 저장됩니다.
            </p>

            {/* OpenAI API Key */}
            <div className="api-key-group">
              <div className="api-key-header">
                <label>🤖 OpenAI API 키</label>
                {openaiKey && (
                  <button
                    className="clear-key-btn"
                    onClick={() => handleClearKey('openai')}
                  >
                    🗑️ 삭제
                  </button>
                )}
              </div>
              <input
                type="password"
                placeholder="sk-proj-..."
                value={openaiKey}
                onChange={(e) => setOpenaiKey(e.target.value)}
                className="api-key-input"
              />
              {openaiKey && (
                <p className="api-key-preview">
                  저장된 키: {maskApiKey(openaiKey)}
                </p>
              )}
              <a
                href={providerInfo.openai.link}
                target="_blank"
                rel="noopener noreferrer"
                className="api-key-link"
              >
                🔗 {providerInfo.openai.linkText}
              </a>
            </div>

            {/* Claude API Key (준비 중) */}
            <div className="api-key-group disabled">
              <div className="api-key-header">
                <label>🧠 Claude API 키 <span className="coming-soon-badge">곧 지원</span></label>
              </div>
              <input
                type="password"
                placeholder="sk-ant-..."
                value={claudeKey}
                onChange={(e) => setClaudeKey(e.target.value)}
                className="api-key-input"
                disabled
              />
              <p className="api-key-note">Claude API 연동은 준비 중입니다</p>
            </div>

            {/* Gemini API Key (준비 중) */}
            <div className="api-key-group disabled">
              <div className="api-key-header">
                <label>✨ Google Gemini API 키 <span className="coming-soon-badge">곧 지원</span></label>
              </div>
              <input
                type="password"
                placeholder="AIza..."
                value={geminiKey}
                onChange={(e) => setGeminiKey(e.target.value)}
                className="api-key-input"
                disabled
              />
              <p className="api-key-note">Gemini API 연동은 준비 중입니다</p>
            </div>
          </section>

          <section className="settings-section">
            <h3>💡 사용 안내</h3>
            <div className="info-box">
              <ul>
                <li>API 키는 브라우저의 로컬 스토리지에만 저장되며, 외부로 전송되지 않습니다</li>
                <li>API 사용량에 따라 과금될 수 있으니 OpenAI 대시보드에서 사용량을 확인하세요</li>
                <li>API 키가 없으면 번역, 대화, 발음 분석 기능을 사용할 수 없습니다</li>
                <li>향후 Claude, Gemini 등 다른 AI 모델도 지원할 예정입니다</li>
              </ul>
            </div>
          </section>
        </div>

        <div className="settings-footer">
          {savedMessage && (
            <div className="save-message">{savedMessage}</div>
          )}
          <div className="settings-actions">
            <button className="cancel-btn" onClick={onClose}>
              취소
            </button>
            <button className="save-btn" onClick={handleSave}>
              💾 저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
