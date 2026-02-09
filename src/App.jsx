import { useState, useEffect, useCallback } from 'react';
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
import MyLearning from './components/MyLearning/MyLearning';
import TodayQuest from './components/TodayQuest/TodayQuest';
import { useStatistics } from './hooks/useStatistics';
import { useBadges } from './hooks/useBadges';
import { useProgress } from './hooks/useProgress';
import { useTodayQuest } from './hooks/useTodayQuest';
import { checkStorageWarning } from './hooks/useDataManager';
import confetti from 'canvas-confetti';
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
  const [currentPage, setCurrentPage] = useState('library'); // 'library', 'talk-to-hero', 'my-learning'
  const [books, setBooks] = useState([]);
  const [mode, setMode] = useState('reading'); // 'reading' or 'speaking'
  const [showSettings, setShowSettings] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  // 저장소 관련 알림 상태
  const [storageAlert, setStorageAlert] = useState(null); // { type: 'error' | 'warning', message: string }

  // 새 훅 연동: 통계, 배지, 진행도, 퀘스트
  const { getStatsSummary, startSession } = useStatistics();
  const { checkAchievements, newBadge, dismissNewBadge, getUnshownBadges } = useBadges();
  const { getTalkedHeroesCount } = useProgress();
  const { todayQuests, getConsecutivePerfectDays } = useTodayQuest();

  // 완료된 미션 수 계산 (todayQuests 상태 기반으로 리렌더링 트리거)
  const completedQuestCount = todayQuests
    ? Object.values(todayQuests).filter(q => q.completed).length
    : 0;

  // 앱 시작 시 세션 시작 & 미표시 배지 체크
  useEffect(() => {
    startSession();
    // 미표시된 배지가 있으면 표시
    const unshown = getUnshownBadges();
    if (unshown.length > 0) {
      setShowBadgeModal(true);
    }

    // 저장소 용량 경고 체크
    const storageStatus = checkStorageWarning();
    if (storageStatus.warning) {
      setStorageAlert({
        type: 'warning',
        message: storageStatus.message
      });
    }

    // 저장소 에러 이벤트 리스너
    const handleStorageError = (e) => {
      setStorageAlert({
        type: 'error',
        message: e.detail?.message || '데이터 저장 중 오류가 발생했습니다.'
      });
    };

    window.addEventListener('storage-error', handleStorageError);
    return () => {
      window.removeEventListener('storage-error', handleStorageError);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 배지 획득 시 confetti 효과
  useEffect(() => {
    if (newBadge) {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#d97706', '#fbbf24', '#3b82f6', '#ef4444'],
      });
    }
  }, [newBadge]);

  // 배지 조건 체크 (페이지 전환 시)
  const checkBadges = useCallback(() => {
    const stats = getStatsSummary();
    stats.talkedHeroes = getTalkedHeroesCount();
    stats.consecutivePerfectDays = getConsecutivePerfectDays();
    stats.completedQuestCount = completedQuestCount;
    checkAchievements(stats);
  }, [getStatsSummary, getTalkedHeroesCount, getConsecutivePerfectDays, completedQuestCount, checkAchievements]);

  const handleNavigate = (page) => {
    checkBadges();
    if (page === 'library') {
      setCurrentPage('library');
      setSelectedBook(null);
      setMode('reading');
    } else if (page === 'talk-to-hero') {
      setCurrentPage('talk-to-hero');
      setSelectedBook(null);
    } else if (page === 'today-quest') {
      setCurrentPage('today-quest');
      setSelectedBook(null);
    } else if (page === 'my-learning') {
      setCurrentPage('my-learning');
      setSelectedBook(null);
    }
    // 페이지 전환 시 화면 상단으로 스크롤
    window.scrollTo(0, 0);
  };

  const handleBookSelect = (book) => {
    setSelectedBook(book);
    setMode('reading');
    // 책 선택 시 화면 상단으로 스크롤
    window.scrollTo(0, 0);
  };

  const handleBackToLibrary = () => {
    checkBadges();
    setSelectedBook(null);
    setMode('reading');
    // 도서관으로 돌아갈 때 화면 상단으로 스크롤
    window.scrollTo(0, 0);
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
    // Talk to Hero에서 돌아갈 때 화면 상단으로 스크롤
    window.scrollTo(0, 0);
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
        questBadgeCount={3 - completedQuestCount}
      />

      <main className="app-main">
        {currentPage === 'today-quest' ? (
          <TodayQuest />
        ) : currentPage === 'my-learning' ? (
          <MyLearning books={books} />
        ) : currentPage === 'talk-to-hero' ? (
          <TalkToHero onBack={handleBackFromHero} />
        ) : !selectedBook ? (
          <BookList onBookSelect={handleBookSelect} onTalkToHero={handleTalkToHeroSelect} onBooksLoaded={setBooks} />
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

      {/* 저장소 용량 경고/에러 알림 */}
      {storageAlert && (
        <div className={`storage-alert ${storageAlert.type}`}>
          <div className="storage-alert-content">
            <span className="storage-alert-icon">
              {storageAlert.type === 'error' ? '⚠️' : '💾'}
            </span>
            <span className="storage-alert-message">{storageAlert.message}</span>
            <button
              className="storage-alert-action"
              onClick={() => {
                setStorageAlert(null);
                if (storageAlert.type === 'warning') {
                  // 내 학습 > 데이터 관리로 이동
                  setCurrentPage('my-learning');
                }
              }}
            >
              {storageAlert.type === 'warning' ? '백업하기' : '확인'}
            </button>
            <button
              className="storage-alert-close"
              onClick={() => setStorageAlert(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 배지 획득 알림 모달 */}
      {newBadge && (
        <div className="badge-unlock-overlay" onClick={() => { dismissNewBadge(); setShowBadgeModal(false); }}>
          <div className="badge-unlock-modal" onClick={(e) => e.stopPropagation()}>
            <div className="badge-unlock-celebration">🎉</div>
            <div className="badge-unlock-icon">{newBadge.icon}</div>
            <h2 className="badge-unlock-title">새 배지 획득!</h2>
            <h3 className="badge-unlock-name">{newBadge.nameKo}</h3>
            <p className="badge-unlock-desc">{newBadge.descriptionKo}</p>
            <button className="badge-unlock-close" onClick={() => { dismissNewBadge(); setShowBadgeModal(false); }}>
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
