import { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen/SplashScreen';
import BrowserCheck from './components/BrowserCheck/BrowserCheck';
import Navigation from './components/Navigation/Navigation';
import Footer from './components/Footer/Footer';
import BookList from './components/BookList/BookList';
import BookReader from './components/BookReader/BookReader';
import SpeakingMode from './components/SpeakingMode/SpeakingMode';
import Dictionary from './components/Dictionary/Dictionary';
import TalkToHero from './components/TalkToHero/TalkToHero';
import Settings from './components/Settings/Settings';
import InstallPrompt from './components/InstallPrompt/InstallPrompt';
import './App.css';

// 학습 데이터 마이그레이션 버전 (형식 변경 시 증가)
const LEARNING_DATA_VERSION = 2;

function App() {
  const [showSplash, setShowSplash] = useState(true);

  // 앱 시작 시 이전 형식의 학습 데이터 초기화
  useEffect(() => {
    const savedVersion = localStorage.getItem('learning-data-version');
    if (savedVersion !== String(LEARNING_DATA_VERSION)) {
      // 이전 버전 데이터 삭제
      localStorage.removeItem('learning-progress');

      // 발음 기록도 초기화
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('pronunciation-history-')) {
          localStorage.removeItem(key);
        }
      });

      // 새 버전 저장
      localStorage.setItem('learning-data-version', String(LEARNING_DATA_VERSION));
      console.log('학습 데이터가 새 형식으로 초기화되었습니다.');
    }
  }, []);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedWord, setSelectedWord] = useState(null);
  const [currentPage, setCurrentPage] = useState('library'); // 'library' or 'talk-to-hero'
  const [mode, setMode] = useState('reading'); // 'reading' or 'speaking'
  const [showSettings, setShowSettings] = useState(false);

  const handleNavigate = (page) => {
    if (page === 'library') {
      setCurrentPage('library');
      setSelectedBook(null);
      setMode('reading');
    } else if (page === 'talk-to-hero') {
      setCurrentPage('talk-to-hero');
      setSelectedBook(null);
    }
  };

  const handleBookSelect = (book) => {
    setSelectedBook(book);
    setMode('reading');
  };

  const handleBackToLibrary = () => {
    setSelectedBook(null);
    setMode('reading');
  };

  const handleWordSelect = (word) => {
    setSelectedWord(word);
  };

  const handleDictionaryClose = () => {
    setSelectedWord(null);
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
  };

  const handleTalkToHeroSelect = () => {
    setCurrentPage('talk-to-hero');
  };

  const handleBackFromHero = () => {
    setCurrentPage('library');
    setSelectedBook(null);
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="app">
      {/* Chrome 브라우저 체크 */}
      <BrowserCheck />

      <Navigation
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main className="app-main">
        {currentPage === 'talk-to-hero' ? (
          <TalkToHero onBack={handleBackFromHero} />
        ) : !selectedBook ? (
          <BookList onBookSelect={handleBookSelect} onTalkToHero={handleTalkToHeroSelect} />
        ) : mode === 'reading' ? (
          <BookReader
            book={selectedBook}
            onBack={handleBackToLibrary}
            onWordSelect={handleWordSelect}
            onSwitchToSpeaking={() => handleModeSwitch('speaking')}
          />
        ) : (
          <SpeakingMode
            book={selectedBook}
            onBack={handleBackToLibrary}
            onWordSelect={handleWordSelect}
            onSwitchToReading={() => handleModeSwitch('reading')}
          />
        )}
      </main>

      <Footer />

      {/* 홈화면 추가 프롬프트 */}
      <InstallPrompt />

      {selectedWord && (
        <Dictionary word={selectedWord} onClose={handleDictionaryClose} />
      )}

      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default App;
