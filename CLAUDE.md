# CLAUDE.md

Claude Code를 위한 프로젝트 가이드

## Project Overview

**Classic Hero** - 공개 도메인 영어 고전 문학을 활용한 영어 학습 웹앱
- **Frontend:** React 19 + Vite 7
- **Backend:** FastAPI + Turso (SQLite 호환 엣지 DB)
- **학습 모드:** Reading, Speaking, Talk to Hero
- AI 기반 발음 분석 및 역사적 인물과의 대화 기능
- 음성 중심 UI (TTS/STT 기본 활성화)

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
│   │   ├── words.py         # /api/words (고어 사전)
│   │   ├── vocabulary.py    # /api/vocabulary (챕터별 중요 단어/숙어)
│   │   ├── auth.py          # /api/auth (Google OAuth)
│   │   └── sync.py          # /api/sync (크로스 디바이스 동기화)
│   └── data/
│       └── classics.db      # SQLite DB 파일
│
├── public/
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
│   │   ├── Dictionary/      # 단어 사전
│   │   └── ...
│   └── hooks/               # 커스텀 훅
│
└── vite.config.js           # Vite + API 프록시 설정 (port 8001)
```

### App Structure

```
App.jsx (Mode Router)
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

### chapter_vocabulary 테이블 (챕터별 중요 단어/숙어 - GPT 추출 결과 캐싱)
```sql
id, chapter_id (TEXT), word, definition
example, phonetic (IPA 발음 기호), is_idiom (0/1)
created_at
UNIQUE(chapter_id, word)
```

### chapter_translations 테이블 (챕터별 번역 캐싱)
```sql
chapter_id (PK), translation, created_at
```

### sentence_translations 테이블 (문장 단위 번역 캐싱)
```sql
text_hash (PK), source_text, translated_text
target_lang, created_at
```

### users 테이블 (Google OAuth 인증)
```sql
id, google_id (UNIQUE), email, name, picture
created_at, last_login_at
```

### user_sync_data 테이블 (크로스 디바이스 동기화)
```sql
user_id (PK, FK → users), data (JSON)
updated_at
```

## API Endpoints

```
GET    /api/books                          # 모든 책 (챕터 포함)
GET    /api/books?difficulty=easy          # 난이도 필터
GET    /api/books/{book_id}                # 특정 책 상세
GET    /api/books/{book_id}/chapters       # 책의 챕터 목록

GET    /api/heroes                         # 모든 영웅
GET    /api/heroes?difficulty=easy         # 난이도 필터
GET    /api/heroes/{hero_id}               # 특정 영웅 상세

GET    /api/vocabulary/chapter/{id}        # 챕터 중요 단어/숙어 조회
POST   /api/vocabulary/chapter/{id}        # 챕터 중요 단어/숙어 저장 (GPT 추출 결과)
DELETE /api/vocabulary/chapter/{id}        # 챕터 단어 캐시 삭제

POST   /api/auth/google                    # Google OAuth 로그인
POST   /api/sync/upload                    # 학습 데이터 업로드 (크로스 디바이스)
POST   /api/sync/download                  # 학습 데이터 다운로드

GET    /api/health                         # 헬스체크
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
| `useVocabularyExtraction` | GPT 기반 중요 단어/숙어 자동 추출 (DB 캐싱) |

## Key Features

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
- **중요 단어/숙어 자동 추출**: GPT-4o-mini가 챕터에서 중요 어휘 추출
  - 난이도별 추출 개수: easy(5개), medium(7개), advanced(10개)
  - 본문에 노란색 하이라이트 표시
  - IPA 발음 기호 제공 (단어만, 숙어는 제외)
  - 하단에 '📚 중요 단어 & 숙어' 섹션으로 정의/예문 표시
  - DB 캐싱으로 재방문 시 즉시 로드 (GPT 호출 없음)

### Speaking Mode
- TTS로 원문 듣기 (속도 조절)
- 녹음 후 재생
- 실시간 STT 발음 캡처
- AI 발음 분석 및 피드백

## Data Storage

**Turso (Production) / SQLite (Development):**
- 환경변수 `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` 설정 시 Turso 사용
- 미설정 시 로컬 SQLite (`backend/data/classics.db`) 사용
- 테이블:
  - books, chapters, heroes (기본 콘텐츠)
  - archaic_words, semantic_shifts (고어/의미변화 사전)
  - chapter_vocabulary (챕터별 중요 단어/숙어 캐싱)
  - chapter_translations, sentence_translations (번역 캐싱)
  - users, user_sync_data (Google OAuth + 크로스 디바이스 동기화)

**localStorage:**
- `openai_api_key` - OpenAI API 키
- `progress-{bookId}` - 책별 진행률
- `bookmarks-{bookId}` - 책별 북마크

## External APIs

**OpenAI API (gpt-4o-mini):**
- Talk to Hero 대화
- 발음 분석 및 피드백
- 번역 (우선)
- 중요 단어/숙어 자동 추출

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
- SQLite / Turso (libsql-client)
- Pydantic
- google-auth (Google OAuth 인증)
- PyJWT (JWT 토큰)

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
