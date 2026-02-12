# Google 로그인 + 크로스 디바이스 동기화 구현 계획

## Context
현재 Classic Hero 앱은 모든 학습 데이터(진행률, 통계, 뱃지, 퀘스트, 스트릭)를 localStorage에 저장합니다. 핸드폰/태블릿/PC 간 데이터 동기화가 불가능하여 기기를 바꾸면 학습 기록이 사라집니다. Google 소셜 로그인으로 최소한의 인증을 구현하고, 서버에 데이터를 저장하여 크로스 디바이스 동기화를 지원합니다.

## 핵심 설계 결정

| 항목 | 결정 | 이유 |
|------|------|------|
| 인증 방식 | Google OAuth (ID token) | 비밀번호 관리 불필요, 원클릭 로그인 |
| 프론트 라이브러리 | `@react-oauth/google` | 공식 Google Identity Services 래퍼, ~4KB |
| 토큰 방식 | JWT (Authorization: Bearer) | 프론트/백엔드 분리 배포(Vercel+Render)에 적합 |
| 동기화 데이터 저장 | 단일 JSON blob (user_sync_data 테이블) | 기존 export/import 구조 그대로 활용 |
| 동기화 전략 | Pull → Merge → Push | 기존 useDataManager.js의 merge 함수 재사용 |
| 게스트 모드 | 유지 (로그인 선택사항) | 기존 사용자 경험 보존 |

## 동기화 범위

| 데이터 | localStorage 키 | 동기화 |
|--------|-----------------|--------|
| 학습 진행률 | `user_progress` | O |
| 통계 | `user_statistics` | O |
| 스트릭 | `streak_data` | O |
| 뱃지 | `user_badges` | O |
| 오늘의 퀘스트 | `today_quest_data` | O |
| 발음 기록 | `pronunciation-history-*` | X |
| 단어 학습 | `learned-words-*` | X |
| 북마크 | `bookmarks-*` | X |

---

## 구현 단계

### Step 1: Backend - DB 테이블 추가

**파일:** `backend/database.py` (수정)

`init_db()` 함수에 2개 테이블 추가:

```sql
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,              -- UUID
    google_id TEXT NOT NULL UNIQUE,   -- Google sub claim
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    picture TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_sync_data (
    user_id TEXT PRIMARY KEY,
    data TEXT NOT NULL,                -- JSON blob (progress, statistics, streakData, badges, todayQuestData)
    updated_at TIMESTAMP NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### Step 2: Backend - 의존성 추가

**파일:** `backend/requirements.txt` (수정)

```
google-auth>=2.27.0
PyJWT>=2.8.0
```

### Step 3: Backend - Auth 라우터

**파일:** `backend/routers/auth.py` (신규)

환경변수: `GOOGLE_CLIENT_ID`, `JWT_SECRET`

| 엔드포인트 | 기능 |
|-----------|------|
| `POST /api/auth/google` | Google ID token 검증 → 유저 upsert → JWT 발급 |
| `GET /api/auth/me` | JWT에서 현재 유저 정보 반환 |

핵심 헬퍼 함수:
- `verify_google_token(token)` → `google.oauth2.id_token.verify_oauth2_token()` 사용
- `create_jwt(user_id)` → `PyJWT`로 앱 자체 JWT 발급 (7일 만료)
- `get_current_user(request)` → `Authorization: Bearer` 헤더에서 JWT 디코드 (Depends로 사용)

### Step 4: Backend - Sync 라우터

**파일:** `backend/routers/sync.py` (신규)

| 엔드포인트 | 기능 |
|-----------|------|
| `GET /api/sync` | 유저의 동기화 데이터 조회 (JSON blob + updated_at) |
| `PUT /api/sync` | 유저의 동기화 데이터 저장 (UPSERT) |

두 엔드포인트 모두 `get_current_user` 의존성으로 인증 필요.

### Step 5: Backend - 라우터 등록

**파일:** `backend/main.py` (수정, 2줄 추가)

```python
from routers import auth, sync
app.include_router(auth.router, prefix="/api")
app.include_router(sync.router, prefix="/api")
```

### Step 6: Frontend - 패키지 설치

```bash
npm install @react-oauth/google
```

### Step 7: Frontend - API 함수 추가

**파일:** `src/api/index.js` (수정)

```javascript
// Auth API
export const loginWithGoogle = async (credential) => { ... }
export const getMe = async (token) => { ... }

// Sync API
export const getSyncData = async (token) => { ... }
export const putSyncData = async (token, data) => { ... }
```

### Step 8: Frontend - useAuth 훅

**파일:** `src/hooks/useAuth.js` (신규)

상태 관리:
- `user` (null | { id, email, name, picture })
- `isLoggedIn` boolean
- `isLoading` boolean (초기 토큰 체크 중)

메서드:
- `login(googleCredential)` → POST /api/auth/google → JWT + user 저장 (localStorage `auth_token`, `auth_user`)
- `logout()` → localStorage 정리, 상태 초기화
- `getAuthHeaders()` → `{ Authorization: 'Bearer <token>' }`

마운트 시: 저장된 JWT의 exp claim 확인 → 만료면 자동 로그아웃

### Step 9: Frontend - useSyncManager 훅

**파일:** `src/hooks/useSyncManager.js` (신규)

핵심 로직 (기존 useDataManager.js의 merge 함수 재사용):
1. `syncNow()` → GET /api/sync → merge(local, server) → 로컬 저장 → PUT /api/sync
2. `storage-sync` 이벤트 리스너 → 2초 디바운스 후 PUT /api/sync
3. `visibilitychange` 리스너 → 앱 복귀 시 syncNow()

merge 함수 재사용을 위해 `src/hooks/useDataManager.js`에서 4개 함수를 모듈 레벨로 추출:
- `mergeProgressData` → export
- `mergeBadgesData` → export
- `mergeStatisticsData` → export
- `mergeStreakData` → export

`todayQuestData` 병합: 날짜 키 union, completed=true가 우선

### Step 10: Frontend - safeSetItem에 동기화 이벤트 추가

**파일:** `src/hooks/useDataManager.js` (수정)

`safeSetItem` 성공 시 `window.dispatchEvent(new CustomEvent('storage-sync', { detail: { key } }))` 추가

### Step 11: Frontend - GoogleOAuthProvider 래핑

**파일:** `src/main.jsx` (수정)

```jsx
import { GoogleOAuthProvider } from '@react-oauth/google';

