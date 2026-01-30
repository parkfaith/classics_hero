# Vercel 환경변수 설정 가이드

## 1. Vercel Dashboard 접속
https://vercel.com/dashboard

## 2. 프로젝트 선택
classics-hero 클릭

## 3. Settings → Environment Variables

## 4. Add New 클릭

## 5. 입력

**Name:**
```
VITE_API_URL
```

**Value:**
```
https://classics-hero-api.onrender.com/api
```

**Environment:**
- ✅ Production
- ✅ Preview
- ✅ Development

## 6. Save

## 7. Redeploy

Deployments → 최신 배포 → ... → Redeploy

---

# Render 환경변수 설정

## 1. Render Dashboard
https://dashboard.render.com

## 2. classics-hero-api 클릭

## 3. Environment 탭

## 4. 환경변수 확인/추가

### 필수 환경변수:

**TURSO_DATABASE_URL**
```
libsql://classics-hero-ryanpark.aws-ap-northeast-1.turso.io
```

**TURSO_AUTH_TOKEN**
```
(Turso에서 생성한 토큰 - .env 파일 참조)
```

**CORS_ORIGINS**
```
https://classics-hero.vercel.app
```

## 5. Save Changes

## 6. Manual Deploy → Deploy latest commit

---

완료!
