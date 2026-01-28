# CLAUDE.md

Claude Code를 위한 프로젝트 가이드

## Project Overview

**Classic Hero** - 공개 도메인 영어 고전 문학을 활용한 영어 학습 웹앱
- **Frontend:** React 19 + Vite 7
- **Backend:** FastAPI + Turso (SQLite 호환 엣지 DB)
- **학습 모드:** Reading, Speaking, Talk to Hero
- AI 기반 발음 분석 및 역사적 인물과의 대화 기능
- 음성 중심 UI (TTS/STT 기본 활성화)
- **PWA 지원:** 모바일 홈화면 추가 가능

## Development Commands

```bash
# Backend (터미널 1)
cd backend
pip install -r requirements.txt

# Turso 설정 (선택사항 - 없으면 로컬 SQLite 사용)
cp .env.example .env
# .env 파일에 TURSO_DATABASE_URL, TURSO_AUTH_TOKEN 설정

python seed_data.py          # 최초 1회 - DB 초기화
uvicorn main:app --reload --port 8001

# Frontend (터미널 2)
npm run dev                  # http://localhost:5173
npm run build                # Production build
npm run lint                 # ESLint
```

**주의:** 백엔드 포트는 `8001` 사용 (vite.config.js 프록시 설정 확인)

### Turso 설정 (Vercel 배포용)

```bash
# 1. Turso CLI 설치
curl -sSfL https://get.tur.so/install.sh | bash

# 2. 로그인
turso auth login

# 3. 데이터베이스 생성
turso db create classics-hero

# 4. URL 확인
turso db show classics-hero --url

# 5. 토큰 생성
turso db tokens create classics-hero

# 6. .env 파일에 설정
TURSO_DATABASE_URL=libsql://classics-hero-xxx.turso.io
TURSO_AUTH_TOKEN=eyJhbGciOiJFZERTQSIsInR5cCI6...

# 7. 데이터 시딩
python seed_data.py
```

## Architecture

### 전체 구조

```
classics_heros/
├── backend/                 # FastAPI 백엔드
│   ├── main.py              # FastAPI 앱 진입점
│   ├── database.py          # Turso/SQLite 연결 + 테이블 스키마
│   ├── models.py            # Pydantic 모델
│   ├── seed_data.py         # 초기 데이터 시딩
│   ├── requirements.txt
│   ├── routers/
│   │   ├── books.py         # /api/books
│   │   ├── heroes.py        # /api/heroes
│   │   ├── chapters.py      # /api/chapters
│   │   └── words.py         # /api/words (고어 사전)
│   └── data/
│       └── classics.db      # SQLite DB 파일
│
├── public/
│   ├── manifest.json        # PWA 웹 앱 매니페스트
│   ├── service-worker.js    # PWA Service Worker
│   ├── ClassicHero.png      # 앱 아이콘 (512x512)
│   └── heroes/              # 영웅 프로필 이미지 (지브리 스타일)
│       ├── aesop.png
│       ├── grimm.png
│       ├── ohenry.png
│       ├── franklin.png
│       ├── aurelius.png
│       └── lincoln.png
│
├── src/                     # React 프론트엔드
│   ├── api/
│   │   └── index.js         # API 유틸리티
│   ├── components/
│   │   ├── BookList/        # 도서 목록
│   │   ├── BookReader/      # 읽기 모드
│   │   ├── SpeakingMode/    # 말하기 모드
│   │   ├── TalkToHero/      # 영웅과 대화
│   │   │   ├── TalkToHero.jsx
│   │   │   ├── HeroSelector.jsx
│   │   │   ├── HeroCard.jsx
│   │   │   ├── ChatInterface.jsx
│   │   │   ├── ChatInput.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   └── InsightReport.jsx
│   │   ├── BrowserCheck/    # Chrome 브라우저 체크
│   │   │   ├── BrowserCheck.jsx
│   │   │   └── BrowserCheck.css
│   │   ├── InstallPrompt/   # PWA 홈화면 추가 안내
│   │   │   ├── InstallPrompt.jsx
│   │   │   └── InstallPrompt.css
│   │   ├── SplashScreen/    # 스플래시 화면
│   │   ├── Dictionary/      # 단어 사전
│   │   └── ...
│   └── hooks/               # 커스텀 훅
│
└── vite.config.js           # Vite + API 프록시 설정 (port 8001)
```

### App Structure

