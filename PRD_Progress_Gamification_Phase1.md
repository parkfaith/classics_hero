# PRD: Progress Tracking & Gamification (Phase 1)

**Product:** Classic Hero - 영어 학습 웹앱  
**Version:** 1.1.0  
**Author:** 우리따님아부지  
**Date:** 2026-02-03  
**Status:** Draft  

---

## Executive Summary

Classic Hero 앱에 **진행도 추적**과 **게이미피케이션** 기능을 추가하여 사용자의 학습 동기를 강화하고 지속적인 사용을 유도합니다.

### 목표
- 학습 진행 상황 시각화로 성취감 제공
- 배지 시스템으로 목표 설정 및 동기 부여
- 학습 통계로 자기 개선 인사이트 제공

### 접근 방식
- **Phase 1**: localStorage 기반 MVP (로그인 불필요)
- 빠른 구현 및 검증 (개발 기간: 2주)
- 사용자 데이터 Export/Import 기능 제공

---

## Problem Statement

### 현재 문제점
1. **진행 상황 불명확**: 어디까지 읽었는지, 얼마나 학습했는지 파악 어려움
2. **동기 부여 부족**: 단순 학습만으로는 지속성 유지 힘듦
3. **성취감 부재**: 완료한 콘텐츠에 대한 보상 없음
4. **학습 인사이트 부족**: 학습 패턴 분석 불가

### User Pain Points
> "어제까지 어디까지 읽었는지 기억이 안 나요."  
> "얼마나 학습했는지 확인하고 싶어요."  
> "목표가 있으면 더 동기부여가 될 것 같아요."

---

## Goals & Success Metrics

### Business Goals
- 일일 활성 사용자(DAU) 30% 증가
- 평균 세션 시간 20% 증가
- 7일 재방문율 40% 증가

### User Goals
- 학습 진행 상황 한눈에 파악
- 작은 성취를 통한 동기 부여
- 학습 습관 형성

### Success Metrics (3개월 후 측정)
- 배지 획득 사용자 비율: 60% 이상
- 통계 페이지 방문률: 40% 이상
- 7일 연속 학습 달성률: 20% 이상

---

## User Stories

### Epic 1: 진행도 추적
- **US-1.1**: 사용자는 완료한 챕터를 체크 표시로 확인할 수 있다
- **US-1.2**: 사용자는 책별 진행률을 퍼센트와 진행 바로 볼 수 있다
- **US-1.3**: 사용자는 전체 학습 진행률을 대시보드에서 확인할 수 있다

### Epic 2: 배지/업적 시스템
- **US-2.1**: 사용자는 특정 조건 달성 시 배지를 획득한다
- **US-2.2**: 사용자는 획득한 배지를 모아볼 수 있다
- **US-2.3**: 사용자는 다음 배지 획득 조건을 미리 확인할 수 있다

### Epic 3: 학습 통계
- **US-3.1**: 사용자는 총 학습 시간을 확인할 수 있다
- **US-3.2**: 사용자는 읽은 단어 수를 확인할 수 있다
- **US-3.3**: 사용자는 완료한 시나리오 수를 확인할 수 있다
- **US-3.4**: 사용자는 학습 통계를 시각적 차트로 볼 수 있다

### Epic 4: 데이터 관리
- **US-4.1**: 사용자는 학습 데이터를 JSON 파일로 내보낼 수 있다
- **US-4.2**: 사용자는 백업한 데이터를 다시 불러올 수 있다
- **US-4.3**: 사용자는 모든 학습 데이터를 초기화할 수 있다

---

## Feature Specifications

### 1. 진행도 추적 시스템

#### 1.1 챕터 완료 체크
**위치**: BookReader 컴포넌트

**기능**:
- 챕터 읽기 완료 시 자동 체크 (마지막 문단까지 스크롤)
- 수동 완료 버튼 제공
- 완료된 챕터는 체크 아이콘 표시 (✓)

**UI**:
```
[BookList]
└── 책 카드
    └── "3/10 챕터 완료 (30%)"
    
[BookReader]
└── 챕터 헤더
    └── [✓ 완료] 또는 [완료하기] 버튼
```

#### 1.2 진행률 시각화
**위치**: BookList, Dashboard

**시각적 요소**:
- 진행 바 (Progress Bar): 0-100%
- 퍼센트 표시: "30%"
- 완료 개수: "3/10 챕터"

**계산 로직**:
```javascript
progress = (completedChapters / totalChapters) * 100
```

#### 1.3 전체 대시보드
**신규 컴포넌트**: `Dashboard.jsx`

