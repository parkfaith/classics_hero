import sqlite3
import os
from contextlib import contextmanager

DATABASE_PATH = os.path.join(os.path.dirname(__file__), "data", "classics.db")

def get_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)

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
                portrait_image TEXT
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
    print(f"Database initialized at {DATABASE_PATH}")
