import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Speech-to-Text hook using Web Speech API
 * Provides real-time speech recognition with transcript
 */
export const useSTT = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US'; // English language for learning
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let interimText = '';
        let finalText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcriptPart + ' ';
          } else {
            interimText += transcriptPart;
          }
        }

        if (finalText) {
          setTranscript(prev => prev + finalText);
        }
        setInterimTranscript(interimText);
      };

      recognition.onerror = (event) => {
        // 무시해도 되는 일반적인 오류들 (no-speech, aborted, 패턴 불일치 등)
        const ignorableErrors = ['no-speech', 'aborted'];
        if (ignorableErrors.includes(event.error) ||
            event.message?.includes('pattern') ||
            event.error === '') {
          console.log('STT info:', event.error || 'minor error');
          return;
        }
        console.error('Speech recognition error:', event.error);
        // 네트워크 오류만 사용자에게 표시
        if (event.error === 'network') {
          setError('네트워크 오류가 발생했습니다.');
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        // interim 결과가 남아있으면 final transcript에 합치기
        setInterimTranscript(prev => {
          if (prev) {
            setTranscript(t => t + prev);
          }
          return '';
        });
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      setError('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 브라우저를 사용해주세요.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError('음성 인식이 지원되지 않습니다.');
      return;
    }

    try {
      setError(null);
      setTranscript('');
      setInterimTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    } catch (err) {
      console.error('Failed to start recognition:', err);
      setError('음성 인식을 시작할 수 없습니다.');
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const getFullTranscript = useCallback(() => {
    return transcript + interimTranscript;
  }, [transcript, interimTranscript]);

  return {
    isListening,
    transcript,
    interimTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    clearTranscript,
    getFullTranscript
  };
};