**표시 항목**:
- 전체 진행률 요약
- 최근 활동 (마지막 읽은 책)
- 획득한 배지 미리보기 (최대 3개)
- 통계 요약 (총 학습 시간, 읽은 단어 수)

---

### 2. 배지/업적 시스템

#### 2.1 배지 정의

| 배지 ID | 배지 이름 | 조건 | 아이콘 | 설명 |
|---------|----------|------|--------|------|
| `first_chapter` | 첫 걸음 | 첫 챕터 완료 | 🎯 | 첫 번째 챕터를 완료했습니다 |
| `chapter_10` | 독서광 | 10개 챕터 완료 | 📚 | 10개 챕터를 완료했습니다 |
| `chapter_50` | 마스터 리더 | 50개 챕터 완료 | 🏆 | 50개 챕터를 완료했습니다 |
| `all_heroes` | 영웅 수집가 | 모든 영웅과 대화 | 🎭 | 6명의 영웅 모두와 대화했습니다 |
| `first_book` | 완독자 | 첫 책 완료 | 📖 | 첫 번째 책을 완독했습니다 |
| `streak_7` | 주간 학습자 | 연속 7일 학습 | 🔥 | 7일 연속으로 학습했습니다 |
| `streak_30` | 월간 챌린저 | 연속 30일 학습 | ⭐ | 30일 연속으로 학습했습니다 |
| `words_1000` | 단어 마스터 | 1000단어 읽기 | 📝 | 1000개의 단어를 읽었습니다 |
| `speaking_10` | 발음 연습생 | Speaking 모드 10회 | 🎤 | Speaking 모드를 10회 완료했습니다 |

#### 2.2 배지 획득 플로우
```
사용자 행동
    ↓
조건 체크 (checkAchievements)
    ↓
배지 획득 감지
    ↓
축하 모달 표시 (🎉 "새 배지 획득!")
    ↓
localStorage 저장
```

#### 2.3 배지 컬렉션 UI
**신규 컴포넌트**: `BadgeCollection.jsx`

**레이아웃**:
```
[배지 컬렉션]
├── 획득한 배지 (밝게 표시)
│   ├── 🎯 첫 걸음
│   └── 📚 독서광
└── 잠긴 배지 (회색 표시)
    ├── 🔒 마스터 리더 (40/50 챕터)
    └── 🔒 주간 학습자 (5/7일)
```

---

### 3. 학습 통계 대시보드

#### 3.1 통계 항목

**신규 컴포넌트**: `Statistics.jsx`

| 통계 | 계산 방식 | 표시 형식 |
|------|----------|----------|
| 총 학습 시간 | 세션별 시간 누적 | "12시간 34분" |
| 읽은 단어 수 | 완료 챕터의 word_count 합산 | "15,420 단어" |
| 완료한 챕터 수 | 완료된 챕터 개수 | "23 챕터" |
| 완료한 책 수 | 100% 완료한 책 개수 | "2 권" |
| 영웅 대화 수 | Talk to Hero 세션 수 | "8 회" |
| 연속 학습 일수 | 현재 연속 기록 | "5 일" |
| 최장 연속 기록 | 역대 최고 기록 | "12 일" |

#### 3.2 시각화
```
[학습 통계]
├── 📊 주간 활동 (막대 그래프)
│   └── 월/화/수/목/금/토/일별 학습 시간
├── 📈 누적 진행률 (선 그래프)
│   └── 날짜별 완료 챕터 수
└── 🎯 목표 달성률 (도넛 차트)
    └── 완료/미완료 비율
```

#### 3.3 학습 시간 추적
**구현 방식**:
```javascript
// 세션 시작 시
sessionStorage.setItem('session_start', Date.now());

// 페이지 이탈/완료 시
const duration = Date.now() - sessionStart;
updateTotalStudyTime(duration);
```

---

### 4. 데이터 관리

#### 4.1 Export 기능
**위치**: Settings 또는 Dashboard

**기능**:
- 모든 진행 데이터를 JSON 파일로 다운로드
- 파일명: `classichero_backup_YYYYMMDD.json`

**데이터 구조**:
```json
{
  "version": "1.1.0",
  "exportDate": "2026-02-03T12:00:00Z",
  "progress": {
    "book-1": {
      "completedChapters": [1, 2, 3],
      "currentChapter": 4,
      "lastRead": "2026-02-03T11:30:00Z"
    }
  },
  "badges": {
    "first_chapter": {
      "unlocked": true,
      "unlockedAt": "2026-01-15T10:00:00Z"
    }
  },
  "statistics": {
    "totalStudyTime": 45000000,
    "totalWords": 15420,
    "completedChapters": 23,
    "heroConversations": 8,
    "currentStreak": 5,
    "maxStreak": 12
  },
  "streakData": {
    "lastStudyDate": "2026-02-03",
    "studyDates": ["2026-01-30", "2026-01-31", ...]
  }
}
```