```
App.jsx (Mode Router)
├── SplashScreen → 로딩 화면 (made by ParkJunHyoung)
├── BrowserCheck → Chrome 브라우저 체크 (Android)
├── InstallPrompt → PWA 홈화면 추가 안내 (자동 표시)
├── BookList → 도서관 (API: /api/books)
├── BookReader → 읽기 모드 (mode: 'reading')
├── SpeakingMode → 말하기 모드 (mode: 'speaking')
└── TalkToHero → 영웅과 대화 (API: /api/heroes)
    ├── HeroSelector → 영웅 선택 화면
    │   └── HeroCard → 영웅 카드 (프로필 이미지 표시)
    └── ChatInterface → 대화 화면
        ├── ChatInput → 음성/텍스트 입력 (STT 기본)
        └── MessageBubble → 메시지 버블 (번역 버튼)
```

## Database Schema

### heroes 테이블
```sql
id, name, name_ko, period, nationality, nationality_ko
occupation, occupation_ko, avatar, difficulty
summary, summary_ko, achievements (JSON), quotes (JSON)
conversation_tone, conversation_personality, system_prompt
recommended_topics (JSON)
tts_rate, tts_pitch
portrait_image              -- 영웅 프로필 이미지 경로
```

### books 테이블
```sql
id, title, author, difficulty (easy/medium/advanced)
genre, year, description, cover_color, cover_image
word_count, reading_time, learning_focus (JSON)
hero_id (FK → heroes)
```

### chapters 테이블
```sql
id, book_id (FK), chapter_number, title
content, word_count, vocabulary (JSON)
```

### archaic_words 테이블 (고어 사전)
```sql
id, word, modern_equivalent, part_of_speech
definition, definition_ko, example_sentence
usage_note, usage_note_ko, category
```

### semantic_shifts 테이블 (의미 변화 단어)
```sql
id, word, historical_meaning, historical_meaning_ko
modern_meaning, modern_meaning_ko
example_historical, example_modern, tip, tip_ko
```

## API Endpoints

```
GET  /api/books                    # 모든 책 (챕터 포함)
GET  /api/books?difficulty=easy    # 난이도 필터
GET  /api/books/{book_id}          # 특정 책 상세
GET  /api/books/{book_id}/chapters # 책의 챕터 목록

GET  /api/heroes                   # 모든 영웅
GET  /api/heroes?difficulty=easy   # 난이도 필터
GET  /api/heroes/{hero_id}         # 특정 영웅 상세

GET  /api/health                   # 헬스체크
```

## Content (6명 영웅)

### 난이도별 영웅 구성
| 난이도 | 영웅 | 프로필 이미지 |
|--------|------|---------------|
| Easy | Aesop (이솝), Brothers Grimm (그림 형제) | aesop.png, grimm.png |
| Medium | O. Henry (오 헨리), Benjamin Franklin (벤자민 프랭클린) | ohenry.png, franklin.png |
| Advanced | Marcus Aurelius (마르쿠스 아우렐리우스), Abraham Lincoln (에이브러햄 링컨) | aurelius.png, lincoln.png |

## Custom Hooks

| Hook | Purpose |
|------|---------|
| `useAIChat` | OpenAI API 채팅 |
| `useHeroChat` | 영웅 캐릭터 AI 대화 |
| `useTTS` | Web Speech API TTS (자동 재생) |
| `useSTT` | Web Speech API STT (음성 인식) |
| `useRecorder` | MediaRecorder 녹음 |
| `useTranslation` | OpenAI/MyMemory 번역 |
| `usePronunciationAnalysis` | AI 발음 분석 |
| `useReadingProgress` | 독서 진행률 (localStorage) |

## Key Features

### PWA (Progressive Web App)
- **Chrome 브라우저 필수**: 모바일에서 Chrome이 아닌 브라우저 접속 시 Chrome 설치 안내
  - **Android**: Chrome이 아닌 브라우저 접속 시 설치 안내 표시
  - **iOS**: Safari는 STT(음성인식) 미지원으로 Chrome 권장 안내 표시
  - STT/TTS 완벽 지원은 Chrome에서만 가능
- **홈화면 추가**: 모바일 기기 홈화면에 앱 아이콘 추가 가능
- **자동 설치 안내**: 앱 시작 3초 후 설치 프롬프트 자동 표시
  - Android Chrome: 원클릭 설치 버튼
  - iOS Safari: 단계별 설치 안내
- **Service Worker**: 오프라인 지원 및 빠른 로딩
- **Web App Manifest**: 앱 메타데이터 (이름, 아이콘, 테마 색상)
- **설치 거부 시**: 7일간 프롬프트 미표시
- **크레딧**: 스플래시 화면에 "made by ParkJunHyoung" 표시

### Talk to Hero (영웅과 대화)
- 6명의 역사적 인물과 영어 대화
- **음성 중심 UI**: STT로 말하기, TTS로 듣기 (기본 활성화)
- 지브리 스타일 프로필 이미지
- 영웅 메시지 자동 TTS 재생 (토글 가능)
- STT 종료 후 자동 메시지 전송
- 번역 버튼으로 한글 번역 표시
- 추천 대화 주제 제공
- 대화 리포트 기능

