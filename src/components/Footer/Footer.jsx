import './Footer.css';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-bottom">
        <p className="footer-copyright">
          © {currentYear} joBible Classic Heros
        </p>
        <p className="footer-credits">
          Powered by{' '}
          <a href="https://www.gutenberg.org" target="_blank" rel="noopener noreferrer">
            Project Gutenberg
          </a>
          {' & OpenAI'}
        </p>
        <p className="footer-author">
          Created by Ryan Park
        </p>
      </div>
    </footer>
  );
}

export default Footer;
