# Changelog

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
