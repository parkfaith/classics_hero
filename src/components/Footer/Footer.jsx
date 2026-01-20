import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <div className="footer-title-wrapper">
            <span className="footer-brand">Jobible</span>
            <h3 className="footer-title">Classic Heros</h3>
          </div>
          <p className="footer-description">
            저작권이 만료된 영어 고전 문학을 활용한<br />
            인터랙티브 영어 학습 플랫폼
          </p>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">학습 기능</h4>
          <ul className="footer-links">
            <li>읽기 모드</li>
            <li>말하기 연습</li>
            <li>AI 대화 학습</li>
            <li>영웅과의 대화</li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">리소스</h4>
          <ul className="footer-links">
            <li>
              <a href="https://www.gutenberg.org" target="_blank" rel="noopener noreferrer">
                Project Gutenberg
              </a>
            </li>
            <li>도서 목록</li>
            <li>사용 가이드</li>
          </ul>
        </div>

        <div className="footer-section">
          <h4 className="footer-heading">정보</h4>
          <p className="footer-info">
            본 서비스는 Project Gutenberg의<br />
            저작권 만료 도서를 활용합니다.
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copyright">
          © {currentYear} Jobible Classic Heros. All rights reserved.
        </p>
        <p className="footer-credits">
          Powered by Project Gutenberg & OpenAI
        </p>
        <p className="footer-author">
          Created by Park Jun Hyoung (Ryan Park)
        </p>
      </div>
    </footer>
  );
}

export default Footer;
