# 모바일 기기에서 Classic Hero 앱 테스트 계획

## 현황 분석

### 1. 반응형 디자인 상태 ✅
- **우수한 반응형 CSS 구현** (특히 TalkToHero, SpeakingMode)
- 미디어 쿼리: 768px(태블릿), 480px(스마트폰) breakpoint 적용
- 터치 친화적 버튼 크기 (44-72px)
- Viewport 메타 태그 올바르게 설정

### 2. Web Speech API (TTS/STT) 모바일 호환성 ⚠️

**현재 구현:**
- `useTTS.js`: `window.speechSynthesis` 사용
- `useSTT.js`: `window.SpeechRecognition || window.webkitSpeechRecognition` 사용

**브라우저 호환성 문제:**

| 브라우저 | TTS 지원 | STT 지원 | 비고 |
|---------|---------|---------|------|
| Chrome (Android) | ✅ 완전 지원 | ✅ 완전 지원 | 가장 안정적 |
| Safari (iOS) | ⚠️ 제한적 | ❌ 미지원 | **심각한 문제** |
| Samsung Internet | ✅ 지원 | ⚠️ 제한적 | 일부 기기만 |
| Firefox (Android) | ⚠️ 제한적 | ❌ 미지원 | STT 없음 |

**주요 이슈:**
1. **iOS Safari**: Web Speech API STT가 전혀 작동하지 않음
2. **HTTPS 필수**: 모바일에서 마이크 권한은 HTTPS에서만 허용
3. **자동재생 제한**: iOS는 사용자 제스처 없이 TTS 자동재생 차단

### 3. 네트워크/인프라 요구사항 ⚠️

**현재 설정:**
```javascript
// vite.config.js
server: {
  host: true,  // ✅ 외부 접근 허용
  proxy: { '/api': 'http://localhost:8001' }
}

// backend/main.py
allow_origins: ["http://localhost:5173", "http://127.0.0.1:5173"]  // ⚠️ localhost만 허용
```

**문제점:**
1. Backend CORS가 localhost만 허용 → 모바일에서 API 호출 차단됨
2. HTTP 사용 → 모바일에서 마이크/카메라 권한 거부됨
3. 로컬 IP 주소 미등록

## 필요한 변경사항

### Phase 1: 로컬 네트워크 접근 설정 (필수)

#### 1.1 Backend CORS 설정 변경
**파일:** `backend/main.py`

```python
# 현재
allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"]

# 변경 → 로컬 네트워크 IP 추가
allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.*.***:5173",  # 개발 PC의 로컬 IP
    "http://10.0.*.*:5173",       # 가능한 내부 IP 대역
]
```

**또는 개발 환경에서 전체 허용:**
```python
allow_origins=["*"]  # 개발용만 사용
```

#### 1.2 로컬 IP 확인 및 접근
```bash
# Windows
ipconfig  # Wi-Fi/이더넷 IPv4 주소 확인

# 예: 192.168.0.100
# 모바일에서 접근: http://192.168.0.100:5173
```

#### 1.3 방화벽 설정
- Windows 방화벽에서 포트 5173, 8001 인바운드 허용

### Phase 2: HTTPS 설정 (STT/TTS 작동을 위해 필수)

#### 옵션 A: ngrok 사용 (가장 빠름, 추천)
```bash
# ngrok 설치 후
ngrok http 5173  # Frontend
ngrok http 8001  # Backend (별도 터미널)

# 제공된 HTTPS URL로 모바일 접근
# 예: https://abc123.ngrok.io
```

**장점:**
- 5분 내 설정 완료
- 자동 HTTPS 제공
- 외부 인터넷에서도 접근 가능
- 방화벽 설정 불필요

**단점:**
- 무료 버전은 URL이 매번 변경됨
- Backend URL도 변경되어야 함

**필요한 코드 변경:**
```javascript
// vite.config.js
proxy: {
  '/api': {
    target: 'https://[ngrok-backend-url]',  // ngrok backend URL
    changeOrigin: true,
    secure: false
  }
}
```

