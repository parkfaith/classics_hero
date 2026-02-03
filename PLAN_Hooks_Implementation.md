# Hooks 구현 계획 (Progress Tracking & Gamification Phase 1)

## 요약

PRD 기반으로 4개의 커스텀 훅을 구현합니다. 기존 훅과의 호환성을 고려하여 **하이브리드 접근** (기존 확장 + 신규 생성)을 사용합니다.

---

## 현재 상황

### 기존 훅 분석

| 기존 훅 | PRD 대응 | 처리 방안 |
|---------|----------|-----------|
| `useLearningProgress` | useProgress | **확장** (구조 유사) |
| `useLearningMotivation` | useBadges | **분리/폐기** (배지 정의가 다름) |
| 없음 | useStatistics | **신규** |
| 없음 | useDataManager | **신규** |

### 주요 차이점

- PRD 배지: **챕터/책 기반** (기존은 문장 기반)
- PRD: **영웅 대화 추적** 필요 (기존에 없음)
- PRD: **학습 시간/단어 수** 추적 필요 (기존에 없음)

---

## 구현 계획

### 1. useProgress.js (기존 확장)

**파일**: `src/hooks/useProgress.js`

**확장 내용**:
- 기존 `useLearningProgress` 기반
- 영웅 대화 추적 (`heroes` 객체) 추가
- 단어 수 추적 추가
- 마이그레이션 로직 추가

**API**:
```javascript
const {
  // 기존 유지
  getBookProgress,
  markChapterCompleted,
  isChapterCompleted,
  getBookStats,

  // 신규 추가
  markHeroConversation,      // 영웅 대화 기록
  getHeroStats,              // 영웅별 대화 통계
  getTotalProgress,          // 전체 진행률
} = useProgress();
```

**localStorage 키**: `user_progress`

---

### 2. useBadges.js (신규)

**파일**: `src/hooks/useBadges.js`

**9개 배지 정의** (PRD 기준):

| ID | 이름 | 조건 | 아이콘 |
|----|------|------|--------|
| `first_chapter` | 첫 걸음 | 1개 챕터 완료 | 🎯 |
| `chapter_10` | 독서광 | 10개 챕터 완료 | 📚 |
| `chapter_50` | 마스터 리더 | 50개 챕터 완료 | 🏆 |
| `all_heroes` | 영웅 수집가 | 6명 영웅 대화 | 🎭 |
| `first_book` | 완독자 | 1권 완료 | 📖 |
| `streak_7` | 주간 학습자 | 7일 연속 | 🔥 |
| `streak_30` | 월간 챌린저 | 30일 연속 | ⭐ |
| `words_1000` | 단어 마스터 | 1000단어 | 📝 |
| `speaking_10` | 발음 연습생 | Speaking 10회 | 🎤 |

**API**:
```javascript
const {
  badges,                    // 배지 상태
  checkAchievements,         // 조건 체크
  getUnlockedBadges,         // 획득 배지
  getLockedBadges,           // 미획득 배지 (진행률 포함)
  newBadge,                  // 새 획득 배지 (모달용)
  dismissNewBadge,           // 모달 닫기
} = useBadges();
```

**localStorage 키**: `user_badges`

---

### 3. useStatistics.js (신규)

**파일**: `src/hooks/useStatistics.js`

**추적 항목**:
- 총 학습 시간
- 읽은 단어 수
- 완료 챕터/책 수
- 영웅 대화 횟수
- Speaking 세션 수
- 연속 학습일 (스트릭)
- 주간 활동

**API**:
```javascript
const {
  stats,                     // 통계 데이터
  startSession,              // 세션 시작
  endSession,                // 세션 종료 (시간 누적)
  recordChapterComplete,     // 챕터 완료
  recordSpeakingSession,     // Speaking 완료
  getWeeklyActivity,         // 주간 활동 (차트용)
  getCurrentStreak,          // 현재 스트릭
} = useStatistics();
```

**localStorage 키**: `user_statistics`, `streak_data`

---

### 4. useDataManager.js (신규)

**파일**: `src/hooks/useDataManager.js`

**기능**:
- JSON Export (다운로드)
- JSON Import (업로드)
- 데이터 유효성 검증
- 전체 초기화

**API**:
```javascript
const {
  exportData,                // JSON 다운로드
  importData,                // JSON 업로드
  validateBackup,            // 유효성 검증
  resetAllData,              // 초기화
} = useDataManager();
```

---

## localStorage 데이터 구조

### user_progress
```javascript
{
  version: "1.1.0",
  books: {
    'book-id': {
      chapters: {
        'chapter-id': {
          readingCompleted: true,
          speakingCompleted: false,
          readingCompletedAt: 'ISO날짜',
          wordCount: 150
        }
      },
      lastChapterIndex: 2
    }
  },
  heroes: {
    'aesop': {
      conversationCount: 3,
      firstTalkDate: 'ISO날짜',
      lastTalkDate: 'ISO날짜'
    }
  }
}
```

