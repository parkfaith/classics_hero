import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import { useSTT } from '../../hooks/useSTT';
import { useRecorder } from '../../hooks/useRecorder';
import { usePronunciationAnalysis } from '../../hooks/usePronunciationAnalysis';
import usePronunciationHistory from '../../hooks/usePronunciationHistory';
import { useLearningProgress } from '../../hooks/useLearningProgress';
import { useLearningMotivation } from '../../hooks/useLearningMotivation';
import { useProgress } from '../../hooks/useProgress';
import { useStatistics } from '../../hooks/useStatistics';
import PracticeSummary from './PracticeSummary';
import MotivationPanel from './MotivationPanel';
import './SpeakingMode.css';

const SpeakingMode = ({ book, onBack, onSwitchToReading, onWordSelect }) => {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [sentences, setSentences] = useState([]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [currentTranslation, setCurrentTranslation] = useState('');
  const [isPracticing, setIsPracticing] = useState(false);
  const [learnedWords, setLearnedWords] = useState(new Set());
  const [wordDetails, setWordDetails] = useState({}); // { word: { meaning, pronunciation, example, isLoading } }
  const [showSummary, setShowSummary] = useState(false);
  const [completedChapters, setCompletedChapters] = useState({});
  const [isPlayingRecording, setIsPlayingRecording] = useState(false);
  const [motivationMessage, setMotivationMessage] = useState(null);
  const [improvementInfo, setImprovementInfo] = useState(null);
  const [autoCompleteShown, setAutoCompleteShown] = useState(false);

  // TTS 하이라이트 관련 상태
  const [isTTSPlaying, setIsTTSPlaying] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const sentenceWordsRef = useRef([]);

  const translation = useTranslation();
  const stt = useSTT();
  const recorder = useRecorder();
  const pronunciation = usePronunciationAnalysis();

  // 발음 연습 기록 관리
  const currentChapter = book.chapters[currentChapterIndex];
  const pronunciationHistory = usePronunciationHistory(book.id, currentChapter.id);
  const { markChapterCompleted } = useLearningProgress();
  const { markChapterCompleted: markProgressCompleted } = useProgress();
  const { recordSpeakingSession, recordChapterComplete, endSession } = useStatistics();

  // 동기부여 시스템
  const motivation = useLearningMotivation();

  // 완료 상태 로드 함수
  const loadCompletedChapters = useCallback(() => {
    const saved = localStorage.getItem('learning-progress');
    if (saved) {
      const allProgress = JSON.parse(saved);
      const bookProgress = allProgress[book.id];
      if (bookProgress && bookProgress.chapters) {
        const loadedCompleted = {};
        book.chapters.forEach(chapter => {
          const chapterProgress = bookProgress.chapters[chapter.id];
          loadedCompleted[chapter.id] = chapterProgress?.speakingCompleted || false;
        });
        return loadedCompleted;
      }
    }
    // 저장된 데이터가 없으면 모두 false로 초기화
    const emptyCompleted = {};
    book.chapters.forEach(chapter => {
      emptyCompleted[chapter.id] = false;
    });
    return emptyCompleted;
  }, [book.id, book.chapters]);

  // 초기 완료 상태 로드
  useEffect(() => {
    const loaded = loadCompletedChapters();
    setCompletedChapters(loaded);
  }, [loadCompletedChapters]);

  // 로컬 상태에서 현재 챕터 완료 여부 확인 (동기적으로 업데이트됨)
  const chapterCompleted = completedChapters[currentChapter.id] || false;

  const handleMarkCompleted = () => {
    markChapterCompleted(book.id, currentChapter.id, 'speaking');
    // 새 훅에도 기록
    markProgressCompleted(book.id, currentChapter.id, 'speaking', currentChapter.word_count || currentChapter.wordCount || 0);
    recordSpeakingSession();
    recordChapterComplete(currentChapter.word_count || currentChapter.wordCount || 0);
    endSession();
    setCompletedChapters(prev => ({
      ...prev,
      [currentChapter.id]: true
    }));
  };

  // localStorage에서 학습한 단어 불러오기
  useEffect(() => {
    const saved = localStorage.getItem(`learned-words-${book.id}`);
    if (saved) {
      setLearnedWords(new Set(JSON.parse(saved)));
    }
  }, [book.id]);

  // 문장의 단어 배열 업데이트
  useEffect(() => {
    const currentSentence = sentences[currentSentenceIndex] || '';
    sentenceWordsRef.current = currentSentence.split(/\s+/).filter(w => w.length > 0);
  }, [currentSentenceIndex, sentences]);

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

  // TTS 중지 함수
  const stopTTS = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    setIsTTSPlaying(false);
    setCurrentWordIndex(-1);
  }, []);

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

  useEffect(() => {
    // 현재 챕터의 텍스트를 문장 단위로 분리
    const currentChapter = book.chapters[currentChapterIndex];
    const text = currentChapter.content;

    // 초중급 학습자를 위한 문장 분리 함수
    const splitForLearners = (text) => {
      const MAX_WORDS = 12; // 최대 단어 수

      // 1단계: 마침표, 느낌표, 물음표로 기본 분리
      const baseSentences = text
        .split(/(?<=[.!?])\s+/)
        .filter(s => s.trim().length > 0);

      const result = [];

      baseSentences.forEach(sentence => {
        const wordCount = sentence.split(/\s+/).length;

        // 문장이 충분히 짧으면 그대로 사용
        if (wordCount <= MAX_WORDS) {
          result.push(sentence.trim());
          return;
        }

        // 2단계: 긴 문장은 쉼표, 세미콜론, 콜론, 접속사로 분리
        // 접속사 앞에서 분리 (and, but, or, so, because, when, while, if, although, though)
        const parts = sentence
          .split(/,\s+(?=and\b|but\b|or\b|so\b|because\b|when\b|while\b|if\b|although\b|though\b|which\b|who\b)|;\s+|:\s+(?=[A-Z])|,\s+(?=[A-Z])/g)
          .filter(s => s.trim().length > 0);

        if (parts.length > 1) {
          parts.forEach(part => {
            const trimmed = part.trim();
            // 끝에 구두점이 없으면 추가하지 않음 (자연스럽게)
            result.push(trimmed);
          });
        } else {
          // 분리가 안 되면 쉼표 기준으로 한번 더 시도
          const commaParts = sentence.split(/,\s+/).filter(s => s.trim().length > 0);
          if (commaParts.length > 1 && commaParts[0].split(/\s+/).length <= MAX_WORDS) {
            commaParts.forEach(part => result.push(part.trim()));
          } else {
            result.push(sentence.trim());
          }
        }
      });

      return result;
    };

    const sentenceArray = splitForLearners(text);
    setSentences(sentenceArray);
    setCurrentSentenceIndex(0);
    stt.clearTranscript();
    pronunciation.clearAnalysis();
    setShowTranslation(false);
    setCurrentTranslation('');
    setAutoCompleteShown(false);
  }, [currentChapterIndex, book]);

  // 현재 문장에서 핵심 단어 추출
  const getKeyWordsInSentence = () => {
    const currentChapter = book.chapters[currentChapterIndex];
    const vocabulary = currentChapter.vocabulary || [];
    const currentSentence = sentences[currentSentenceIndex] || '';

    // 문장을 소문자로 변환하여 단어 포함 여부 확인
    const sentenceLower = currentSentence.toLowerCase();

    return vocabulary.filter(word => {
      // 단어의 다양한 형태 고려 (예: walk, walked, walking)
      const wordPattern = new RegExp(`\\b${word.toLowerCase()}\\w*\\b`, 'i');
      return wordPattern.test(sentenceLower);
    });
  };

  // 문장에서 핵심 단어 하이라이트
  const highlightKeyWords = (sentence) => {
    if (!sentence) return [{ text: '', isKeyWord: false }];

    const keyWords = getKeyWordsInSentence();
    if (keyWords.length === 0) {
      return [{ text: sentence, isKeyWord: false }];
    }

    const parts = [];
    let currentIndex = 0;
    const matches = [];

    // 모든 매칭 위치 수집
    keyWords.forEach(word => {
      const wordPattern = new RegExp(`\\b(${word}\\w*)\\b`, 'gi');
      let match;

      const tempSentence = sentence;
      while ((match = wordPattern.exec(tempSentence)) !== null) {
        matches.push({
          start: match.index,
          end: match.index + match[1].length,
          text: match[1],
          baseWord: word,
          isLearned: learnedWords.has(word.toLowerCase())
        });
      }
    });

    // 위치별로 정렬
    matches.sort((a, b) => a.start - b.start);

    // 중복 제거 (겹치는 매칭 제거)
    const filteredMatches = [];
    let lastEnd = -1;
    matches.forEach(match => {
      if (match.start >= lastEnd) {
        filteredMatches.push(match);
        lastEnd = match.end;
      }
    });

    // 문장 분할
    filteredMatches.forEach(match => {
      // 매칭 이전 텍스트
      if (match.start > currentIndex) {
        parts.push({
          text: sentence.substring(currentIndex, match.start),
          isKeyWord: false
        });
      }

      // 매칭된 단어
      parts.push({
        text: match.text,
        isKeyWord: true,
        baseWord: match.baseWord,
        isLearned: match.isLearned
      });

      currentIndex = match.end;
    });

    // 남은 텍스트
    if (currentIndex < sentence.length) {
      parts.push({
        text: sentence.substring(currentIndex),
        isKeyWord: false
      });
    }

    return parts.length > 0 ? parts : [{ text: sentence, isKeyWord: false }];
  };

  // 단어 학습 상태 토글
  const toggleWordLearned = (word) => {
    const wordLower = word.toLowerCase();
    const newLearnedWords = new Set(learnedWords);

    if (newLearnedWords.has(wordLower)) {
      newLearnedWords.delete(wordLower);
    } else {
      newLearnedWords.add(wordLower);
    }

    setLearnedWords(newLearnedWords);
    localStorage.setItem(`learned-words-${book.id}`, JSON.stringify([...newLearnedWords]));
  };

  // 단어 상세 정보 가져오기 (뜻, 발음기호, 예문)
  const fetchWordDetails = async (word) => {
    const wordLower = word.toLowerCase();

    // 이미 로딩 중이거나 데이터가 있으면 스킵
    if (wordDetails[wordLower]) {
      return;
    }

    // 로딩 상태 설정
    setWordDetails(prev => ({
      ...prev,
      [wordLower]: { isLoading: true }
    }));

    try {
      // OpenAI API를 사용하여 단어 정보 요청
      const prompt = `Please provide the following information for the English word "${word}" in Korean:
1. 한국어 뜻 (간단명료하게)
2. 발음기호 (IPA)
3. 예문 1개 (영어)
4. 예문의 한국어 번역

Format your response as JSON:
{
  "meaning": "한국어 뜻",
  "pronunciation": "발음기호",
  "example": "영어 예문",
  "exampleTranslation": "예문의 한국어 번역"
}`;

      const response = await translation.translate(prompt);

      if (response) {
        try {
          // JSON 파싱 시도
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const data = JSON.parse(jsonMatch[0]);
            setWordDetails(prev => ({
              ...prev,
              [wordLower]: {
                meaning: data.meaning || '번역 없음',
                pronunciation: data.pronunciation || '',
                example: data.example || '',
                exampleTranslation: data.exampleTranslation || '',
                isLoading: false
              }
            }));
          } else {
            throw new Error('JSON format not found');
          }
        } catch (e) {
          // JSON 파싱 실패 시 간단한 번역만 저장
          setWordDetails(prev => ({
            ...prev,
            [wordLower]: {
              meaning: response,
              pronunciation: '',
              example: '',
              exampleTranslation: '',
              isLoading: false
            }
          }));
        }
      }
    } catch (error) {
      console.error('Failed to fetch word details:', error);
      setWordDetails(prev => ({
        ...prev,
        [wordLower]: {
          meaning: '정보를 가져올 수 없습니다',
          pronunciation: '',
          example: '',
          exampleTranslation: '',
          isLoading: false
        }
      }));
    }
  };

  // 단어 카드 클릭 핸들러 (상세 정보 토글)
  const handleWordClick = async (word) => {
    await fetchWordDetails(word);
  };

  // 단어 음성 재생
  const handleWordPronunciation = (e, word) => {
    e.stopPropagation();
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'en-US';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  // 텍스트 선택 시 사전 팝업 표시 (BookReader와 동일)
  const handleTextSelection = () => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    // 단어 하나만 선택된 경우 사전 표시
    if (selectedText && selectedText.split(' ').length === 1 && /^[a-zA-Z'-]+$/.test(selectedText)) {
      if (onWordSelect) {
        onWordSelect(selectedText);
      }
    }
  };

  // TTS 하이라이트 렌더링
  const renderHighlightedSentence = () => {
    const currentSentence = sentences[currentSentenceIndex] || '';

    if (!isTTSPlaying || currentWordIndex < 0) {
      // 재생 중이 아닐 때는 기존 하이라이트 방식 사용
      return highlightKeyWords(currentSentence).map((part, idx) => (
        part.isKeyWord ? (
          <span
            key={idx}
            className={`keyword-highlight ${part.isLearned ? 'learned' : ''}`}
            onClick={() => handleWordClick(part.baseWord)}
            title={part.isLearned ? '학습 완료! 클릭하여 다시 보기' : '클릭하여 뜻 보기'}
          >
            {part.text}
          </span>
        ) : (
          <span key={idx}>{part.text}</span>
        )
      ));
    }

    // TTS 재생 중일 때 단어별 하이라이트
    const words = currentSentence.split(/(\s+)/);
    let wordIdx = 0;

    return words.map((part, idx) => {
      if (part.trim().length === 0) {
        return <span key={idx}>{part}</span>;
      }

      const isCurrentWord = wordIdx === currentWordIndex;
      const isPastWord = wordIdx < currentWordIndex;
      wordIdx++;

      return (
        <span
          key={idx}
          className={`tts-word ${isCurrentWord ? 'current' : ''} ${isPastWord ? 'past' : ''}`}
        >
          {part}
        </span>
      );
    });
  };

  const handleNextSentence = () => {
    if (currentSentenceIndex < sentences.length - 1) {
      setCurrentSentenceIndex(prev => prev + 1);
      stt.clearTranscript();
      pronunciation.clearAnalysis();
      stopTTS();
      stt.stopListening();
      setShowTranslation(false);
      setCurrentTranslation('');
      setIsPracticing(false);
    }
  };

  const handlePrevSentence = () => {
    if (currentSentenceIndex > 0) {
      setCurrentSentenceIndex(prev => prev - 1);
      stt.clearTranscript();
      pronunciation.clearAnalysis();
      stopTTS();
      stt.stopListening();
      setShowTranslation(false);
      setCurrentTranslation('');
      setIsPracticing(false);
    }
  };

  const handleToggleTranslation = async () => {
    if (showTranslation) {
      setShowTranslation(false);
    } else {
      const currentSentence = sentences[currentSentenceIndex];
      if (currentSentence && !currentTranslation) {
        const translatedText = await translation.translate(currentSentence);
        if (translatedText) {
          setCurrentTranslation(translatedText);
        }
      }
      setShowTranslation(true);
    }
  };

  const handlePlayTTS = () => {
    const currentSentence = sentences[currentSentenceIndex];
    if (!currentSentence) return;

    if (isTTSPlaying) {
      stopTTS();
      return;
    }

    if (!window.speechSynthesis) {
      alert('이 브라우저는 음성 합성을 지원하지 않습니다.');
      return;
    }

    // 기존 재생 및 타이머 중지
    window.speechSynthesis.cancel();
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // 모바일(iOS) 등에서 TTS가 중단된 상태일 수 있으므로 resume 호출
    if (window.speechSynthesis.resume) {
        window.speechSynthesis.resume();
    }

    const words = sentenceWordsRef.current;
    const wordDurations = calculateWordDurations(words, playbackSpeed);

    const utterance = new SpeechSynthesisUtterance(currentSentence);
    
    // 명시적으로 음성 선택 (모바일 호환성)
    const voices = window.speechSynthesis.getVoices();
    // 1. Google US English (Android)
    // 2. Samantha (iOS)
    // 3. Any en-US
    // 4. Any English
    const priorityVoices = [
        /Google US English/i,
        /Samantha/i,
        /en-US/i,
        /en-/i
    ];

    let selectedVoice = null;
    for (const pattern of priorityVoices) {
        selectedVoice = voices.find(v => pattern.test(v.name) || pattern.test(v.lang));
        if (selectedVoice) break;
    }

    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }

    utterance.lang = 'en-US';
    utterance.rate = playbackSpeed;

    let currentIdx = 0;

    utterance.onstart = () => {
      setIsTTSPlaying(true);
      setCurrentWordIndex(0);
      startTimeRef.current = Date.now();

      // 타이머로 단어 하이라이트 업데이트
      timerRef.current = setInterval(() => {
        const elapsed = Date.now() - startTimeRef.current;

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

        if (elapsed >= timeSum && currentIdx < words.length - 1) {
          currentIdx = words.length - 1;
          setCurrentWordIndex(words.length - 1);
        }
      }, 50);
    };

    utterance.onend = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsTTSPlaying(false);
      setCurrentWordIndex(-1);
    };

    utterance.onerror = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setIsTTSPlaying(false);
      setCurrentWordIndex(-1);
    };

    window.speechSynthesis.speak(utterance);
  };

  const handlePracticePronunciation = async () => {
    // 이미 연습 중이면 중지하고 분석
    if (isPracticing && stt.isListening) {
      stt.stopListening();
      recorder.stopRecording();
      setIsPracticing(false);

      // 발음 분석 실행
      const sentenceToAnalyze = sentences[currentSentenceIndex];
      const spokenText = stt.transcript.trim();
      if (spokenText) {
        const analysisResult = await pronunciation.analyzePronunciation(sentenceToAnalyze, spokenText);

        // 분석 결과를 기록에 저장
        if (analysisResult) {
          // 이전 점수 가져오기 (동기부여 시스템용)
          const previousRecord = pronunciationHistory.getRecordBySentence(currentSentenceIndex);
          const previousScore = previousRecord ? previousRecord.accuracy : null;

          const { improvement } = pronunciationHistory.addRecord({
            sentenceIndex: currentSentenceIndex,
            originalSentence: sentenceToAnalyze,
            spokenText: spokenText,
            accuracy: analysisResult.accuracy,
            wordAnalysis: analysisResult.wordAnalysis,
            feedback: analysisResult.feedback
          });

          // 동기부여 시스템에 기록
          motivation.recordPractice(analysisResult.accuracy, previousScore);

          // 개선율 표시
          setImprovementInfo(improvement);

          // 동기부여 메시지 설정
          if (improvement) {
            if (improvement.isFirstAttempt) {
              setMotivationMessage({
                type: 'encourage',
                text: '첫 도전이에요! 계속 연습하면 더 좋아질 거예요! 💪'
              });
            } else if (improvement.recent >= 10) {
              setMotivationMessage({
                type: 'success',
                text: `와! 이전보다 ${improvement.recent}점이나 올랐어요! 🎉`
              });
            } else if (improvement.recent >= 5) {
              setMotivationMessage({
                type: 'success',
                text: `좋아요! ${improvement.recent}점 더 나아졌어요! 👏`
              });
            } else if (improvement.recent <= -5) {
              setMotivationMessage({
                type: 'encourage',
                text: '괜찮아요. 다음에 더 잘할 수 있어요! 🌱'
              });
            } else {
              setMotivationMessage(null);
            }
          }

          // 마지막 문장 연습 완료 시 자동 완료 제안
          if (currentSentenceIndex === sentences.length - 1 && !chapterCompleted) {
            setAutoCompleteShown(true);
          }
        }
      }
    } else {
      // 새로운 연습 시작
      stopTTS();
      stt.clearTranscript();
      pronunciation.clearAnalysis();
      recorder.clearRecording();
      setIsPracticing(true);
      stt.startListening();
      recorder.startRecording();
    }
  };

  // 녹음 취소 (분석 없이 초기 상태로)
  const handleCancelPractice = () => {
    stt.stopListening();
    recorder.stopRecording();
    stt.clearTranscript();
    recorder.clearRecording();
    setIsPracticing(false);
  };



  // 연습 기록이 있는 문장인지 확인
  const currentSentenceRecord = pronunciationHistory.getRecordBySentence(currentSentenceIndex);

  // 통계 계산
  const statistics = pronunciationHistory.getStatistics(sentences.length);

  // Summary 모달 닫기
  const handleCloseSummary = () => {
    setShowSummary(false);
  };

  // 약점 문장 다시 연습
  const handleRetryWeakSentences = (sentenceIndices) => {
    if (sentenceIndices.length > 0) {
      setCurrentSentenceIndex(sentenceIndices[0]);
      setShowSummary(false);
      stt.clearTranscript();
      pronunciation.clearAnalysis();
    }
  };

  // 기록 초기화
  const handleClearHistory = () => {
    if (window.confirm('이 챕터의 모든 연습 기록을 삭제하시겠습니까?')) {
      pronunciationHistory.clearHistory();
      setShowSummary(false);
    }
  };

  return (
    <div className="speaking-mode">
      <div className="speaking-header">
        <div className="speaking-header-inner">
          {/* 상단: 책 제목 + 읽기 모드 버튼 */}
          <div className="header-top-row">
            <h1 className="book-title">{book.title}</h1>
            <button
              className="mode-switch-button reading"
              onClick={onSwitchToReading}
              title="읽기 모드로 전환"
            >
              <svg className="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <span>읽기</span>
            </button>
          </div>

          {/* 하단: 챕터 선택 + 속도 + 완료 버튼 */}
          <div className="header-controls-row">
            <div className="chapter-selector-compact">
              <select
                value={currentChapterIndex}
                onChange={(e) => setCurrentChapterIndex(parseInt(e.target.value))}
              >
                {book.chapters.map((chapter, index) => {
                  const isSpeaking = completedChapters[chapter.id] || false;
                  const statusIcon = isSpeaking ? '🎤 ' : '';
                  return (
                    <option key={chapter.id} value={index}>
                      {statusIcon}{chapter.title}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="speed-control-compact">
              <span className="speed-label">🔊 {playbackSpeed.toFixed(1)}x</span>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              />
            </div>

            {chapterCompleted && (
              <span className="chapter-completed-badge">✓ 완료</span>
            )}
          </div>
        </div>
      </div>

      <div className="speaking-content">
        {/* 동기부여 패널 */}
        <MotivationPanel
          streak={motivation.streak}
          level={motivation.getCurrentLevel()}
          levelProgress={motivation.getLevelProgress()}
          todayProgress={motivation.getTodayProgress()}
          earnedBadges={motivation.getEarnedBadges()}
          newBadge={motivation.newBadge}
          onDismissBadge={motivation.dismissNewBadge}
        />

        <div className="sentence-navigation">
          <button
            onClick={handlePrevSentence}
            disabled={currentSentenceIndex === 0}
          >
            ← 이전 문장
          </button>

          <span className="sentence-counter">
            {currentSentenceRecord && (
              <span className="completed-badge" title={`최고 점수: ${currentSentenceRecord.accuracy}점`}>
                ✓ {currentSentenceRecord.accuracy}점
              </span>
            )}
            {currentSentenceIndex + 1} / {sentences.length} 문장
          </span>

          <button
            onClick={handleNextSentence}
            disabled={currentSentenceIndex === sentences.length - 1}
          >
            다음 문장 →
          </button>
        </div>

        <div className="sentence-card">
          <p
            className={`current-sentence ${isTTSPlaying ? 'tts-active' : ''}`}
            onMouseUp={handleTextSelection}
          >
            {renderHighlightedSentence()}
          </p>

          <div className="sentence-actions">
            <button
              className="action-btn translation-btn"
              onClick={handleToggleTranslation}
              disabled={translation.isTranslating}
            >
              📖 {translation.isTranslating ? '번역 중...' : showTranslation ? '해석 숨기기' : '해석보기'}
            </button>

            <button
              className={`action-btn listen-btn ${isTTSPlaying ? 'active' : ''}`}
              onClick={handlePlayTTS}
            >
              🔊 {isTTSPlaying ? '중지' : '원문듣기'}
            </button>

            <button
              className={`action-btn practice-btn ${isPracticing ? 'active' : ''} ${pronunciation.analysis ? 'has-result' : ''}`}
              onClick={handlePracticePronunciation}
              disabled={!stt.isSupported || pronunciation.isAnalyzing}
            >
              {isPracticing ? '🎤 분석하기' : pronunciation.analysis ? '🔄 다시 따라하기' : '🎤 따라하기'}
            </button>
          </div>

          {showTranslation && currentTranslation && (
            <div className="translation-box">
              <p>{currentTranslation}</p>
            </div>
          )}

          {isPracticing && stt.isListening && (
            <div className="recording-status">
              <div className="recording-indicator">
                <span className="recording-dot"></span>
                녹음 중... 문장을 따라 읽어주세요
              </div>
              {stt.transcript && (
                <p className="interim-transcript">인식된 내용: {stt.transcript}</p>
              )}
              <div className="recording-actions">
                <button
                  className="recording-cancel-btn"
                  onClick={handleCancelPractice}
                >
                  ✕ 취소
                </button>
                <button
                  className="recording-restart-btn"
                  onClick={() => {
                    handleCancelPractice();
                    setTimeout(() => {
                      handlePracticePronunciation();
                    }, 100);
                  }}
                >
                  ↻ 다시 녹음
                </button>
              </div>
            </div>
          )}

          {pronunciation.analysis && (
            <div className="analysis-result">
              <div className="score-header">
                <div className="score-circle">
                  <span className="score-number">{pronunciation.analysis.accuracy}</span>
                  <span className="score-label">점</span>
                </div>
                <div className="score-info">
                  <p className="score-title">발음 점수</p>
                  <p className="score-grade">
                    {pronunciation.analysis.accuracy >= 90 ? '🌟 훌륭해요!' :
                     pronunciation.analysis.accuracy >= 70 ? '👍 잘했어요!' :
                     pronunciation.analysis.accuracy >= 50 ? '💪 조금만 더!' : '📚 연습이 필요해요'}
                  </p>
                </div>
              </div>

              <div className="analysis-actions">
                {recorder.recordedAudio && (
                  <button
                    className="playback-btn"
                    disabled={isPlayingRecording}
                    onClick={() => {
                      const audio = new Audio(recorder.recordedAudio);
                      setIsPlayingRecording(true);
                      audio.onended = () => setIsPlayingRecording(false);
                      audio.onerror = () => setIsPlayingRecording(false);
                      audio.play();
                    }}
                  >
                    🎧 {isPlayingRecording ? '재생 중...' : '내 발음 듣기'}
                  </button>
                )}
                <button
                  className="next-sentence-btn"
                  onClick={handleNextSentence}
                  disabled={currentSentenceIndex >= sentences.length - 1}
                >
                  다음 문장 →
                </button>
              </div>

              {improvementInfo && !improvementInfo.isFirstAttempt && (
                <div className={`improvement-indicator ${
                  improvementInfo.recent > 0 ? 'improvement-positive' :
                  improvementInfo.recent < 0 ? 'improvement-negative' : 'improvement-neutral'
                }`}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>
                    {improvementInfo.recent > 0 ? '📈' : improvementInfo.recent < 0 ? '📉' : '➡️'}
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                    {improvementInfo.recent === 0 ? '동일한 점수' :
                      `이전보다 ${improvementInfo.recent > 0 ? '+' : ''}${improvementInfo.recent}점`}
                  </div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>
                    ({improvementInfo.previousScore}점 → {improvementInfo.latestScore}점)
                  </div>
                </div>
              )}

              {motivationMessage && (
                <div className={`motivation-message motivation-${motivationMessage.type}`}>
                  {motivationMessage.text}
                </div>
              )}

              {pronunciation.analysis.feedback && (
                <div className="feedback-box">
                  <h4>💬 AI 피드백</h4>
                  <p>{pronunciation.analysis.feedback}</p>
                </div>
              )}

              <div className="word-analysis-box">
                <h4>단어별 분석</h4>
                <div className="words-list">
                  {pronunciation.analysis.wordAnalysis.map((word, idx) => (
                    <span
                      key={idx}
                      className={`word-tag ${word.status}`}
                      title={word.spokenWord ? `발음: ${word.spokenWord}` : ''}
                    >
                      {word.word || word.spokenWord}
                    </span>
                  ))}
                </div>
              </div>

            </div>
          )}

          {pronunciation.isAnalyzing && (
            <div className="analyzing-status">
              <p>AI가 발음을 분석하고 있습니다...</p>
            </div>
          )}

          {pronunciation.error && (
            <div className="error-message">
              ⚠️ {pronunciation.error}
            </div>
          )}

          {getKeyWordsInSentence().length > 0 && (
            <div className="key-words-section">
              <h4 className="key-words-title">
                📚 핵심 단어 ({getKeyWordsInSentence().filter(w => learnedWords.has(w.toLowerCase())).length}/{getKeyWordsInSentence().length} 학습 완료)
              </h4>
              <div className="key-words-list">
                {getKeyWordsInSentence().map((word, idx) => {
                  const isLearned = learnedWords.has(word.toLowerCase());
                  const details = wordDetails[word.toLowerCase()];
                  return (
                    <div key={idx} className="key-word-item">
                      <div
                        className={`key-word-card ${isLearned ? 'learned' : ''}`}
                        onClick={() => handleWordClick(word)}
                      >
                        <div className="word-content">
                          <div className="word-header">
                            <span className="word-text">{word}</span>
                            {isLearned && <span className="learned-badge">✓</span>}
                          </div>
                          {details?.pronunciation && (
                            <span className="word-pronunciation">{details.pronunciation}</span>
                          )}
                        </div>
                        <div className="word-actions">
                          <button
                            className="pronunciation-btn"
                            onClick={(e) => handleWordPronunciation(e, word)}
                            title="발음 듣기"
                          >
                            🔊
                          </button>
                          <button
                            className="learn-toggle-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWordLearned(word);
                            }}
                            title={isLearned ? '학습 취소' : '학습 완료 표시'}
                          >
                            {isLearned ? '✓' : '○'}
                          </button>
                        </div>
                      </div>

                      {details && !details.isLoading && (
                        <div className="word-details">
                          {details.meaning && (
                            <div className="word-meaning">
                              <strong>뜻:</strong> {details.meaning}
                            </div>
                          )}
                          {details.example && (
                            <div className="word-example">
                              <div className="example-english">
                                <strong>예문:</strong> {details.example}
                              </div>
                              {details.exampleTranslation && (
                                <div className="example-korean">
                                  {details.exampleTranslation}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {details?.isLoading && (
                        <div className="word-details loading">
                          <span className="loading-text">정보를 불러오는 중...</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="key-words-hint">
                💡 단어를 클릭하면 뜻, 발음기호, 예문이 표시됩니다. 🔊 버튼으로 발음을 들을 수 있습니다.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* 자동 완료 제안 토스트 */}
      {autoCompleteShown && !chapterCompleted && (
        <div className="auto-complete-toast">
          <span>마지막 문장까지 연습했어요!</span>
          <button onClick={() => { handleMarkCompleted(); setAutoCompleteShown(false); }}>
            말하기 완료
          </button>
          <button className="dismiss" onClick={() => setAutoCompleteShown(false)}>
            ✕
          </button>
        </div>
      )}

      {/* Summary 모달 */}
      <PracticeSummary
        isOpen={showSummary}
        onClose={handleCloseSummary}
        statistics={statistics}
        chapterTitle={currentChapter.title}
        onRetryWeakSentences={handleRetryWeakSentences}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
};

export default SpeakingMode;
