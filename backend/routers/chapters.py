from fastapi import APIRouter, HTTPException
import json
from database import get_db
from models import Chapter

router = APIRouter(tags=["chapters"])

def row_to_chapter(row) -> dict:
    return {
        "id": row["id"],
        "book_id": row["book_id"],
        "chapter_number": row["chapter_number"],
        "title": row["title"],
        "content": row["content"],
        "word_count": row["word_count"],
        "vocabulary": json.loads(row["vocabulary"]) if row["vocabulary"] else None
    }

@router.get("/chapters/{chapter_id}", response_model=Chapter)
def get_chapter(chapter_id: int):
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM chapters WHERE id = ?", (chapter_id,))
        chapter_row = cursor.fetchone()

        if not chapter_row:
            raise HTTPException(status_code=404, detail="Chapter not found")

        return row_to_chapter(chapter_row)
