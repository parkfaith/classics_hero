import os
from contextlib import contextmanager
from dotenv import load_dotenv

load_dotenv()

# Turso 환경변수
TURSO_DATABASE_URL = os.getenv("TURSO_DATABASE_URL")
TURSO_AUTH_TOKEN = os.getenv("TURSO_AUTH_TOKEN")

# 로컬 SQLite 경로 (폴백용)
LOCAL_DATABASE_PATH = os.path.join(os.path.dirname(__file__), "data", "classics.db")

# Turso 사용 여부
USE_TURSO = bool(TURSO_DATABASE_URL and TURSO_AUTH_TOKEN)

if USE_TURSO:
    import libsql_client
    print(f"Using Turso database: {TURSO_DATABASE_URL}")
else:
    import sqlite3
    print(f"Using local SQLite database: {LOCAL_DATABASE_PATH}")


# Turso용 동기 래퍼 클래스
class TursoConnection:
    """libsql_client를 동기적으로 사용하기 위한 래퍼"""
    def __init__(self, url, auth_token):
        self.url = url
        self.auth_token = auth_token
        self._client = None

    def _get_client(self):
        if self._client is None:
            self._client = libsql_client.create_client_sync(
                url=self.url,
                auth_token=self.auth_token
            )
        return self._client

    def cursor(self):
        return TursoCursor(self._get_client())

    def commit(self):
        # libsql_client는 자동 커밋
        pass

    def rollback(self):
        # libsql_client는 자동 커밋이므로 롤백 불가
        pass

    def close(self):
        if self._client:
            self._client.close()
            self._client = None


class TursoCursor:
    """Turso용 커서 래퍼"""
    def __init__(self, client):
        self.client = client
        self.lastrowid = None
        self._result = None

    def execute(self, sql, params=None):
        if params:
            # ? 플레이스홀더를 libsql 형식으로 변환
            self._result = self.client.execute(sql, params)
        else:
            self._result = self.client.execute(sql)
        return self

    def executemany(self, sql, params_list):
        for params in params_list:
            self.execute(sql, params)
        return self

    def fetchone(self):
        if self._result and self._result.rows:
            row = self._result.rows[0]
            return dict(zip(self._result.columns, row))
        return None

    def fetchall(self):
        if self._result and self._result.rows:
            return [dict(zip(self._result.columns, row)) for row in self._result.rows]
        return []


def get_connection():
    """데이터베이스 연결 반환"""
    if USE_TURSO:
        conn = TursoConnection(
            url=TURSO_DATABASE_URL,
            auth_token=TURSO_AUTH_TOKEN
        )
    else:
        conn = sqlite3.connect(LOCAL_DATABASE_PATH)
        conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def get_db():
    """컨텍스트 매니저로 DB 연결 관리"""
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


def init_db():
    """데이터베이스 초기화 - 테이블 생성"""
    if not USE_TURSO:
        os.makedirs(os.path.dirname(LOCAL_DATABASE_PATH), exist_ok=True)

    with get_db() as conn:
        cursor = conn.cursor()

        # Heroes 테이블
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS heroes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                name_ko TEXT,
                period TEXT,
                nationality TEXT,
                nationality_ko TEXT,
                occupation TEXT,
                occupation_ko TEXT,
                avatar TEXT,
                difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'advanced')),
                summary TEXT,
                summary_ko TEXT,
                achievements TEXT,
                quotes TEXT,
                conversation_tone TEXT,
                conversation_personality TEXT,
                system_prompt TEXT,
                recommended_topics TEXT,
                tts_rate REAL DEFAULT 0.9,
                tts_pitch REAL DEFAULT 1.0,
                portrait_image TEXT,
                scenarios TEXT
            )
        """)

        # Books 테이블
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS books (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                author TEXT NOT NULL,
                difficulty TEXT CHECK(difficulty IN ('easy', 'medium', 'advanced')),
                genre TEXT,
                year INTEGER,
                description TEXT,
                cover_color TEXT,
                cover_image TEXT,
                word_count INTEGER,
                reading_time TEXT,
                learning_focus TEXT,
                hero_id TEXT,
                FOREIGN KEY (hero_id) REFERENCES heroes(id)
            )
        """)

        # Chapters 테이블
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS chapters (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                book_id TEXT NOT NULL,
                chapter_number INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                word_count INTEGER,
                vocabulary TEXT,
                FOREIGN KEY (book_id) REFERENCES books(id)
            )
        """)

        # Archaic Words 테이블 (고어 사전)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS archaic_words (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word TEXT NOT NULL UNIQUE,
                modern_equivalent TEXT NOT NULL,
                part_of_speech TEXT,
                definition TEXT,
                definition_ko TEXT,
                example_sentence TEXT,
                usage_note TEXT,
                usage_note_ko TEXT,
                category TEXT CHECK(category IN ('pronoun', 'verb', 'adverb', 'adjective', 'noun', 'contraction', 'other'))
            )
        """)

        # Semantic Shifts 테이블 (의미 변화 단어)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS semantic_shifts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                word TEXT NOT NULL UNIQUE,
                historical_meaning TEXT NOT NULL,
                historical_meaning_ko TEXT,
                modern_meaning TEXT NOT NULL,
                modern_meaning_ko TEXT,
                example_historical TEXT,
                example_modern TEXT,
                tip TEXT,
                tip_ko TEXT
            )
        """)

        conn.commit()


if __name__ == "__main__":
    init_db()
    db_type = "Turso" if USE_TURSO else "Local SQLite"
    print(f"Database initialized ({db_type})")
