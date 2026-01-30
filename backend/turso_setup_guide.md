# Turso DB 재설정 가이드

## 1. 새 인증 토큰 생성

```bash
# 1. Turso 로그인 (필요시)
turso auth login

# 2. DB 목록 확인
turso db list

# 3. classics-hero DB URL 확인
turso db show classics-hero --url

# 4. 새 토큰 생성 (기존 토큰 만료됨)
turso db tokens create classics-hero
```

## 2. 로컬 .env 파일 업데이트

```bash
cd backend
```

`.env` 파일을 열어서 다음 내용으로 교체:

```env
TURSO_DATABASE_URL=<위에서 확인한 URL>
TURSO_AUTH_TOKEN=<위에서 생성한 토큰>
```

## 3. 연결 테스트

```bash
python -c "
from database import get_db
with get_db() as conn:
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM books')
    result = cursor.fetchone()
    print(f'Books count: {result}')
"
```

성공하면 "Books count: ..." 출력됨

## 4. 마이그레이션 실행

```bash
# chapter_vocabulary 테이블 마이그레이션
python migrate_chapter_vocabulary.py

# 시나리오 업데이트
python seed_scenarios.py
```

## 5. Render.com 환경변수 업데이트

1. https://dashboard.render.com 접속
2. classics-hero 백엔드 서비스 선택
3. Environment 탭 클릭
4. 환경변수 업데이트:
   - `TURSO_DATABASE_URL`: 새 URL
   - `TURSO_AUTH_TOKEN`: 새 토큰
5. Save Changes → 자동 재배포

## 6. 확인

프론트엔드(https://classics-hero.vercel.app)에서 테스트:
- 책 목록 로딩 확인
- Talk to Hero 시나리오 시간 확인 (3-8분)
- 중요단어/숙어 표시 확인