#### 4.2 Import 기능
**기능**:
- JSON 파일 업로드
- 데이터 유효성 검증
- 기존 데이터 병합 옵션
  - "덮어쓰기": 기존 데이터 완전 대체
  - "병합": 더 높은 값 유지 (max)

**유효성 검사**:
```javascript
function validateBackup(data) {
  if (!data.version) return false;
  if (!data.progress || !data.badges) return false;
  // version 호환성 체크
  return true;
}
```

#### 4.3 데이터 초기화
**위치**: Settings

**기능**:
- 모든 진행 데이터 삭제
- 확인 모달 2단계
  1. "정말 삭제하시겠습니까?"
  2. "백업하지 않으면 복구할 수 없습니다"

---

## Technical Requirements

### 5.1 새로운 Custom Hook

#### `useProgress.js`
```javascript
// 진행도 관리
const {
  progress,              // 전체 진행 상황
  markChapterComplete,   // 챕터 완료 표시
  getBookProgress,       // 책별 진행률
  getTotalProgress       // 전체 진행률
} = useProgress();
```

#### `useBadges.js`
```javascript
// 배지 시스템
const {
  badges,                // 획득 배지 목록
  checkAchievements,     // 조건 체크
  getUnlockedBadges,     // 획득한 배지
  getLockedBadges,       // 잠긴 배지
  newBadge               // 새로 획득한 배지 (모달용)
} = useBadges();
```

#### `useStatistics.js`
```javascript
// 학습 통계
const {
  stats,                 // 통계 데이터
  updateStudyTime,       // 학습 시간 업데이트
  incrementChapter,      // 챕터 완료 카운트
  getWeeklyActivity,     // 주간 활동
  updateStreak           // 연속 학습 업데이트
} = useStatistics();
```

#### `useDataManager.js`
```javascript
// 데이터 백업/복원
const {
  exportData,            // JSON 내보내기
  importData,            // JSON 가져오기
  resetAllData           // 전체 초기화
} = useDataManager();
```

### 5.2 localStorage 키 구조

```javascript
// 기존
'progress-{bookId}'           // 책별 진행률
'bookmarks-{bookId}'          // 책별 북마크
'openai_api_key'              // API 키

// 신규 추가
'user_progress'               // 전체 진행 상황
'user_badges'                 // 배지 데이터
'user_statistics'             // 통계 데이터
'streak_data'                 // 연속 학습 기록
'session_timestamps'          // 세션 기록
```

### 5.3 데이터 구조 상세

#### user_progress
```javascript
{
  books: {
    'book-1': {
      completedChapters: [1, 2, 3],
      totalChapters: 10,
      currentChapter: 4,
      lastRead: '2026-02-03T11:30:00Z',
      progress: 30  // percentage
    }
  },
  heroes: {
    'aesop': {
      conversationCount: 3,
      firstTalkDate: '2026-01-20T10:00:00Z',
      lastTalkDate: '2026-02-02T15:00:00Z'
    }
  }
}
```

#### user_badges
```javascript
{
  'first_chapter': {
    unlocked: true,
    unlockedAt: '2026-01-15T10:00:00Z',
    shownModal: true  // 모달 표시 여부
  },
  'chapter_10': {
    unlocked: false,
    progress: 5  // 5/10
  }
}
```

#### user_statistics
```javascript
{
  totalStudyTime: 45000000,     // ms
  totalWords: 15420,
  completedChapters: 23,
  completedBooks: 2,
  heroConversations: 8,
  speakingSessions: 5,
  currentStreak: 5,
  maxStreak: 12,
  weeklyActivity: {
    '2026-W05': {
      mon: 1200000,  // ms
      tue: 1800000,
      wed: 0,
      // ...
    }
  }
}
```

#### streak_data
```javascript
{
  lastStudyDate: '2026-02-03',
  studyDates: [
    '2026-01-30',
    '2026-01-31',
    '2026-02-01',
    '2026-02-02',
    '2026-02-03'
  ],
  currentStreak: 5,
  longestStreak: 12
}
```

---

## UI/UX Requirements

### 6.1 새로운 컴포넌트

#### Dashboard.jsx
- 위치: 메인 네비게이션 추가
- 레이아웃: 카드 기반 대시보드
- 섹션:
  - Welcome 메시지
  - 진행률 요약
  - 배지 미리보기 (최근 3개)
  - 통계 요약
  - 빠른 액션 (이어 읽기)

