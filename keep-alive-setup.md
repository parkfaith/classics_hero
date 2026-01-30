# Keep-Alive 서비스 설정 가이드

Render 무료 플랜의 콜드 스타트 문제를 해결하기 위한 Keep-Alive 설정 방법입니다.

## 방법 1: UptimeRobot (추천)

### 1. 회원가입
- https://uptimerobot.com 접속
- 무료 계정 생성 (최대 50개 모니터 무료)

### 2. 모니터 추가
1. Dashboard → "Add New Monitor" 클릭
2. 설정:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: Classic Hero Backend
   - **URL**: `https://your-backend.onrender.com/api/health`
     (실제 Render 백엔드 URL로 교체)
   - **Monitoring Interval**: 5 minutes (무료 플랜 최소 간격)
   - **Alert Contacts**: 이메일 설정 (선택사항)

3. "Create Monitor" 클릭

### 결과
- 5분마다 자동으로 백엔드에 요청을 보냄
- 서버가 절대 Sleep 상태로 전환되지 않음 (15분 제한 회피)

---

## 방법 2: Cron-Job.org

### 1. 회원가입
- https://cron-job.org 접속
- 무료 계정 생성

### 2. Cron Job 생성
1. Dashboard → "Create Cronjob" 클릭
2. 설정:
   - **Title**: Classic Hero Keep-Alive
   - **URL**: `https://your-backend.onrender.com/api/health`
   - **Schedule**: Every 10 minutes
     ```
     */10 * * * *
     ```
   - **Enable**: 체크

3. "Create" 클릭

---

## 방법 3: GitHub Actions (무료, 코드 기반)

### 1. GitHub Repository에 파일 추가

`.github/workflows/keep-alive.yml` 생성:

```yaml
name: Keep Backend Alive

on:
  schedule:
    # 매 10분마다 실행 (UTC 기준)
    - cron: '*/10 * * * *'
  workflow_dispatch: # 수동 실행 가능

jobs:
  keep-alive:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Backend
        run: |
          curl -f https://your-backend.onrender.com/api/health || exit 1
```

### 2. GitHub Actions 활성화
1. Repository → Settings → Actions → General
2. "Allow all actions and reusable workflows" 선택
3. Save

---

## 백엔드 URL 확인 방법

1. Render Dashboard 접속
2. 백엔드 서비스 클릭
3. 상단에 표시된 URL 복사 (예: `https://classics-hero-api.onrender.com`)
4. Health Check 엔드포인트 추가: `/api/health`

---

## 설정 확인

### 테스트 방법
1. 브라우저에서 `https://your-backend.onrender.com/api/health` 접속
2. 다음과 같은 응답이 나오면 정상:
   ```json
   {"status": "ok"}
   ```

### 모니터링
- UptimeRobot/Cron-Job.org Dashboard에서 요청 성공 여부 확인
- Render Dashboard에서 서버 활동 로그 확인

---

## 주의사항

1. **무료 플랜 제한**
   - Render 무료 플랜: 월 750시간 제한 (약 31일)
   - Keep-Alive 사용 시 계속 실행되므로 제한 내 사용 가능

2. **비용**
   - UptimeRobot: 무료 (5분 간격)
   - Cron-Job.org: 무료
   - GitHub Actions: 무료 (Public Repo)

3. **간격 조정**
   - Render는 15분 동안 요청이 없으면 Sleep
   - 10~14분 간격 권장 (안전 마진)

---

## 트러블슈팅

### Keep-Alive가 작동하지 않는 경우
1. URL이 정확한지 확인 (`/api/health` 포함)
2. HTTPS 사용 확인 (HTTP는 Render에서 리다이렉트됨)
3. Render 서비스가 실행 중인지 확인

### 여전히 느린 경우
- Keep-Alive 설정 후에도 첫 로드가 느리면:
  1. 브라우저 캐시 삭제
  2. Render 로그 확인 (콜드 스타트 여부)
  3. UptimeRobot/Cron-Job 실행 히스토리 확인

---

## 추천 설정

**가장 간단한 방법: UptimeRobot**
- 설정 시간: 5분
- 별도 코드 없음
- 모니터링 대시보드 제공
- 무료

**개발자 친화적: GitHub Actions**
- 코드로 관리 가능
- Git 히스토리 추적
- 추가 자동화 가능
