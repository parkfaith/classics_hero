# 📝 Changelog

## 2026-01-30 - 주요 버그 수정 및 기능 개선

### 🐛 버그 수정

#### 1. 중요단어/숙어 표시 수정
**문제**
- 모바일에서 중요단어/숙어가 표시되지 않음
- 일부 챕터에서만 작동, 대부분 챕터에서 미표시

**원인**
- `chapter_id` 타입 불일치 (TEXT vs INTEGER)
- 모든 Hook 파일에서 `/api/...` 상대 경로 사용
- Vercel 배포 환경에서 API 요청이 잘못된 URL로 전송 (404 에러)

**해결**
- `backend/routers/vocabulary.py`: chapter_id 파라미터를 `int`로 변경
- `backend/database.py`: chapter_vocabulary 테이블 스키마 수정 (INTEGER + FOREIGN KEY)
- `src/api/index.js`: API_BASE를 export하여 전역 사용
- 모든 Hook 파일에서 API_BASE import:
  - `useVocabularyExtraction.js`
  - `usePronunciationAnalysis.js`
  - `useTranslation.js`
  - `useAIChat.js`
  - `useHeroChat.js`
- 프로덕션/로컬 환경 자동 감지 로직 추가

**결과**
- ✅ DB 캐싱 로직 정상 작동
- ✅ 첫 사용자만 LLM 호출, 이후 사용자는 DB에서 조회 (비용 절감)

---

#### 2. 영웅 불러오기 오류 수정
**문제**
- Heroes API에서 500 Internal Server Error 발생
- CORS 에러: "No 'Access-Control-Allow-Origin' header"

**원인**
- `scenarios` JSON 컬럼에 이모지(📖, ✍️ 등) 포함
- `json.loads()` 파싱 실패: "Invalid control character at: line 1 column 60"

**해결**
- `backend/routers/heroes.py`: JSON 파싱 에러 핸들링 추가
- 파싱 실패 시 빈 배열 반환하여 서비스 중단 방지
- Turso DB에서 scenarios를 이모지 제거 버전으로 재구성

**결과**
- ✅ 500 에러 방지
- ✅ 모든 영웅 정상 로딩

---

### ✨ 기능 개선

#### 3. 시나리오 전체 재구성
**문제**
- 시나리오 길이가 10-15분으로 너무 길어 사용자가 지루함을 느낌
- 완료율 저하

**개선**
- 모든 시나리오를 **3-5분 이내**로 단축
- 목표(objectives)를 2개로 단순화
- AI에게 간결하고 빠르게 진행하도록 명확한 systemPromptAddition 추가
- 이모지 제거 (JSON 파싱 안정성 확보)

**시나리오 구성** (총 9개)
- **Aesop** (Easy): 2개
  - Learn a Fable (3분)
  - Guess the Moral (4분)
- **Brothers Grimm** (Easy): 1개
  - Quick Fairy Tale (3분)
- **O. Henry** (Medium): 1개
  - Story with a Twist (4분)
- **Benjamin Franklin** (Medium): 2개
  - Learn One Virtue (4분)
  - Learn a Proverb (3분)
- **Marcus Aurelius** (Advanced): 1개
  - One Stoic Idea (4분)
- **Abraham Lincoln** (Advanced): 2개
  - Famous Speech Phrase (5분)
  - Leadership Lesson (4분)

**결과**
- ✅ 사용자 참여도 향상 (5분 이내 완료 가능)
- ✅ 명확한 목표로 학습 효과 증대

---

#### 4. 대화 취소 기능 추가
**문제**
- STT 녹음 중 또는 완료 후 취소할 수 없음
- 실수로 말한 내용을 수정할 방법이 없음
- 자동 전송으로 인한 의도치 않은 메시지 전송

**개선**
- 자동 전송 제거 (사용자가 명시적으로 전송/취소 선택)
- 빨간색 취소 버튼(✖️) 추가
  - STT 녹음 중: 버튼 클릭 시 녹음 중단 + 텍스트 삭제
  - STT 완료 후: 버튼 클릭 시 인식된 텍스트 삭제 + 다시 시작
- 명확한 UX 제공:
  - 🎤 마이크 버튼 (중앙, 파란색)
  - ✖️ 취소 버튼 (왼쪽, 빨간색)
  - 📤 전송 버튼 (오른쪽, 초록색)

**파일 수정**
- `src/components/TalkToHero/ChatInput.jsx`
- `src/components/TalkToHero/ChatInput.css`

**결과**
- ✅ 사용자가 대화를 완전히 제어 가능
- ✅ 실수 방지 및 UX 개선

---

### 🔧 기술적 개선

#### 인프라 구성 확인
- **Frontend**: Vercel (React 19 + Vite 7)
- **Backend**: Render.com (FastAPI)
- **Database**: Turso (SQLite-compatible)
- **AI**: OpenAI gpt-4o-mini
- **CORS**: Vercel ↔ Render 정상 연결 확인

#### 환경변수 설정
- Vercel: `VITE_API_URL` 설정 확인
- Render: `CORS_ORIGINS`, `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` 설정 확인

---

### 📊 변경 통계
- **수정된 파일**: 10개
- **새로 생성된 파일**: 6개 (SQL 스크립트, 문서)
- **해결된 버그**: 4개
- **추가된 기능**: 2개
- **커밋 수**: 5개

---

## 이전 변경 내역

### 2026-01-29
- UI/UX 개선 및 롤플레잉 시나리오 시간 단축
- 중요 단어/숙어 추출 결과 DB 캐싱 기능 추가
- 읽기 모드에 중요 단어/숙어 자동 추출 기능 추가
- 설정 화면의 AI 모델 정보를 gpt-4o-mini로 업데이트
- OpenAI 모델을 gpt-4o-mini로 업그레이드