#### 옵션 B: mkcert로 로컬 HTTPS (추천, 더 안정적)
```bash
# mkcert 설치
choco install mkcert  # Windows

# 로컬 CA 설치
mkcert -install

# 인증서 생성
mkcert localhost 192.168.0.100 # PC IP 포함

# Vite에 HTTPS 설정 추가
```

**vite.config.js 변경:**
```javascript
import fs from 'fs'

export default defineConfig({
  server: {
    host: true,
    https: {
      key: fs.readFileSync('./localhost+1-key.pem'),
      cert: fs.readFileSync('./localhost+1.pem'),
    },
    proxy: { ... }
  }
})
```

**Backend도 HTTPS 설정:**
```python
# uvicorn 실행 시
uvicorn main:app --reload --port 8001 --ssl-keyfile=./key.pem --ssl-certfile=./cert.pem
```

**장점:**
- 로컬 네트워크에서 안정적
- URL 고정
- 개발 환경과 유사

**단점:**
- 초기 설정 시간 소요 (30분)
- 모바일에도 인증서 신뢰 설정 필요

### Phase 3: 모바일 호환성 개선 (선택적)

#### 3.1 iOS Safari STT 대체 방안
**문제:** iOS Safari는 Web Speech API STT를 지원하지 않음

**해결책 옵션:**
1. **OpenAI Whisper API 사용** (추천)
   - MediaRecorder로 녹음 → Whisper API로 변환
   - 정확도 높음, 비용 발생 ($0.006/분)

2. **브라우저 감지 및 안내**
   - iOS에서는 "Chrome 사용 권장" 메시지 표시
   - 또는 STT 없이 텍스트 입력만 허용

3. **네이티브 앱 변환 검토**
   - React Native 또는 PWA로 전환
   - 장기적 해결책

#### 3.2 TTS 자동재생 이슈 해결
**파일:** `src/hooks/useTTS.js`

```javascript
// iOS에서 사용자 제스처 후에만 TTS 활성화
const speak = (text, options = {}) => {
  // iOS 감지
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (isIOS && !window.speechSynthesisInitialized) {
    // 첫 번째 호출 시 짧은 음성 재생하여 초기화
    const init = new SpeechSynthesisUtterance('');
    window.speechSynthesis.speak(init);
    window.speechSynthesisInitialized = true;
  }

  // 기존 로직...
}
```

#### 3.3 터치 이벤트 최적화
**모든 주요 CSS 파일에 추가:**
```css
button, a, input, textarea {
  touch-action: manipulation;  /* 더블탭 줌 방지 */
}

* {
  -webkit-tap-highlight-color: transparent;  /* 탭 하이라이트 제거 */
}
```

#### 3.4 폴백 UI 제공
**파일:** `src/hooks/useSTT.js`, `src/hooks/useTTS.js`

```javascript
// 지원 여부를 명확히 표시
useEffect(() => {
  if (!isSupported) {
    console.warn('현재 브라우저는 음성 기능을 지원하지 않습니다.');
    // UI에 경고 메시지 표시
  }
}, [isSupported]);
```

## 권장 실행 계획

### 최소 실행 (가장 빠른 방법)
1. **ngrok 사용** - 5분
   - Frontend/Backend ngrok 실행
   - 모바일에서 HTTPS URL 접근
   - Android Chrome으로 테스트

2. **Backend CORS 전체 허용** - 1분
   ```python
   allow_origins=["*"]
   ```

3. **모바일 Chrome에서 테스트**
   - TTS ✅ 작동
   - STT ✅ 작동

**제한사항:**
- iOS Safari에서는 STT 작동 안 함
- ngrok URL이 매번 변경됨

### 안정적 실행 (추천)
1. **mkcert로 로컬 HTTPS 설정** - 30분
2. **Backend CORS에 로컬 IP 추가** - 2분
3. **터치 이벤트 최적화 CSS 추가** - 10분
4. **iOS Safari용 브라우저 감지 추가** - 15분