#### BadgeCollection.jsx
- 위치: Dashboard 또는 별도 페이지
- 레이아웃: 그리드 (3열)
- 카드 스타일:
  - 획득: 컬러풀, 아이콘 밝게
  - 미획득: 회색, 진행률 표시

#### Statistics.jsx
- 위치: Dashboard 또는 별도 페이지
- 차트 라이브러리: Chart.js 또는 Recharts
- 반응형: 모바일 최적화

#### BadgeUnlockModal.jsx
- 트리거: 배지 획득 시 자동
- 애니메이션: 축하 효과 (confetti)
- 버튼: "확인" (모달 닫기)

#### ExportImportModal.jsx
- 위치: Settings
- 탭:
  - Export: 다운로드 버튼
  - Import: 파일 업로드
  - Reset: 초기화 (위험 표시)

### 6.2 기존 컴포넌트 수정

#### BookList.jsx
**추가 요소**:
- 책 카드에 진행률 표시
- "완료" 배지 (100% 시)

```jsx
<div className="book-card">
  <h3>{book.title}</h3>
  <ProgressBar percent={30} />
  <p>3/10 챕터 완료</p>
</div>
```

#### BookReader.jsx
**추가 요소**:
- 챕터 완료 버튼
- 자동 완료 감지 (마지막 문단 뷰포트 진입)

```jsx
<div className="chapter-header">
  <h2>Chapter {chapterNumber}</h2>
  {isCompleted ? (
    <span className="completed-badge">✓ 완료</span>
  ) : (
    <button onClick={markComplete}>완료하기</button>
  )}
</div>
```

#### TalkToHero.jsx
**추가 로직**:
- 대화 종료 시 통계 업데이트
- 새로운 영웅과 첫 대화 시 배지 체크

#### App.jsx
**라우팅 추가**:
```jsx
<Routes>
  <Route path="/" element={<BookList />} />
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/badges" element={<BadgeCollection />} />
  <Route path="/statistics" element={<Statistics />} />
  {/* 기존 라우트 */}
</Routes>
```

### 6.3 Navigation 업데이트
**메인 네비게이션 추가**:
```
[홈] [대시보드] [배지] [통계] [설정]
```

### 6.4 스타일 가이드
- **색상**:
  - 진행 바: 그라데이션 (primary → secondary)
  - 배지: 골드(획득), 회색(미획득)
  - 통계 차트: 앱 주 색상 계열

- **애니메이션**:
  - 배지 획득: Scale + Fade In
  - 진행률: Smooth transition
  - 통계 차트: Lazy loading animation

- **반응형**:
  - 모바일: 단일 컬럼
  - 태블릿: 2컬럼 그리드
  - 데스크톱: 3컬럼 그리드

---

## Implementation Plan

### Phase 1.1: 기본 인프라 (Week 1)

**Day 1-2: 데이터 구조 및 훅**
- [ ] `useProgress` 훅 구현
- [ ] `useBadges` 훅 구현
- [ ] `useStatistics` 훅 구현
- [ ] localStorage 스키마 정의

**Day 3-4: 진행도 추적**
- [ ] BookReader에 완료 버튼 추가
- [ ] 자동 완료 감지 로직
- [ ] BookList에 진행률 표시
- [ ] 진행 바 컴포넌트

**Day 5: 테스트**
- [ ] 진행도 저장/로드 테스트
- [ ] 여러 책 동시 진행 테스트
- [ ] Edge case 처리

### Phase 1.2: 배지 & 통계 (Week 2)

**Day 1-2: 배지 시스템**
- [ ] 배지 정의 및 조건 로직
- [ ] BadgeCollection 컴포넌트
- [ ] BadgeUnlockModal 컴포넌트
- [ ] 배지 획득 알림

**Day 3-4: 통계 대시보드**
- [ ] Statistics 컴포넌트
- [ ] 차트 통합 (Chart.js)
- [ ] 주간/월간 통계
- [ ] 학습 시간 추적

**Day 5: 통합 & 테스팅**
- [ ] Dashboard 컴포넌트
- [ ] 전체 플로우 테스트
- [ ] 모바일 반응형 확인

### Phase 1.3: 데이터 관리 (Week 2 추가)

**Day 1-2: Export/Import**
- [ ] `useDataManager` 훅
- [ ] Export 기능 (JSON 다운로드)
- [ ] Import 기능 (파일 업로드)
- [ ] 데이터 유효성 검증

**Day 3: 설정 페이지**
- [ ] ExportImportModal
- [ ] 초기화 기능
- [ ] 경고 메시지

