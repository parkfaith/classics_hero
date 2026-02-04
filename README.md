# Classic Hero

공개 도메인 영어 고전 문학을 활용한 영어 학습 웹앱

## 주요 기능

- **Reading Mode** - 고전 문학 읽기, 단락별 번역, 단어 사전
- **Speaking Mode** - TTS 듣기, 녹음 및 발음 연습
- **Talk to Hero** - 6명의 역사적 인물과 AI 영어 대화
- **PWA 지원** - 모바일 홈화면 앱 설치 가능

## 기술 스택

| Frontend | Backend |
|----------|---------|
| React 19 + Vite 7 | FastAPI + Turso/SQLite |

## 실행 방법

```bash
# Backend
cd backend
pip install -r requirements.txt
python seed_data.py          # 최초 1회
uvicorn main:app --reload --port 8001

# Frontend
npm install
npm run dev                  # http://localhost:5173
```

## 영웅 구성

| 난이도 | 영웅 |
|--------|------|
| Easy | Aesop, Brothers Grimm |
| Medium | O. Henry, Benjamin Franklin |
| Advanced | Marcus Aurelius, Abraham Lincoln |

## 라이선스

MIT License

---

Made by ParkJunHyoung
