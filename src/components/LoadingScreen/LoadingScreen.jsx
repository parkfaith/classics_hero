import { useState, useEffect } from 'react';
import './LoadingScreen.css';

// 로딩 중에 보여줄 명언들
const quotes = [
  { text: "A reader lives a thousand lives before he dies.", author: "George R.R. Martin", ko: "독서가는 죽기 전에 천 번의 삶을 삽니다." },
  { text: "The more that you read, the more things you will know.", author: "Dr. Seuss", ko: "더 많이 읽을수록, 더 많은 것을 알게 됩니다." },
  { text: "Reading is to the mind what exercise is to the body.", author: "Joseph Addison", ko: "독서는 정신에게 운동이 몸에게 하는 것과 같습니다." },
  { text: "Today a reader, tomorrow a leader.", author: "Margaret Fuller", ko: "오늘의 독서가가 내일의 리더입니다." },
  { text: "Books are a uniquely portable magic.", author: "Stephen King", ko: "책은 휴대 가능한 유일한 마법입니다." },
  { text: "There is no friend as loyal as a book.", author: "Ernest Hemingway", ko: "책만큼 충실한 친구는 없습니다." },
  { text: "A book is a dream that you hold in your hand.", author: "Neil Gaiman", ko: "책은 손에 쥔 꿈입니다." },
  { text: "Reading gives us someplace to go when we have to stay where we are.", author: "Mason Cooley", ko: "독서는 우리가 있어야 할 곳에 머물러야 할 때 갈 곳을 줍니다." },
];

// 로딩 팁들
const tips = [
  "하루 10분 영어 읽기로 실력이 쑥쑥!",
  "모르는 단어는 문맥에서 추측해 보세요",
  "소리 내어 읽으면 발음도 함께 연습돼요",
  "좋아하는 장르부터 시작해 보세요",
  "반복 학습이 영어 실력의 비결이에요",
];

const LoadingScreen = ({ message = "잠시만 기다려 주세요", subMessage, icon = "📚" }) => {
  const [quote, setQuote] = useState(quotes[0]);
  const [tip, setTip] = useState(tips[0]);
  const [dots, setDots] = useState('');

  // 랜덤 명언 선택
  useEffect(() => {
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    const randomTip = tips[Math.floor(Math.random() * tips.length)];
    setQuote(randomQuote);
    setTip(randomTip);
  }, []);

  // 로딩 점 애니메이션
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-screen">
      <div className="loading-content">
        {/* 아이콘 */}
        <div className="loading-icon">
          <span className="loading-icon-emoji">{icon}</span>
        </div>

        {/* 로딩 메시지 */}
        <div className="loading-message">
          <h2>{message}{dots}</h2>
          <p className="loading-submessage">
            {subMessage || (
              <>
                서버에서 고전 문학들을 가져오고 있어요.<br />
                잠시만 기다려 주세요!
              </>
            )}
          </p>
        </div>

        {/* 명언 섹션 */}
        <div className="loading-quote">
          <p className="quote-text">"{quote.text}"</p>
          <p className="quote-translation">{quote.ko}</p>
          <p className="quote-author">— {quote.author}</p>
        </div>

        {/* 학습 팁 */}
        <div className="loading-tip">
          <span className="tip-icon">💡</span>
          <span className="tip-text">{tip}</span>
        </div>

        {/* 진행 바 */}
        <div className="loading-progress">
          <div className="loading-progress-bar">
            <div className="loading-progress-fill"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
