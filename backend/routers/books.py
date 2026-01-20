from fastapi import APIRouter, HTTPException
from typing import List, Optional
import json
from database import get_db
from models import Book, BookWithChapters, ChapterInBook

router = APIRouter(tags=["books"])

def row_to_book(row) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "author": row["author"],
        "difficulty": row["difficulty"],
        "genre": row["genre"],
        "year": row["year"],
        "description": row["description"],
        "coverColor": row["cover_color"],
        "coverImage": row["cover_image"],
        "wordCount": row["word_count"],
        "readingTime": row["reading_time"],
        "learningFocus": json.loads(row["learning_focus"]) if row["learning_focus"] else None,
        "heroId": row["hero_id"]
    }

def row_to_chapter(row, book_id: str) -> dict:
    # 책 ID와 챕터 번호를 조합하여 고유한 챕터 ID 생성
    unique_chapter_id = f"{book_id}-ch{row['chapter_number']}"
    return {
        "id": unique_chapter_id,
        "chapterNumber": row["chapter_number"],
        "title": row["title"],
        "content": row["content"],
        "wordCount": row["word_count"],
        "vocabulary": json.loads(row["vocabulary"]) if row["vocabulary"] else None
    }

@router.get("/books", response_model=List[BookWithChapters])
def get_books(difficulty: Optional[str] = None):
    with get_db() as conn:
        cursor = conn.cursor()

        if difficulty:
            cursor.execute("SELECT * FROM books WHERE difficulty = ?", (difficulty,))
        else:
            cursor.execute("SELECT * FROM books")

        books = cursor.fetchall()
        result = []

        for book_row in books:
            book_data = row_to_book(book_row)

            # 각 책의 챕터 가져오기
            cursor.execute(
                "SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number",
                (book_row["id"],)
            )
            chapters = cursor.fetchall()
            book_data["chapters"] = [row_to_chapter(ch, book_row["id"]) for ch in chapters]

            result.append(book_data)

        return result

@router.get("/books/{book_id}", response_model=BookWithChapters)
def get_book(book_id: str):
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM books WHERE id = ?", (book_id,))
        book_row = cursor.fetchone()

        if not book_row:
            raise HTTPException(status_code=404, detail="Book not found")

        book_data = row_to_book(book_row)

        # 챕터 가져오기
        cursor.execute(
            "SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number",
            (book_id,)
        )
        chapters = cursor.fetchall()
        book_data["chapters"] = [row_to_chapter(ch, book_id) for ch in chapters]

        return book_data

@router.get("/books/{book_id}/chapters")
def get_book_chapters(book_id: str):
    with get_db() as conn:
        cursor = conn.cursor()

        # 책 존재 확인
        cursor.execute("SELECT id FROM books WHERE id = ?", (book_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Book not found")

        cursor.execute(
            "SELECT * FROM chapters WHERE book_id = ? ORDER BY chapter_number",
            (book_id,)
        )
        chapters = cursor.fetchall()

        return [row_to_chapter(ch, book_id) for ch in chapters]
