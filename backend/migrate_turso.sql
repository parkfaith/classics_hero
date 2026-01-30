-- Turso DB 마이그레이션 스크립트
-- chapter_vocabulary 테이블을 TEXT chapter_id에서 INTEGER chapter_id로 변경

-- 1. 기존 테이블 삭제 (잘못된 데이터 포함)
DROP TABLE IF EXISTS chapter_vocabulary;

-- 2. 새 테이블 생성 (INTEGER chapter_id, FOREIGN KEY 포함)
CREATE TABLE chapter_vocabulary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapter_id INTEGER NOT NULL,
    word TEXT NOT NULL,
    definition TEXT NOT NULL,
    example TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(chapter_id, word),
    FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);

-- 완료!
-- 이제 프론트엔드에서 중요단어/숙어 추출하면 자동으로 DB에 저장됩니다.