### user_badges
```javascript
{
  version: "1.1.0",
  badges: {
    'first_chapter': { unlocked: true, unlockedAt: 'ISO날짜' },
    'chapter_10': { unlocked: false, progress: 5 }
  }
}
```

### user_statistics
```javascript
{
  version: "1.1.0",
  totalStudyTime: 45000000,
  totalWords: 15420,
  completedChapters: 23,
  completedBooks: 2,
  heroConversations: 8,
  speakingSessions: 5,
  weeklyActivity: { '2026-W05': { mon: 1200000, ... } }
}
```

### streak_data
```javascript
{
  version: "1.1.0",
  lastStudyDate: '2026-02-03',
  studyDates: ['2026-02-01', '2026-02-02', '2026-02-03'],
  currentStreak: 3,
  longestStreak: 12
}
```

---

## 구현 순서

### Day 1-2: 기본 인프라
1. [x] `useProgress.js` - 기존 useLearningProgress 확장 ✅ 완료
2. [x] `useStatistics.js` - 학습 통계 + 스트릭 ✅ 완료

### Day 3-4: 배지 & 데이터 관리
3. [x] `useBadges.js` - 9개 배지 시스템 ✅ 완료
4. [x] `useDataManager.js` - Export/Import ✅ 완료

### Day 5: 컴포넌트 연동
5. [x] `BookReader.jsx` - useProgress, useStatistics 연동 ✅ 완료
6. [x] `ChatInterface.jsx` - markHeroConversation, recordHeroConversation 연동 ✅ 완료
7. [x] `SpeakingMode.jsx` - recordSpeakingSession, markProgressCompleted 연동 ✅ 완료
8. [x] `App.jsx` - useBadges 배지 체크 + 배지 획득 모달 연동 ✅ 완료
9. [x] 빌드 테스트 통과 ✅ 완료

### Day 6: UI 컴포넌트 구현
10. [x] `MyLearning.jsx` - 탭 컨테이너 ✅ 완료
11. [x] `Dashboard.jsx` - 메인 대시보드 ✅ 완료
12. [x] `BadgeCollection.jsx` - 배지 컬렉션 ✅ 완료
13. [x] `Statistics.jsx` - 학습 통계 ✅ 완료
14. [x] `DataManagement.jsx` - 데이터 관리 ✅ 완료
15. [x] `MyLearning.css` - 스타일 ✅ 완료
16. [x] Navigation + App.jsx 라우팅 ✅ 완료
17. [x] 빌드 테스트 통과 ✅ 완료

### Day 7: PRD 갭 보완
18. [x] BookReader 자동 완료 감지 (IntersectionObserver) ✅ 완료
19. [x] canvas-confetti 배지 획득 축하 효과 ✅ 완료
20. [x] Statistics 도넛 차트 (읽기 진행률 / 배지 획득 / 완독률) ✅ 완료
21. [x] 빌드 테스트 통과 ✅ 완료

---

## 수정할 파일

### 신규 생성
- `src/hooks/useProgress.js`
- `src/hooks/useBadges.js`
- `src/hooks/useStatistics.js`
- `src/hooks/useDataManager.js`

### 참조 파일 (추후 연동)
- `src/hooks/useLearningProgress.js` - 기존 구조 참조
- `src/hooks/useLearningMotivation.js` - 스트릭 로직 참조
- `src/components/BookReader/BookReader.jsx` - 챕터 완료 연동
- `src/components/TalkToHero/ChatInterface.jsx` - 영웅 대화 연동

---

## 검증 방법

1. **단위 테스트**: 각 훅의 함수별 동작 확인
2. **localStorage 검증**: 데이터 저장/로드 확인
3. **마이그레이션 테스트**: 기존 데이터 → 새 구조 변환
4. **Export/Import 테스트**: JSON 파일 왕복 검증
5. **배지 획득 테스트**: 조건 충족 시 알림 확인

---

## 의존성

### npm 패키지 (추후 UI 구현 시)
```json
{
  "chart.js": "^4.4.0",
  "react-chartjs-2": "^5.2.0",
  "canvas-confetti": "^1.9.0"
}
```

현재 Hooks 구현 단계에서는 **추가 패키지 불필요**.

---

## 변경 이력

| 날짜 | 작성자 | 내용 |
|------|--------|------|
| 2026-02-03 | Claude | 초안 작성 |
| 2026-02-03 | Claude | 4개 Hooks 구현 완료 |
| 2026-02-03 | Claude | 옵션 A: 기존 컴포넌트 훅 연동 완료 |
| 2026-02-03 | Claude | 옵션 B: UI 컴포넌트 구현 완료 (MyLearning 페이지) |
| 2026-02-03 | Claude | PRD 갭 보완: 자동완료감지, confetti, 도넛차트 |

