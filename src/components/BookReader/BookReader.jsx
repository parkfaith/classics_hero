import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useLearningProgress } from '../../hooks/useLearningProgress';
import { useVocabularyExtraction } from '../../hooks/useVocabularyExtraction';
import './BookReader.css';

// 기본 책 아이콘 컴포넌트
const DefaultBookIcon = () => (
  <svg viewBox="0 0 24 24" fill="white" className="book-icon">
    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
  </svg>
);

const BookReader = ({ book, onBack, onWordSelect, onSwitchToSpeaking }) => {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [bookmarks, setBookmarks] = useState([]);
  const [fontSize, setFontSize] = useState(18);
  const [showTranslation, setShowTranslation] = useState(false);
  const [chapterTranslation, setChapterTranslation] = useState('');
  const [completedChapters, setCompletedChapters] = useState({});
  const [imageError, setImageError] = useState(false);

  // TTS 관련 상태
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const utteranceRef = useRef(null);
  const wordsRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // 중요 단어 추출
  const [vocabulary, setVocabulary] = useState([]);
  const [showVocabulary, setShowVocabulary] = useState(true);

  const translation = useTranslation();
  const { markChapterCompleted, getBookProgress } = useLearningProgress();
  const { extractVocabulary, isExtracting } = useVocabularyExtraction();

  const currentChapter = book.chapters[currentChapterIndex];

  // 텍스트를 단어 배열로 분리
  const getWords = useCallback((text) => {
    return text.split(/(\s+)/).filter(word => word.trim().length > 0);
  }, []);

  // 초기 완료 상태 로드
  useEffect(() => {
    const saved = localStorage.getItem('learning-progress');
    if (saved) {
      const allProgress = JSON.parse(saved);
      const bookProgress = allProgress[book.id];
      if (bookProgress && bookProgress.chapters) {
        const initialCompleted = {};
        book.chapters.forEach(chapter => {
          const chapterProgress = bookProgress.chapters[chapter.id];
          initialCompleted[chapter.id] = chapterProgress?.readingCompleted || false;
        });
        setCompletedChapters(initialCompleted);
      }
    }
  }, [book.id, book.chapters]);

  useEffect(() => {
    const savedBookmarks = localStorage.getItem(`bookmarks-${book.id}`);
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }

    // 마지막 접근한 챕터 복원
    const bookProgress = getBookProgress(book.id);
    if (bookProgress.lastChapterIndex !== undefined && bookProgress.lastChapterIndex > 0) {
      setCurrentChapterIndex(bookProgress.lastChapterIndex);
    }
  }, [book.id, getBookProgress]);

  useEffect(() => {
    // 현재 챕터 인덱스 저장
    const saved = localStorage.getItem('learning-progress');
    if (saved) {
      const allProgress = JSON.parse(saved);
      const bookProgress = allProgress[book.id] || { chapters: {} };
      bookProgress.lastChapterIndex = currentChapterIndex;
      bookProgress.lastAccessedAt = new Date().toISOString();
      allProgress[book.id] = bookProgress;
      localStorage.setItem('learning-progress', JSON.stringify(allProgress));
    }

    setShowTranslation(false);
    setChapterTranslation('');
    // 챕터 변경 시 재생 중인 오디오 중지
    handleStop();
  }, [currentChapterIndex, book.id]);

  // 챕터 변경 시 중요 단어 추출
  useEffect(() => {
    const loadVocabulary = async () => {
      const vocab = await extractVocabulary(
        currentChapter.content,
        book.difficulty,
        currentChapter.id
      );
      if (vocab) {
        setVocabulary(vocab);
      }
    };

    loadVocabulary();
  }, [currentChapter.id, currentChapter.content, book.difficulty, extractVocabulary]);

  // 단어 배열 업데이트
  useEffect(() => {
    wordsRef.current = getWords(currentChapter.content);
  }, [currentChapter.content, getWords]);

  const saveBookmarks = (newBookmarks) => {
    setBookmarks(newBookmarks);
    localStorage.setItem(`bookmarks-${book.id}`, JSON.stringify(newBookmarks));
  };

  const toggleBookmark = () => {
    const isBookmarked = bookmarks.includes(currentChapter.id);

    if (isBookmarked) {
      saveBookmarks(bookmarks.filter(id => id !== currentChapter.id));
    } else {
      saveBookmarks([...bookmarks, currentChapter.id]);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText && selectedText.split(' ').length === 1) {
      onWordSelect(selectedText);
    }
  };

  // 음절 수 추정 (영어 단어)
  const estimateSyllables = useCallback((word) => {
    // 특수문자 제거
    const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (cleanWord.length <= 2) return 1;

    // 모음 패턴으로 음절 추정
    const vowelGroups = cleanWord.match(/[aeiouy]+/gi);
    let syllables = vowelGroups ? vowelGroups.length : 1;

    // 끝나는 e는 보통 묵음
    if (cleanWord.endsWith('e') && syllables > 1) {
      syllables--;
    }
    // -le 로 끝나는 경우 (예: table, apple)
    if (cleanWord.endsWith('le') && cleanWord.length > 2 && !/[aeiouy]/.test(cleanWord[cleanWord.length - 3])) {
      syllables++;
    }

    return Math.max(1, syllables);
  }, []);

  // 단어별 예상 재생 시간 계산 (음절 기반 + 구두점 pause)
  const calculateWordDurations = useCallback((words, rate) => {
    // 각 단어의 음절 수 계산
    const syllableCounts = words.map(word => estimateSyllables(word));
    const totalSyllables = syllableCounts.reduce((sum, count) => sum + count, 0);

    // 구두점 뒤 추가 pause 시간 (ms) - 실제보다 짧게
    const punctuationPause = {
      '.': 200 / rate,
      '!': 200 / rate,
      '?': 200 / rate,
      ',': 80 / rate,
      ';': 120 / rate,
      ':': 120 / rate,
    };

    // TTS 엔진은 실제로 rate 1.0에서 분당 약 290음절 발화 (10% 빠르게)
    const syllablesPerMinute = 290 * rate;
    const msPerSyllable = (60 * 1000) / syllablesPerMinute;

    return words.map((word, idx) => {
      // 음절 기반 발화 시간
      const wordDuration = syllableCounts[idx] * msPerSyllable;

      // 구두점 뒤 pause 추가
      const lastChar = word.slice(-1);
      const pause = punctuationPause[lastChar] || 0;

      return wordDuration + pause;
    });
  }, [estimateSyllables]);

  // TTS 재생 시작
  const handlePlay = () => {
    if (!window.speechSynthesis) {
      alert('이 브라우저는 음성 합성을 지원하지 않습니다.');
      return;
    }

    // 기존 재생 및 타이머 중지
    window.speechSynthesis.cancel();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const text = currentChapter.content;
    const words = wordsRef.current;
    const wordDurations = calculateWordDurations(words, playbackRate);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = playbackRate;

    // 시작 시간 및 단어 인덱스 추적
    let currentIdx = 0;
    let accumulatedTime = 0;

    utterance.onstart = () => {
      setIsPlaying(true);
      setCurrentWordIndex(0);
      startTimeRef.current = Date.now();

      // 타이머로 단어 하이라이트 업데이트
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;

        // 현재 시간에 해당하는 단어 찾기
        let timeSum = 0;
        for (let i = 0; i < wordDurations.length; i++) {
          timeSum += wordDurations[i];
          if (elapsed < timeSum) {
            if (i !== currentIdx) {
              currentIdx = i;
              setCurrentWordIndex(i);
            }
            break;
          }
        }

        // 모든 단어를 지나면 마지막 단어 유지
        if (elapsed >= timeSum && currentIdx < words.length - 1) {
          currentIdx = words.length - 1;
          setCurrentWordIndex(words.length - 1);
        }
      }, 50); // 50ms마다 체크
    };

    utterance.onend = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsPlaying(false);
      setCurrentWordIndex(-1);
    };

    utterance.onerror = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsPlaying(false);
      setCurrentWordIndex(-1);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // TTS 중지
  const handleStop = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsPlaying(false);
    setCurrentWordIndex(-1);
  };

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // 번역 토글
  const handleTranslationToggle = async () => {
    if (showTranslation) {
      setShowTranslation(false);
    } else {
      setShowTranslation(true);
      if (!chapterTranslation) {
        const translated = await translation.translate(currentChapter.content);
        if (translated) {
          setChapterTranslation(translated);
        }
      }
    }
  };

  const isBookmarked = bookmarks.includes(currentChapter.id);
  const chapterCompleted = completedChapters[currentChapter.id] || false;

  const handleMarkCompleted = () => {
    markChapterCompleted(book.id, currentChapter.id, 'reading');
    setCompletedChapters(prev => ({
      ...prev,
      [currentChapter.id]: true
    }));
  };

  // 중요 단어가 하이라이트된 텍스트 렌더링
  const renderTextWithVocabulary = (content) => {
    if (!showVocabulary || vocabulary.length === 0) {
      return content;
    }

    // 단어/숙어를 찾아서 하이라이트
    let result = content;
    const parts = [];
    let lastIndex = 0;

    // 긴 구문부터 짧은 단어 순으로 정렬 (긴 매칭 우선)
    const sortedVocab = [...vocabulary].sort((a, b) => b.word.length - a.word.length);

    // 이미 매칭된 위치를 추적
    const matchedRanges = [];

    sortedVocab.forEach((item, idx) => {
      const word = item.word;
      // 대소문자 구분 없이 검색 (단어 경계 포함)
      const regex = new RegExp(`\\b(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})\\b`, 'gi');
      let match;

      while ((match = regex.exec(content)) !== null) {
        const start = match.index;
        const end = start + match[0].length;

        // 이미 매칭된 범위와 겹치는지 확인
        const overlaps = matchedRanges.some(
          range => (start >= range.start && start < range.end) || (end > range.start && end <= range.end)
        );

        if (!overlaps) {
          matchedRanges.push({ start, end, word: match[0], idx });
        }
      }
    });

    // 시작 위치 순으로 정렬
    matchedRanges.sort((a, b) => a.start - b.start);

    // 텍스트를 조각내서 렌더링
    matchedRanges.forEach((range, index) => {
      // 매칭 이전 텍스트
      if (range.start > lastIndex) {
        parts.push(
          <span key={`text-${index}`}>{content.substring(lastIndex, range.start)}</span>
        );
      }

      // 하이라이트된 단어
      parts.push(
        <mark key={`vocab-${index}`} className="vocabulary-highlight" data-vocab-index={range.idx}>
          {range.word}
        </mark>
      );

      lastIndex = range.end;
    });

    // 남은 텍스트
    if (lastIndex < content.length) {
      parts.push(<span key="text-end">{content.substring(lastIndex)}</span>);
    }

    return parts.length > 0 ? parts : content;
  };

  // 하이라이트된 텍스트 렌더링 (TTS용)
  const renderHighlightedText = () => {
    const words = wordsRef.current;
    const content = currentChapter.content;

    if (!isPlaying || currentWordIndex < 0) {
      // 재생 중이 아닐 때는 vocabulary 하이라이트 적용
      return <span className="chapter-text-content">{renderTextWithVocabulary(content)}</span>;
    }

    // 단어별로 하이라이트 적용
    let result = [];
    let wordIdx = 0;
    let lastIndex = 0;

    // 정규식으로 단어와 공백 분리
    const regex = /(\S+)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      // 단어 이전의 공백 추가
      if (match.index > lastIndex) {
        result.push(
          <span key={`space-${lastIndex}`}>
            {content.substring(lastIndex, match.index)}
          </span>
        );
      }

      // 단어 추가 (하이라이트 여부 결정)
      const isCurrentWord = wordIdx === currentWordIndex;
      const isPastWord = wordIdx < currentWordIndex;

      result.push(
        <span
          key={`word-${wordIdx}`}
          className={`tts-word ${isCurrentWord ? 'current' : ''} ${isPastWord ? 'past' : ''}`}
        >
          {match[0]}
        </span>
      );

      lastIndex = regex.lastIndex;
      wordIdx++;
    }

    // 마지막 남은 텍스트 추가
    if (lastIndex < content.length) {
      result.push(
        <span key={`end-${lastIndex}`}>
          {content.substring(lastIndex)}
        </span>
      );
    }

    return result;
  };

  return (
    <div className="book-reader">
      <div className="reader-header">
        <div className="reader-header-inner">
          <div className="book-info-section">
            <div className="book-cover" style={{ background: book.coverColor || '#3b82f6' }}>
              {book.coverImage && !imageError ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="book-cover-image"
                  onError={() => setImageError(true)}
                />
              ) : (
                <DefaultBookIcon />
              )}
            </div>
            <div className="book-info">
              <h1>{book.title}</h1>
              <p className="book-title-korean">{book.description?.split('.')[0]}</p>
              <div className="book-meta">
                <span className="meta-item">
                  <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {book.author}
                </span>
                <span className="meta-item">
                  <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {book.year > 0 ? book.year : `BC ${Math.abs(book.year)}`}
                </span>
                <span className={`meta-item difficulty ${book.difficulty}`}>
                  <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  {book.difficulty === 'easy' ? '초급' : book.difficulty === 'medium' ? '중급' : '고급'}
                </span>
                <span className="meta-item">
                  <svg className="meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {book.readingTime}
                </span>
              </div>
            </div>
          </div>

          <div className="reader-controls">
            <button
              className="mode-switch-button speaking"
              onClick={onSwitchToSpeaking}
              title="말하기 모드로 전환"
            >
              <svg className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span>말하기</span>
            </button>

            <div className="font-size-control">
              <button onClick={() => setFontSize(Math.max(14, fontSize - 2))}>
                A-
              </button>
              <span>{fontSize}px</span>
              <button onClick={() => setFontSize(Math.min(24, fontSize + 2))}>
                A+
              </button>
            </div>

            <button
              className={`bookmark-button ${isBookmarked ? 'bookmarked' : ''}`}
              onClick={toggleBookmark}
              title={isBookmarked ? '북마크 제거' : '북마크 추가'}
            >
              {isBookmarked ? '★' : '☆'}
            </button>
          </div>
        </div>
      </div>

      <div className="chapter-navigation">
        <button
          onClick={() => setCurrentChapterIndex(Math.max(0, currentChapterIndex - 1))}
          disabled={currentChapterIndex === 0}
        >
          ← 이전
        </button>

        <div className="chapter-info-wrapper">
          <span className="chapter-info">
            {currentChapterIndex + 1}/{book.chapters.length} 챕터
          </span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${Math.round(((currentChapterIndex + 1) / book.chapters.length) * 100)}%` }}
            />
          </div>
          <span className="progress-text">
            {Object.values(completedChapters).filter(Boolean).length}/{book.chapters.length} 완료
          </span>
        </div>

        <button
          onClick={() => setCurrentChapterIndex(Math.min(book.chapters.length - 1, currentChapterIndex + 1))}
          disabled={currentChapterIndex === book.chapters.length - 1}
        >
          다음 →
        </button>
      </div>

      <article className="reader-content">
        <div className="chapter-header">
          <h2 className="chapter-title">
            {currentChapter.title}
            {chapterCompleted && <span className="reading-completed-badge">✓ 학습 완료</span>}
          </h2>
          {!chapterCompleted && (
            <button className="mark-completed-btn" onClick={handleMarkCompleted}>
              📖 읽기 완료
            </button>
          )}
        </div>

        {/* TTS 컨트롤 바 */}
        <div className="tts-control-bar">
          <div className="tts-buttons">
            {!isPlaying ? (
              <button className="tts-btn play" onClick={handlePlay}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <span>원어민 발음 듣기</span>
              </button>
            ) : (
              <button className="tts-btn stop" onClick={handleStop}>
                <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                  <path d="M6 6h12v12H6z"/>
                </svg>
                <span>중지</span>
              </button>
            )}
          </div>

          <div className="tts-speed-control">
            <label>속도:</label>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              disabled={isPlaying}
            />
            <span>{playbackRate.toFixed(1)}x</span>
          </div>

          <button
            className={`translation-toggle-btn ${showTranslation ? 'active' : ''}`}
            onClick={handleTranslationToggle}
            disabled={translation.isTranslating}
          >
            {translation.isTranslating ? '번역 중...' : showTranslation ? '번역 숨기기' : '번역 보기'}
          </button>
        </div>

        <div className="reading-hint">
          💡 단어를 드래그하면 사전을 볼 수 있습니다. 재생 버튼을 누르면 원어민 발음을 들으며 따라 읽을 수 있습니다.
        </div>

        <div
          className={`chapter-text ${isPlaying ? 'tts-active' : ''}`}
          style={{ fontSize: `${fontSize}px` }}
          onMouseUp={handleTextSelection}
        >
          {renderHighlightedText()}
        </div>

        {showTranslation && (
          <div className="chapter-translation">
            <h3>한국어 번역</h3>
            {translation.isTranslating ? (
              <p className="translating">번역 중...</p>
            ) : chapterTranslation ? (
              <p>{chapterTranslation}</p>
            ) : null}
          </div>
        )}

        {/* 중요 단어 설명 - 항상 섹션 표시 */}
        {showVocabulary && (
          <div className="vocabulary-section">
            <div className="vocabulary-header">
              <h3>📚 중요 단어 & 숙어</h3>
              {isExtracting && <span className="extracting-badge">분석 중...</span>}
            </div>

            {/* 로딩 중: 스켈레톤 UI */}
            {isExtracting && (
              <div className="vocabulary-list">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="vocabulary-item skeleton">
                    <div className="skeleton-word"></div>
                    <div className="skeleton-definition"></div>
                    <div className="skeleton-example"></div>
                  </div>
                ))}
              </div>
            )}

            {/* 로딩 완료 + 단어 있음: 실제 단어 목록 */}
            {!isExtracting && vocabulary.length > 0 && (
              <div className="vocabulary-list vocabulary-fade-in">
                {vocabulary.map((item, index) => (
                  <div key={index} className="vocabulary-item">
                    <div className="vocabulary-word">
                      <mark className="vocabulary-highlight">{item.word}</mark>
                    </div>
                    <div className="vocabulary-definition">{item.definition}</div>
                    {item.example && (
                      <div className="vocabulary-example">
                        <em>예문:</em> {item.example}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 로딩 완료 + 단어 없음: 빈 상태 메시지 */}
            {!isExtracting && vocabulary.length === 0 && (
              <div className="vocabulary-empty">
                <span className="empty-icon">📖</span>
                <p>이 챕터에서는 추출된 중요 단어가 없습니다.</p>
                <span className="empty-hint">다른 챕터에서 더 많은 단어를 학습해보세요!</span>
              </div>
            )}
          </div>
        )}
      </article>

      {/* 챕터 목록 */}
      <div className="chapters-section">
        <h3>📚 챕터 목록</h3>
        <div className="chapter-list">
          {book.chapters.map((chapter, index) => {
            const isReadingDone = completedChapters[chapter.id] || false;
            const isCurrent = index === currentChapterIndex;
            return (
              <button
                key={chapter.id}
                className={`chapter-item ${isCurrent ? 'current' : ''} ${isReadingDone ? 'completed' : ''}`}
                onClick={() => setCurrentChapterIndex(index)}
              >
                <span className="chapter-status">
                  {isReadingDone ? '✅' : '○'}
                </span>
                <span className="chapter-name">{chapter.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {bookmarks.length > 0 && (
        <div className="bookmarks-section">
          <h3>⭐ 내 북마크</h3>
          <div className="bookmark-list">
            {bookmarks.map(chapterId => {
              const chapter = book.chapters.find(ch => ch.id === chapterId);
              if (!chapter) return null;
              const isCompleted = completedChapters[chapter.id] || false;
              return (
                <button
                  key={chapterId}
                  className={`bookmark-item ${isCompleted ? 'completed' : ''}`}
                  onClick={() => setCurrentChapterIndex(book.chapters.indexOf(chapter))}
                >
                  {isCompleted && <span className="bookmark-check">✓</span>}
                  {chapter.title}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default BookReader;
