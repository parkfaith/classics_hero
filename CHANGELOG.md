# Changelog

## [Unreleased]

### Fixed

- **Mobile TTS**: "Talk to Hero"에서 오디오가 제때 재생되지 않던 문제 해결 (사용자 입력 시 오디오 컨텍스트 잠금 해제).
- **BookReader**: TTS 시작/정지 시 또는 간헐적으로 페이지가 최상단으로 스크롤되는 현상 수정.
- **BookReader**: TTS 재생/정지 버튼 상태가 올바르게 업데이트되지 않던 문제 수정.
- **BrowserCheck**: 모바일 Chrome에서 "Chrome 브라우저 권장" 경고가 반복적으로 뜨거나 오작동하던 문제 해결 (감지 로직 개선 및 다시 보지 않기 기능 추가).

## 2026-02-11 - Footer 간결화 & Today's Quest 영웅 순환 개선

### 기능 개선

- **CORS 도메인 추가**: jobible.net 커스텀 도메인 허용
  - `https://www.jobible.net`, `https://jobible.net` 추가
- **API URL 로직 개선**: 로컬/배포 환경 분기를 명확하게 변경
  - 로컬: Vite 프록시(`/api`), 배포: Render API 직접 호출(하드코딩 fallback)
- **Today's Quest 영웅 매일 변경**: 시드 랜덤 → 일수 기반 순환으로 변경
  - 기존: 날짜 시드 랜덤으로 연속 같은 영웅 나올 수 있음 (~16% 확률)
  - 변경: `dayIndex % heroCount`로 매일 반드시 다른 영웅 배정 (6일 주기 순환)

### UI 개선

- **Footer 대폭 간소화**: 클릭 불가한 텍스트 섹션 모두 제거
  - 제거: 학습 기능, 리소스, 정보 섹션 (4열 그리드 레이아웃)
  - 유지: 저작권, Project Gutenberg 링크, OpenAI 크레딧, 저자 정보
  - 한 줄 컴팩트 레이아웃으로 변경하여 콘텐츠 영역 확보
- **모바일 하단 탭바 가림 방지**: margin-bottom 적용

### 파일

- 수정: `Footer.jsx` (불필요한 섹션 제거, 저작권 정보만 유지)
- 수정: `Footer.css` (컴팩트 레이아웃, 모바일 탭바 여백)
- 수정: `useTodayQuest.js` (영웅 선택 로직 순환 방식으로 변경)
- 수정: `backend/main.py` (CORS 허용 도메인에 jobible.net 추가)
- 수정: `src/api/index.js` (API URL 분기 로직 개선)

---

## 2026-02-10 - 태블릿(아이패드) 반응형 레이아웃 수정 및 iPad Safari 감지

### 버그 수정

- **상단 네비게이션**: 아이패드 Pro 11인치(834px) 등 태블릿에서 메뉴 정렬 깨지는 문제 수정
  - 1024px 이하 태블릿 브레이크포인트 추가
  - 로고, 메뉴 아이템 크기/간격 축소
- **하단 Footer**: 태블릿 해상도에서 텍스트 정렬 및 간격 개선
- **iPad Safari 감지**: iPadOS 13+ Safari에서 Chrome 설치 안내가 표시되지 않던 문제 수정
  - iPadOS 13+는 User Agent를 Mac 데스크톱으로 보고하여 기존 감지 실패
  - `navigator.maxTouchPoints > 1` + Mac 플랫폼 체크로 iPad 감지 추가

### 파일

- 수정: `Navigation.css` (태블릿 브레이크포인트 추가)
- 수정: `Footer.css` (태블릿 브레이크포인트 추가)
- 수정: `BrowserCheck.jsx` (iPadOS 13+ 감지 로직 추가)

---

## 2026-02-09 - Today's Quest 개선: 난이도 조정, 대화 종료, 문법 피드백

### 기능 개선

- **Daily Reading 난이도 조정**: 초중급 수준으로 변경
  - 구절 길이 3~5문장 → 2~3문장으로 축소
  - 5~15단어 범위의 쉬운 문장 우선 선택
  - 세미콜론/콜론 없는 단순 구조 문장 필터링
- **대화 종료 기능**: "👋 대화 마치기" 버튼 추가
  - 사용자가 1회 이상 대화 후 버튼 표시
  - 영웅이 자연스럽게 작별 인사 (질문 없이 종료)
  - 작별 후 "돌아가기" 버튼으로 화면 전환
