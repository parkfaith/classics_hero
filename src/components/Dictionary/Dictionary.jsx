import { useState, useEffect } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import './Dictionary.css';

const Dictionary = ({ word, onClose }) => {
  const [definition, setDefinition] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [koreanMeaning, setKoreanMeaning] = useState(null);
  const [translatedDefinitions, setTranslatedDefinitions] = useState({});
  const translation = useTranslation();

  useEffect(() => {
    if (!word) return;

    const fetchDefinition = async () => {
      setLoading(true);
      setError(null);
      setKoreanMeaning(null);
      setTranslatedDefinitions({});

      try {
        // 영어 사전 API 호출
        const response = await fetch(
          `https://api.dictionaryapi.dev/api/v2/entries/en/${word.toLowerCase()}`
        );

        if (!response.ok) {
          throw new Error('Word not found');
        }

        const data = await response.json();
        setDefinition(data[0]);

        // 한글 번역 가져오기 (단어 자체)
        const koreanWord = await translation.translate(word, 'ko');
        setKoreanMeaning(koreanWord);

        // 첫 번째 뜻 번역
        if (data[0].meanings && data[0].meanings.length > 0) {
          const firstDef = data[0].meanings[0].definitions[0]?.definition;
          if (firstDef) {
            const translatedDef = await translation.translate(firstDef, 'ko');
            setTranslatedDefinitions(prev => ({
              ...prev,
              '0-0': translatedDef
            }));
          }
        }
      } catch (err) {
        setError(err.message);
        // 사전에서 못 찾아도 한글 번역은 시도
        try {
          const koreanWord = await translation.translate(word, 'ko');
          setKoreanMeaning(koreanWord);
        } catch {
          // 번역도 실패하면 무시
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDefinition();
  }, [word]);

  // 개별 뜻 번역 요청
  const handleTranslateDefinition = async (meaningIndex, defIndex, text) => {
    const key = `${meaningIndex}-${defIndex}`;
    if (translatedDefinitions[key]) return; // 이미 번역됨

    const translated = await translation.translate(text, 'ko');
    if (translated) {
      setTranslatedDefinitions(prev => ({
        ...prev,
        [key]: translated
      }));
    }
  };

  if (!word) return null;

  return (
    <div className="dictionary-overlay" onClick={onClose}>
      <div className="dictionary-popup" onClick={(e) => e.stopPropagation()}>
        <div className="dictionary-header">
          <div className="word-title">
            <h3>{word}</h3>
            {koreanMeaning && (
              <span className="korean-meaning">{koreanMeaning}</span>
            )}
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="dictionary-content">
          {loading && (
            <div className="loading">단어 뜻을 불러오는 중...</div>
          )}

          {error && !koreanMeaning && (
            <div className="error">
              <p>'{word}'의 뜻을 찾을 수 없습니다</p>
              <p className="error-hint">단어 하나만 선택해주세요</p>
            </div>
          )}

          {/* 사전에서 못 찾았지만 번역은 된 경우 */}
          {error && koreanMeaning && !loading && (
            <div className="korean-only-result">
              <div className="korean-translation-box">
                <span className="label">한국어 뜻</span>
                <span className="value">{koreanMeaning}</span>
              </div>
              <p className="translation-note">
                * 상세 영어 정의는 찾을 수 없지만, 번역 결과를 표시합니다.
              </p>
            </div>
          )}

          {definition && !loading && (
            <>
              {definition.phonetic && (
                <div className="phonetic">
                  {definition.phonetic}
                </div>
              )}

              {definition.meanings.map((meaning, index) => (
                <div key={index} className="meaning-section">
                  <div className="part-of-speech">{meaning.partOfSpeech}</div>

                  <ol className="definitions-list">
                    {meaning.definitions.slice(0, 3).map((def, defIndex) => {
                      const translationKey = `${index}-${defIndex}`;
                      const hasTranslation = translatedDefinitions[translationKey];

                      return (
                        <li key={defIndex}>
                          <p className="definition-text">{def.definition}</p>

                          {/* 한글 번역 */}
                          {hasTranslation ? (
                            <p className="definition-korean">{hasTranslation}</p>
                          ) : (
                            <button
                              className="translate-btn"
                              onClick={() => handleTranslateDefinition(index, defIndex, def.definition)}
                              disabled={translation.isTranslating}
                            >
                              {translation.isTranslating ? '번역 중...' : '한글로 보기'}
                            </button>
                          )}

                          {def.example && (
                            <p className="example">
                              <em>예문: "{def.example}"</em>
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ol>

                  {meaning.synonyms && meaning.synonyms.length > 0 && (
                    <div className="synonyms">
                      <strong>동의어:</strong> {meaning.synonyms.slice(0, 5).join(', ')}
                    </div>
                  )}
                </div>
              ))}

              {definition.sourceUrls && definition.sourceUrls.length > 0 && (
                <div className="source">
                  <a
                    href={definition.sourceUrls[0]}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    전체 정의 보기 →
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dictionary;