<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
  <App />
</GoogleOAuthProvider>
```

### Step 12: Frontend - App.jsx 통합

**파일:** `src/App.jsx` (수정)

- `useAuth()`, `useSyncManager()` 초기화
- `user`, `isLoggedIn`, `login`, `logout`, `syncNow`, `isSyncing`, `lastSyncTime`을 Settings에 props로 전달
- 로그인 성공 후 `syncNow()` 호출 → `window.location.reload()`로 훅 리프레시

### Step 13: Frontend - Settings에 계정 섹션 추가

**파일:** `src/components/Settings/Settings.jsx` + `src/components/Settings/Settings.css` (수정)

기존 "AI 언어 모델" 섹션 위에 "계정" 섹션 추가:

**로그인 전:**
- "Google 계정으로 로그인하면 여러 기기에서 학습 데이터를 동기화할 수 있습니다." 안내 문구
- `<GoogleLogin>` 버튼

**로그인 후:**
- 프로필 카드 (이름, 이메일, 구글 프로필 사진)
- "마지막 동기화: ..." 표시
- "지금 동기화" 버튼
- "로그아웃" 버튼

---

## 동기화 흐름

```
[기기A] 로그인                 [서버]                    [기기B]
  |-- POST /api/auth/google -->|                           |
  |<-- JWT + user -------------|                           |
  |                             |                           |
  |-- GET /api/sync ---------->|                           |
  |<-- server data (or null) --|                           |
  |                             |                           |
  | [merge(local, server)]      |                           |
  | [localStorage에 저장]       |                           |
  |                             |                           |
  |-- PUT /api/sync (merged) ->|                           |
  |                             |-- [저장됨] -------------->|
  |                             |                           |
  | [학습 활동...]              |                           |
  | [2초 디바운스]              |                           |
  |-- PUT /api/sync (updated)->|                           |
  |                             |            [기기B 앱 열기]|
  |                             |<-- GET /api/sync ---------|
  |                             |-- 최신 데이터 ----------->|
  |                             |   [merge(local, server)]  |
  |                             |<-- PUT /api/sync (merged)-|
```

## 파일 변경 요약

| 파일 | 작업 | 변경 내용 |
|------|------|----------|
| `backend/requirements.txt` | 수정 | `google-auth`, `PyJWT` 추가 |
| `backend/database.py` | 수정 | `users`, `user_sync_data` 테이블 추가 |
| `backend/main.py` | 수정 | auth, sync 라우터 등록 (2줄) |
| `backend/routers/auth.py` | **신규** | Google 인증 + JWT 발급 |
| `backend/routers/sync.py` | **신규** | 동기화 데이터 CRUD |
| `src/api/index.js` | 수정 | auth, sync API 함수 추가 |
| `src/hooks/useAuth.js` | **신규** | 인증 상태 관리 |
| `src/hooks/useSyncManager.js` | **신규** | 동기화 로직 |
| `src/hooks/useDataManager.js` | 수정 | merge 함수 export + sync 이벤트 |
| `src/main.jsx` | 수정 | GoogleOAuthProvider 래핑 |
| `src/App.jsx` | 수정 | useAuth, useSyncManager 통합 |
| `src/components/Settings/Settings.jsx` | 수정 | 계정 섹션 UI |
| `src/components/Settings/Settings.css` | 수정 | 계정 섹션 스타일 |
| `CHANGELOG.md` | 수정 | 변경 이력 기록 |

**신규 파일 4개, 수정 파일 10개**

## Google Cloud Console 설정 (사전 준비)

1. Google Cloud Console에서 프로젝트 생성/선택
2. "APIs & Services" → "Credentials" → OAuth 2.0 Client ID 생성
3. Authorized JavaScript Origins 추가:
   - `http://localhost:5173`
   - `https://classics-hero.vercel.app`
   - `https://www.jobible.net`
   - `https://jobible.net`
4. Client ID 복사 → 프론트엔드 `.env`의 `VITE_GOOGLE_CLIENT_ID`와 백엔드 `.env`의 `GOOGLE_CLIENT_ID`에 설정

## 검증 방법

1. **백엔드 테스트:** `uvicorn main:app --reload --port 8001` 실행 후 `/api/health` 확인, DB 테이블 생성 확인
2. **로그인 테스트:** Settings에서 Google 로그인 → JWT 발급 확인 → `/api/auth/me` 호출
3. **동기화 테스트:**
   - 기기A에서 로그인 → 챕터 학습 → Settings에서 동기화 상태 확인
   - 기기B에서 같은 계정 로그인 → 기기A의 진행률이 반영되는지 확인
4. **게스트 모드 테스트:** 로그인 없이 기존 기능 정상 작동 확인
5. **충돌 해결 테스트:** 두 기기에서 다른 챕터 학습 후 동기화 → 두 기기의 데이터가 모두 merge되는지 확인
