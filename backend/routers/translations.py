from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_db

router = APIRouter(prefix="/translations", tags=["translations"])


class TranslationCreate(BaseModel):
    translation: str


class TranslationResponse(BaseModel):
    chapter_id: str
    translation: str
    cached: bool = True


@router.get("/chapter/{chapter_id}", response_model=Optional[TranslationResponse])
def get_chapter_translation(chapter_id: str):
    """챕터의 캐싱된 번역 조회 (없으면 null 반환)"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT chapter_id, translation FROM chapter_translations WHERE chapter_id = ?",
            (chapter_id,)
        )
        row = cursor.fetchone()

        if row:
            return TranslationResponse(
                chapter_id=row["chapter_id"],
                translation=row["translation"],
                cached=True
            )
        return None


@router.post("/chapter/{chapter_id}", response_model=TranslationResponse)
def save_chapter_translation(chapter_id: str, data: TranslationCreate):
    """챕터의 번역 저장 (LLM 번역 결과 캐싱)"""
    try:
        with get_db() as conn:
            cursor = conn.cursor()

            # UPSERT (있으면 업데이트, 없으면 삽입)
            cursor.execute(
                """
                INSERT INTO chapter_translations (chapter_id, translation)
                VALUES (?, ?)
                ON CONFLICT(chapter_id) DO UPDATE SET
                    translation = excluded.translation,
                    created_at = CURRENT_TIMESTAMP
                """,
                (chapter_id, data.translation)
            )
            conn.commit()

            return TranslationResponse(
                chapter_id=chapter_id,
                translation=data.translation,
                cached=True
            )
    except Exception as e:
        print(f"[translations] POST /chapter/{chapter_id} 에러: {e}")
        raise HTTPException(status_code=500, detail=f"번역 저장 실패: {str(e)}")


@router.delete("/chapter/{chapter_id}")
def delete_chapter_translation(chapter_id: str):
    """챕터의 번역 삭제 (재번역용)"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM chapter_translations WHERE chapter_id = ?",
            (chapter_id,)
        )
        conn.commit()

        return {"message": f"Translation for chapter {chapter_id} deleted"}
