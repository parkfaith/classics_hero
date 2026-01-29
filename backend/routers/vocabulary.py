from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from database import get_db

router = APIRouter(prefix="/vocabulary", tags=["vocabulary"])


class VocabularyItem(BaseModel):
    word: str
    definition: str
    example: Optional[str] = None


class VocabularyCreate(BaseModel):
    chapter_id: str
    items: List[VocabularyItem]


class VocabularyResponse(BaseModel):
    id: int
    chapter_id: str
    word: str
    definition: str
    example: Optional[str] = None


@router.get("/chapter/{chapter_id}", response_model=List[VocabularyResponse])
def get_chapter_vocabulary(chapter_id: str):
    """챕터의 저장된 중요 단어/숙어 조회"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, chapter_id, word, definition, example
            FROM chapter_vocabulary
            WHERE chapter_id = ?
            ORDER BY id
            """,
            (chapter_id,)
        )
        rows = cursor.fetchall()

        return [
            VocabularyResponse(
                id=row["id"],
                chapter_id=row["chapter_id"],
                word=row["word"],
                definition=row["definition"],
                example=row["example"]
            )
            for row in rows
        ]


@router.post("/chapter/{chapter_id}", response_model=List[VocabularyResponse])
def save_chapter_vocabulary(chapter_id: str, data: VocabularyCreate):
    """챕터의 중요 단어/숙어 저장 (GPT 추출 결과)"""
    if data.chapter_id != chapter_id:
        raise HTTPException(status_code=400, detail="chapter_id mismatch")

    with get_db() as conn:
        cursor = conn.cursor()

        # 기존 데이터 삭제 (재추출 시)
        cursor.execute(
            "DELETE FROM chapter_vocabulary WHERE chapter_id = ?",
            (chapter_id,)
        )

        # 새 데이터 삽입
        for item in data.items:
            cursor.execute(
                """
                INSERT INTO chapter_vocabulary (chapter_id, word, definition, example)
                VALUES (?, ?, ?, ?)
                """,
                (chapter_id, item.word, item.definition, item.example)
            )

        conn.commit()

        # 저장된 데이터 반환
        cursor.execute(
            """
            SELECT id, chapter_id, word, definition, example
            FROM chapter_vocabulary
            WHERE chapter_id = ?
            ORDER BY id
            """,
            (chapter_id,)
        )
        rows = cursor.fetchall()

        return [
            VocabularyResponse(
                id=row["id"],
                chapter_id=row["chapter_id"],
                word=row["word"],
                definition=row["definition"],
                example=row["example"]
            )
            for row in rows
        ]


@router.delete("/chapter/{chapter_id}")
def delete_chapter_vocabulary(chapter_id: str):
    """챕터의 중요 단어/숙어 삭제 (재추출용)"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM chapter_vocabulary WHERE chapter_id = ?",
            (chapter_id,)
        )
        conn.commit()

        return {"message": f"Vocabulary for chapter {chapter_id} deleted"}