### Reading Mode
- 단락 클릭 → 번역 표시
- 단어 선택 → 사전 모달
- TTS로 원어민 발음 듣기
- 챕터 진행률 추적, 북마크

### Speaking Mode
- TTS로 원문 듣기 (속도 조절)
- 녹음 후 재생
- 실시간 STT 발음 캡처
- AI 발음 분석 및 피드백

## Data Storage

**Turso (Production) / SQLite (Development):**
- 환경변수 `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` 설정 시 Turso 사용
- 미설정 시 로컬 SQLite (`backend/data/classics.db`) 사용
- 테이블: books, chapters, heroes, archaic_words, semantic_shifts

**localStorage:**
- `openai_api_key` - OpenAI API 키
- `progress-{bookId}` - 책별 진행률
- `bookmarks-{bookId}` - 책별 북마크

## External APIs

**OpenAI API (gpt-3.5-turbo):**
- Talk to Hero 대화
- 발음 분석 및 피드백
- 번역 (우선)

**MyMemory Translation API:**
- 번역 Fallback (무료)

**Dictionary API:**
- 단어 정의 (무료)

**Browser APIs:**
- Web Speech API (TTS/STT)
- MediaRecorder API (녹음)

## Tech Stack

**Backend:**
- Python 3.x
- FastAPI
- SQLite
- Pydantic

**Frontend:**
- React 19
- Vite 7
- CSS (컴포넌트별 CSS 파일)
- ESLint

## File Naming Convention

- Components: `BookReader.jsx`, `ChatInterface.jsx`
- Hooks: `useTTS.js`, `useSTT.js`
- CSS: `BookReader.css`, `ChatInterface.css`
- API Router: `books.py`, `heroes.py`
- 이미지: `public/heroes/{hero_id}.png`

## TalkToHero 컴포넌트 구조

```
TalkToHero.jsx
├── HeroSelector.jsx          # 영웅 선택 화면
│   └── HeroCard.jsx          # 영웅 카드 (portraitImage 표시)
│       ├── hero-avatar-image # 프로필 이미지
│       └── hero-avatar-emoji # 폴백 이모지
│
└── ChatInterface.jsx         # 대화 화면
    ├── header                # 영웅 정보 + 액션 버튼
    │   ├── hero-info-avatar-img  # 헤더 프로필 이미지
    │   ├── auto-tts-btn      # 자동 TTS 토글
    │   ├── report-btn        # 대화 리포트
    │   └── reset-chat-btn    # 대화 초기화
    │
    ├── hero-intro-card       # 영웅 소개 카드
    │   ├── intro-portrait    # 프로필 이미지
    │   └── intro-topic-btn   # 추천 대화 주제
    │
    ├── MessageBubble.jsx     # 메시지 버블
    │   ├── avatar-image      # 영웅 프로필 이미지
    │   ├── translate-btn     # 번역 버튼
    │   └── message-translation # 한글 번역
    │
    └── ChatInput.jsx         # 입력 UI
        ├── voice-input-mode  # 음성 모드 (기본)
        │   ├── main-mic-button   # 마이크 버튼
        │   ├── keyboard-toggle   # 키보드 전환
        │   └── voice-send-btn    # 전송 버튼
        │
        ├── chat-input-form   # 텍스트 모드
        │   ├── mic-toggle-btn    # 마이크 전환
        │   ├── chat-input-textarea
        │   └── send-button
        │
        ├── stt-status        # STT 상태 표시
        └── tts-status        # TTS 재생 중 표시
```

## Notes

- 백엔드 포트: `8001` (vite.config.js에서 프록시 설정)
- 백엔드와 프론트엔드 모두 실행 필요
- Vite 프록시로 `/api` 요청을 백엔드로 전달
- OpenAI API 키 필요 (Talk to Hero, 발음 분석)
- 영웅 프로필 이미지는 `public/heroes/` 폴더에 저장
- TTS/STT는 브라우저 Web Speech API 사용 (Chrome 권장)
- **PWA**: 모바일 홈화면 추가 가능
  - **Chrome 필수**: 모바일에서 Chrome 브라우저 필수 (자동 안내)
    - Android: Chrome 외 브라우저에서 설치 안내
    - iOS: Safari는 STT 미지원으로 Chrome 권장
  - Android Chrome: 자동 설치 프롬프트
  - iOS Chrome: 더보기 메뉴 > "홈 화면에 추가"
  - Service Worker로 오프라인 지원
  - 설치 거부 시 7일간 미표시
- **브라우저 호환성**:
  - TTS (읽어주기): Chrome, Safari, Firefox, Edge 모두 지원
  - STT (음성인식): Chrome, Edge만 지원 (Safari, Firefox 미지원)
- **크레딧**: 스플래시 화면 하단에 "made by ParkJunHyoung" 표시