- **문법/어법 피드백**: 영웅 대화 중 자동 교정
  - 형식: "By the way, instead of '[틀린 표현]', you could say '[올바른 표현]'."
  - 한 번에 1개 오류만 지적 (학습자 부담 최소화)
  - 맞는 문장에는 가끔 칭찬 제공
- **완료된 미션 다시 보기**: 완료된 퀘스트 카드 클릭 시 내용 확인 가능
- **네비게이션 배지 실시간 업데이트**: 미션 완료 시 즉시 반영 (녹색 체크마크)

### 버그 수정

- Daily Chat 음성 입력 안정성 개선 (transcript/message 동시 확인)
- 하단 네비게이션 미션 배지 카운트 실시간 반영 안되던 문제 수정

### 파일

- 수정: `useTodayQuest.js` (난이도 필터링), `useHeroChat.js` (문법 피드백, 대화 종료)
- 수정: `ChatInterface.jsx`, `ChatInput.jsx` (대화 종료 UI)
- 수정: `QuestCard.jsx`, `DailyChat.jsx`, `TodayQuest.css` (완료 후 다시 보기)
- 수정: `Navigation.jsx`, `Navigation.css` (완료 배지 스타일)
- 수정: `App.jsx` (배지 카운트 실시간 반영)

---

## 2026-02-09 - Today's Quest (오늘의 미션) 시스템

### 신규 기능

- **Today's Quest**: 매일 3가지 미션 제공 (Daily Reading, Daily Speaking, Daily Chat)
  - 날짜 기반 시드 랜덤으로 매일 다른 컨텐츠 제공
  - 영웅별 매칭 도서에서 구절 자동 선택
  - 퀘스트 완료 시 스트릭/배지 연동
- **학습 달력**: 대시보드에 월간 달력 추가 (학습일/Perfect Day 시각화)
- **DailyReading UX**: 문장별 하이라이트, 번역 토글, 구절 설명
- **DailySpeaking UX**: 번역 버튼, 직관적 녹음 UI, 취소/완료 분리
- **DailyChat UX**: 퀘스트 모드 전용 UI (키보드 숨김, 돌아가기 버튼)

### 버그 수정

- hero.name_ko → hero.nameKo (camelCase 통일) - "undefined의 대표작" 수정
- b.hero_id → b.heroId - 영웅-도서 매칭 오류 수정

### 파일

- 신규: `src/hooks/useTodayQuest.js`, `src/components/TodayQuest/` (5개 컴포넌트)
- 수정: `App.jsx`, `Navigation.jsx`, `ChatInterface.jsx`, `ChatInput.jsx`, `Dashboard.jsx`

---

## 2026-02-03 - Progress Tracking & Gamification (Phase 1)

### 신규 기능

- **학습 진행 추적**: useProgress 훅 (책/챕터/영웅 대화 추적)
- **9개 배지 시스템**: useBadges 훅 (조건 자동 체크, confetti 효과)
- **학습 통계**: useStatistics 훅 (학습시간, 단어수, 스트릭)
- **데이터 관리**: useDataManager 훅 (Export/Import/초기화)
- **내 학습 페이지**: 대시보드, 배지 컬렉션, 통계 차트, 데이터 관리
- **자동 완료 감지**: BookReader IntersectionObserver
- **도넛 차트**: 읽기 진행률, 배지 획득, 완독률

### 파일

- 신규: `src/hooks/useProgress.js`, `useBadges.js`, `useStatistics.js`, `useDataManager.js`
- 신규: `src/components/MyLearning/` (5개 컴포넌트 + CSS)
- 수정: `BookReader.jsx`, `ChatInterface.jsx`, `SpeakingMode.jsx`, `App.jsx`, `Navigation.jsx`

---

## 2026-01-30 - 버그 수정 및 기능 개선

### 버그 수정

- 중요단어/숙어 표시 수정 (chapter_id 타입 불일치, API 경로 수정)
- 영웅 불러오기 오류 수정 (scenarios JSON 이모지 파싱 에러)

### 기능 개선

- 시나리오 전체 재구성 (3-5분 이내, 9개)
- 대화 취소 기능 추가 (STT 녹음 중 취소/전송 선택)
- 모든 Hook에서 API_BASE import 통일

---

## 2026-01-29 - 초기 기능

- UI/UX 개선 및 롤플레잉 시나리오 시간 단축
- 중요 단어/숙어 추출 결과 DB 캐싱
- 읽기 모드에 중요 단어/숙어 자동 추출
- OpenAI 모델을 gpt-4o-mini로 업그레이드
