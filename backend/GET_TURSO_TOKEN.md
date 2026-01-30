# Turso 토큰 가져오기 (웹 UI 사용)

CLI 설치 없이 웹 브라우저로 토큰을 가져옵니다.

## 방법 1: Turso Dashboard (가장 쉬움)

1. https://app.turso.tech/ 접속 및 로그인

2. `classics-hero` 데이터베이스 클릭

3. **Settings** 탭 클릭

4. **Data Access Tokens** 섹션에서:
   - "Create Token" 버튼 클릭
   - 또는 기존 토큰이 있으면 복사

5. **Connection** 탭에서 URL 확인:
   - Database URL 복사 (libsql://classics-hero-xxx.turso.io)

## 방법 2: CLI 대신 Python으로 확인

```python
# backend 폴더에서 실행
python -c "
import os
from dotenv import load_dotenv
load_dotenv()
print('현재 설정:')
print(f'URL: {os.getenv(\"TURSO_DATABASE_URL\")}')
print(f'Token: {os.getenv(\"TURSO_AUTH_TOKEN\")[:20]}...')
"
```

## 다음 단계

토큰을 받으면:

1. `backend/.env` 파일 업데이트:
```env
TURSO_DATABASE_URL=<Dashboard에서 복사한 URL>
TURSO_AUTH_TOKEN=<Dashboard에서 생성한 토큰>
```

2. 마이그레이션 실행:
```bash
cd backend
python migrate_chapter_vocabulary.py
python seed_scenarios.py
```

3. Render.com 환경변수 업데이트

완료!
