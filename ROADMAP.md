# Roadmap

## 완료된 기능

- [x] 6권 고전 영어 책 + 6명 영웅 + 9개 시나리오
- [x] Reading / Speaking / Talk to Hero 모드
- [x] PWA 지원 (Chrome 브라우저 체크, 홈화면 추가)
- [x] 학습 진행 추적 (useProgress, 배지, 통계, 대시보드)
- [x] Today's Quest 오늘의 미션 (Daily Reading/Speaking/Chat)
- [x] 학습 달력 (월간 학습일 시각화)
- [x] GitHub Actions Keep-Alive (Render 콜드 스타트 완화)
- [x] 중요 단어/숙어 DB 캐싱

---

## 다음 목표 (Tier 1: 무료, 큰 효과)

### 나만의 단어장
- 읽기/대화 중 단어 저장 (별표)
- 플래시카드 복습 모드
- localStorage 활용

### 발음 점수 히스토리
- Speaking 결과 저장 및 그래프
- 취약 단어 리스트, 집중 연습

### 컨텐츠 확장
- 추가 책 4-5권 (Jane Austen, Dickens, Twain 등)
- 추가 영웅 3-4명
- 퀴즈/토론 시나리오

---

## 향후 계획 (Tier 2-3)

### Tier 2: 단기 개선
- AI 비용 최적화 (대화 히스토리 요약, 캐싱)
- 성능 모니터링 (Sentry, GA4)
- 개인화된 학습 (레벨 테스트, 맞춤 추천)

### Tier 3: 중장기
- 사용자 계정 시스템 (Firebase Auth, 클라우드 동기화)
- 실시간 문법 교정
- 소셜 기능 (친구, 리더보드)
- 오프라인 모드 강화

---

## 인프라

| 서비스 | 용도 | 비용 |
|--------|------|------|
| Vercel | 프론트엔드 | 무료 |
| Render | 백엔드 FastAPI | 무료 (콜드 스타트 있음) |
| Turso | DB (SQLite 호환) | 무료 |
| OpenAI | AI 대화/분석 | 종량제 (~$2-5/월 @20명) |