**Day 4-5: QA & 배포**
- [ ] 전체 기능 통합 테스트
- [ ] 크로스 브라우저 테스트
- [ ] 성능 최적화
- [ ] 배포 (Vercel)

---

## Dependencies

### 새로운 npm 패키지
```json
{
  "chart.js": "^4.4.0",           // 통계 차트
  "react-chartjs-2": "^5.2.0",    // React wrapper
  "canvas-confetti": "^1.9.0"     // 배지 획득 축하 효과
}
```

### 기존 패키지 활용
- React 19
- localStorage (built-in)
- CSS (컴포넌트별)

---

## Risk & Mitigation

### Risk 1: localStorage 용량 제한
- **Risk**: 5-10MB 제한, 데이터 증가 시 초과 가능
- **Mitigation**: 
  - 필수 데이터만 저장
  - 오래된 세션 데이터 주기적 정리
  - 용량 체크 로직 추가

### Risk 2: 브라우저 캐시 삭제
- **Risk**: 사용자가 캐시 삭제 시 모든 진행 손실
- **Mitigation**:
  - Export 기능 적극 안내
  - 주기적 백업 권장 알림
  - "데이터는 기기에만 저장됩니다" 명확한 안내

### Risk 3: 멀티 디바이스 사용
- **Risk**: 디바이스 간 데이터 동기화 불가
- **Mitigation**:
  - Export/Import로 수동 이전 가능
  - Phase 2에서 클라우드 동기화 고려
  - 현재는 "주 기기 사용 권장" 안내

### Risk 4: 날짜 기반 연속 학습 오류
- **Risk**: 시간대 차이, 날짜 변경 등으로 연속 기록 오류
- **Mitigation**:
  - UTC 기준 날짜 사용
  - 로컬 타임존 변환 정확히 처리
  - 하루 여유 (24시간 이내 학습 인정)

### Risk 5: 성능 저하
- **Risk**: 통계 계산, 차트 렌더링으로 인한 성능 이슈
- **Mitigation**:
  - 통계 데이터 캐싱
  - 차트 Lazy Loading
  - 무거운 계산은 Web Worker 고려

---

## Success Criteria

### Launch Criteria (배포 전 필수)
- [ ] 모든 배지가 정상 획득됨
- [ ] 진행률이 정확히 계산됨
- [ ] Export/Import가 정상 작동
- [ ] 모바일에서 UI 깨짐 없음
- [ ] Chrome, Safari, Firefox 테스트 완료

### Quality Criteria
- [ ] 페이지 로드 속도 < 2초
- [ ] 통계 차트 렌더링 < 1초
- [ ] localStorage 사용량 < 1MB (평균)
- [ ] 배지 획득 알림 지연 < 500ms

### User Experience Criteria
- [ ] 새 사용자도 배지 시스템 이해 가능
- [ ] 진행률이 직관적으로 보임
- [ ] Export 프로세스 3단계 이내
- [ ] 데이터 손실 위험 명확히 인지

---

## Future Enhancements (Phase 2 대비)

### 클라우드 동기화
- 익명 사용자 ID 발급
- Turso DB에 user_progress 테이블
- 자동 백업 (주기적)

### 소셜 기능
- 친구와 진행률 비교
- 리더보드
- 공유 기능 (SNS)

### 고급 분석
- 학습 패턴 AI 분석
- 맞춤형 추천
- 약점 진단 및 보완

### 추가 배지
- 특정 영웅과 10회 대화
- 완벽한 발음 달성
- 1만 단어 읽기
- 모든 책 완독

---

## Appendix

### A. 배지 아이콘 후보
- 🎯 첫 걸음
- 📚 독서광  
- 🏆 마스터 리더
- 🎭 영웅 수집가
- 📖 완독자
- 🔥 주간 학습자
- ⭐ 월간 챌린저
- 📝 단어 마스터
- 🎤 발음 연습생

### B. localStorage 예상 용량
```
user_progress: ~50KB (100권 기준)
user_badges: ~5KB
user_statistics: ~20KB
streak_data: ~10KB
session_timestamps: ~30KB

총 예상: ~115KB (매우 안전)
```

### C. 참고 링크
- Chart.js: https://www.chartjs.org/
- Canvas Confetti: https://www.kirilv.com/canvas-confetti/
- localStorage Best Practices: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

---

## Change Log

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-02-03 | 우리따님아부지 | Initial draft |

---

**Approval:**
- [ ] Product Manager
- [ ] Engineering Lead  
- [ ] Design Lead
- [ ] QA Lead

**Next Steps:**
1. PRD 리뷰 및 피드백 수집
2. 기술 스펙 상세화
3. 디자인 목업 작성
4. 개발 시작 (Week 1)