**결과:**
- 로컬 네트워크에서 안정적 테스트
- Android 완전 지원
- iOS는 TTS만 지원 (STT 대체 방안 안내)

### 장기 개선 (프로덕션 대비)
1. **Whisper API 통합** - 3-4시간
2. **PWA 변환** - 1-2일
3. **클라우드 배포** (Vercel + Railway) - 2-3시간

## 핵심 파일 목록

**변경 필요:**
- `backend/main.py` - CORS 설정
- `vite.config.js` - HTTPS/프록시 설정
- `src/hooks/useSTT.js` - iOS 대응
- `src/hooks/useTTS.js` - 자동재생 이슈
- 주요 CSS 파일 - 터치 최적화

**확인 필요:**
- `package.json` - vite HTTPS 패키지
- `.gitignore` - 인증서 파일 제외

## 검증 방법

1. **로컬 네트워크 접근 테스트**
   ```bash
   # PC에서 실행 후
   npm run dev
   cd backend && uvicorn main:app --reload --port 8001

   # 모바일에서 접근
   http://[PC-IP]:5173
   ```

2. **HTTPS 테스트**
   - Chrome DevTools → Console 확인
   - `navigator.mediaDevices` 사용 가능 여부
   - STT 마이크 권한 요청 여부

3. **기능 테스트**
   - TalkToHero → STT 음성 입력 ✅
   - SpeakingMode → TTS 듣기 ✅
   - BookReader → 단락 TTS ✅

4. **브라우저별 테스트**
   - Android Chrome (최우선)
   - iOS Safari (제한적)
   - Samsung Internet

## 최종 실행 계획 (사용자 선택 반영)

**사용자 선택:**
1. ✅ HTTPS: **ngrok** (빠른 설정)
2. ✅ iOS 대응: **브라우저 안내** (간단 구현)
3. ✅ 테스트 범위: **로컬 네트워크만**

### Step 1: Backend CORS 설정 변경 (2분)
**파일:** `backend/main.py`

```python
# 변경 전
allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"]

# 변경 후 (개발 환경용)
allow_origins=["*"]  # 또는 ngrok URL 추가
```

**이유:** 모바일에서 API 호출 허용

### Step 2: ngrok 설치 및 실행 (5분)

**설치:**
```bash
# Windows
choco install ngrok
# 또는 https://ngrok.com/download 에서 다운로드

# ngrok 계정 가입 후 auth token 설정
ngrok config add-authtoken [YOUR_TOKEN]
```

**실행 (2개 터미널 필요):**
```bash
# 터미널 1: Backend
cd backend
uvicorn main:app --reload --port 8001

# 터미널 2: Backend ngrok
ngrok http 8001
# 출력된 URL 복사: https://abc123.ngrok.io

# 터미널 3: Frontend vite.config.js 수정 후
npm run dev

# 터미널 4: Frontend ngrok
ngrok http 5173
# 출력된 URL을 모바일에서 접속: https://xyz789.ngrok.io
```

### Step 3: Vite 프록시 설정 변경 (2분)
**파일:** `vite.config.js`

```javascript
// ngrok backend URL로 변경
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api': {
        target: 'https://[ngrok-backend-url]',  // Step 2에서 복사한 URL
        changeOrigin: true,
        secure: false  // ngrok 인증서 문제 해결
      }
    }
  }
})
```

**재시작:** `npm run dev` 재실행

### Step 4: iOS 브라우저 감지 추가 (10분)

**새 파일 생성:** `src/utils/browserDetect.js`
```javascript
export const getBrowserInfo = () => {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  const isChrome = /Chrome/.test(ua);

  return {
    isIOS,
    isSafari: isSafari && isIOS,
    isChrome,
    supportsSTT: !isIOS || isChrome,
  };
};
```