---

## 진행 상황 (2026-02-03)

### ✅ 완료된 작업

**4개 Hooks 구현 완료:**

| 파일 | 줄 수 | 상태 |
|------|-------|------|
| `src/hooks/useProgress.js` | ~280줄 | ✅ 완료 |
| `src/hooks/useStatistics.js` | ~290줄 | ✅ 완료 |
| `src/hooks/useBadges.js` | ~230줄 | ✅ 완료 |
| `src/hooks/useDataManager.js` | ~260줄 | ✅ 완료 |

**구현된 주요 기능:**
- 책/챕터 진행도 추적 + 영웅 대화 추적
- 학습 시간 자동 추적 (세션 기반)
- 9개 배지 조건 체크 및 획득 알림
- JSON Export/Import (덮어쓰기/병합 모드)
- 기존 `learning-progress` → `user_progress` 자동 마이그레이션

---

## 🔜 다음 단계 (Next Steps)

### 옵션 A: 기존 컴포넌트에 훅 연동 ✅ 완료
기존 컴포넌트에서 새 훅을 사용하도록 수정:
- [x] `BookReader.jsx` - 챕터 완료 시 `useProgress`, `useStatistics` 호출
- [x] `TalkToHero/ChatInterface.jsx` - 대화 시 `markHeroConversation` 호출
- [x] `SpeakingMode.jsx` - Speaking 완료 시 `recordSpeakingSession` 호출
- [x] `App.jsx` - 배지 체크 + 배지 획득 모달 UI

### 옵션 B: UI 컴포넌트 구현 ✅ 완료
`src/components/MyLearning/` 디렉토리에 UI 컴포넌트 생성:
- [x] `MyLearning.jsx` - 탭 컨테이너 (대시보드/배지/통계/데이터)
- [x] `Dashboard.jsx` - 메인 대시보드 (통계 카드, 진행률, 최근 학습, 배지 미리보기)
- [x] `BadgeCollection.jsx` - 배지 컬렉션 (9개 배지 그리드, 진행률 표시)
- [x] `Statistics.jsx` - 학습 통계 (요약, 스트릭, 주간 활동 차트)
- [x] `DataManagement.jsx` - 데이터 관리 (Export/Import/초기화)
- [x] `MyLearning.css` - 전체 스타일
- [x] `Navigation.jsx` - "내 학습" 탭 추가
- [x] `App.jsx` - 'my-learning' 라우팅 추가
- [x] 빌드 테스트 통과

### PRD 갭 보완 ✅ 완료
- [x] BookReader 자동 완료 감지 (IntersectionObserver + 토스트 UI)
- [x] canvas-confetti 배지 획득 축하 효과
- [x] Statistics 목표 달성률 도넛 차트 (읽기 진행률/배지 획득/완독률)

### 옵션 C: 테스트
- [ ] 브라우저에서 훅 동작 테스트
- [ ] localStorage 데이터 구조 검증
- [ ] 마이그레이션 테스트

---

## 사용 예시

### useProgress 사용
```javascript
import { useProgress } from '../hooks/useProgress';

const MyComponent = () => {
  const { markChapterCompleted, getBookStats, markHeroConversation } = useProgress();

  // 챕터 완료
  markChapterCompleted('book-1', 'chapter-1', 'reading', 150);

  // 영웅 대화 기록
  markHeroConversation('aesop');

  // 책 통계 조회
  const stats = getBookStats('book-1', 10); // 10개 챕터
};
```

### useBadges 사용
```javascript
import { useBadges } from '../hooks/useBadges';
import { useStatistics } from '../hooks/useStatistics';

const MyComponent = () => {
  const { checkAchievements, newBadge, dismissNewBadge } = useBadges();
  const { getStatsSummary } = useStatistics();

  // 배지 체크 (통계 기반)
  const stats = getStatsSummary();
  const newlyUnlocked = checkAchievements(stats);

  // 새 배지 알림 표시
  if (newBadge) {
    alert(`🎉 ${newBadge.nameKo} 배지 획득!`);
    dismissNewBadge();
  }
};
```

### useDataManager 사용
```javascript
import { useDataManager } from '../hooks/useDataManager';

const SettingsComponent = () => {
  const { exportData, importData, resetAllData } = useDataManager();

  // 내보내기
  const handleExport = () => exportData();

  // 가져오기
  const handleImport = async (file) => {
    await importData(file, 'merge'); // 또는 'overwrite'
  };

  // 초기화
  const handleReset = () => resetAllData();
};
```
