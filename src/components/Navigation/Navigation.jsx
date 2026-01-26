import './Navigation.css';

function Navigation({ currentPage, onNavigate, onOpenSettings }) {
  return (
    <>
      {/* 모바일 상단 헤더 */}
      <header className="mobile-header" onClick={() => onNavigate('library')}>
        <img
          src="/ClassicHero.png"
          alt="Classic Hero"
          className="mobile-header-logo"
        />
        <div className="mobile-header-text">
          <span className="mobile-header-brand">Jobible</span>
          <h1 className="mobile-header-title">Classic Heros</h1>
        </div>
      </header>

      <nav className="navigation">
        <div className="nav-container">
          <div className="nav-logo" onClick={() => onNavigate('library')}>
          <img
            src="/ClassicHero.png"
            alt="Classic Hero"
            className="logo-image"
          />
          <div className="logo-text">
            <span className="logo-brand">Jobible</span>
            <h1 className="logo-title">Classic Heros</h1>
            <p className="logo-subtitle">영어 고전 학습 플랫폼</p>
          </div>
        </div>

        <div className="nav-menu">
          <button
            className={`nav-item ${currentPage === 'library' ? 'active' : ''}`}
            onClick={() => onNavigate('library')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
            <span>도서관</span>
          </button>

          <button
            className={`nav-item ${currentPage === 'talk-to-hero' ? 'active' : ''}`}
            onClick={() => onNavigate('talk-to-hero')}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
            </svg>
            <span>Talk to Hero</span>
          </button>

          <button
            className="nav-item settings-btn"
            onClick={onOpenSettings}
            title="설정"
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>설정</span>
          </button>
        </div>
      </div>
    </nav>
    </>
  );
}

export default Navigation;