**파일 수정:** `src/components/TalkToHero/ChatInput.jsx`
```javascript
import { getBrowserInfo } from '../../utils/browserDetect';

// 컴포넌트 시작 부분에 추가
const browserInfo = getBrowserInfo();

// STT 버튼 렌더링 부분 수정
{!browserInfo.supportsSTT && (
  <div className="browser-warning">
    ⚠️ iOS에서는 Chrome 브라우저를 사용해주세요. Safari는 음성 인식을 지원하지 않습니다.
  </div>
)}
```

**파일 수정:** `src/components/SpeakingMode/SpeakingMode.jsx`
- 동일한 경고 메시지 추가

### Step 5: 터치 이벤트 최적화 CSS (5분)

**파일:** `src/index.css` (전역 스타일에 추가)
```css
/* 터치 최적화 */
button, a, input, textarea {
  touch-action: manipulation;  /* 더블탭 줌 방지 */
}

* {
  -webkit-tap-highlight-color: transparent;  /* 탭 하이라이트 제거 */
}

/* iOS 고정 viewport */
@supports (-webkit-touch-callout: none) {
  body {
    -webkit-text-size-adjust: 100%;
  }
}
```

### Step 6: 모바일 테스트 (10분)

**Android Chrome 테스트:**
1. ngrok Frontend URL 접속 (https://xyz789.ngrok.io)
2. 책 선택 → BookReader → TTS 듣기 ✅
3. SpeakingMode → 녹음 및 발음 분석 ✅
4. TalkToHero → 음성 대화 ✅

**iOS Safari 테스트:**
1. ngrok URL 접속
2. STT 경고 메시지 표시 확인 ✅
3. TTS는 작동 확인 ✅
4. 텍스트 입력으로 대화 가능 확인 ✅

**iOS Chrome 테스트:** (권장)
1. Chrome 브라우저 설치 필요
2. STT 완전 작동 확인 ✅

## 대안: 로컬 IP 접근 (ngrok 없이)

ngrok 없이 로컬 네트워크에서만 테스트하려면:

1. **PC IP 확인**
```bash
ipconfig  # Wi-Fi IPv4 주소
# 예: 192.168.0.100
```

2. **Backend CORS 수정**
```python
allow_origins=[
    "http://localhost:5173",
    "http://192.168.0.100:5173",  # PC IP
]
```

3. **모바일 접속**
```
http://192.168.0.100:5173
```

**⚠️ 제한사항:** HTTP이므로 모바일에서 마이크 권한 거부됨 → STT/녹음 불가

## 변경 파일 요약

**필수 변경:**
1. `backend/main.py` - CORS 설정
2. `vite.config.js` - ngrok backend URL
3. `src/utils/browserDetect.js` - 신규 생성
4. `src/components/TalkToHero/ChatInput.jsx` - iOS 경고 추가
5. `src/components/SpeakingMode/SpeakingMode.jsx` - iOS 경고 추가
6. `src/index.css` - 터치 최적화

**선택 변경:**
7. `src/components/TalkToHero/ChatInput.css` - 경고 스타일
8. `src/components/SpeakingMode/SpeakingMode.css` - 경고 스타일

## 검증 체크리스트

- [ ] ngrok 설치 및 auth token 설정
- [ ] Backend ngrok URL 확인 (https://abc.ngrok.io)
- [ ] Frontend ngrok URL 확인 (https://xyz.ngrok.io)
- [ ] vite.config.js에 backend URL 업데이트
- [ ] Backend CORS 설정 변경
- [ ] 모바일에서 Frontend URL 접속 확인
- [ ] Android Chrome: STT/TTS 모두 작동 확인
- [ ] iOS Safari: 경고 메시지 확인, TTS만 작동
- [ ] 터치 이벤트 정상 작동 (버튼 클릭)

## 예상 소요 시간

- ngrok 설치: 5분
- 코드 변경: 15분
- 테스트: 10분
- **총합: 30분**
