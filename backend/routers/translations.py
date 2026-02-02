import hashlib
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


class SentenceTranslationCreate(BaseModel):
    source_text: str
    translated_text: str
    target_lang: str = "ko"


class SentenceTranslationResponse(BaseModel):
    text_hash: str
    translated_text: str
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


def _make_text_hash(text: str, target_lang: str) -> str:
    """원문 + 타겟 언어로 해시 생성"""
    key = f"{text.strip()}_{target_lang}"
    return hashlib.sha256(key.encode("utf-8")).hexdigest()


@router.get("/sentence/{text_hash}", response_model=Optional[SentenceTranslationResponse])
def get_sentence_translation(text_hash: str):
    """문장/텍스트의 캐싱된 번역 조회"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT text_hash, translated_text FROM sentence_translations WHERE text_hash = ?",
            (text_hash,)
        )
        row = cursor.fetchone()

        if row:
            return SentenceTranslationResponse(
                text_hash=row["text_hash"],
                translated_text=row["translated_text"],
                cached=True
            )
        return None


@router.post("/sentence", response_model=SentenceTranslationResponse)
def save_sentence_translation(data: SentenceTranslationCreate):
    """문장/텍스트 번역 저장 (LLM 번역 결과 캐싱)"""
    try:
        text_hash = _make_text_hash(data.source_text, data.target_lang)

        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO sentence_translations (text_hash, source_text, translated_text, target_lang)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(text_hash) DO UPDATE SET
                    translated_text = excluded.translated_text,
                    created_at = CURRENT_TIMESTAMP
                """,
                (text_hash, data.source_text.strip(), data.translated_text, data.target_lang)
            )
            conn.commit()

            return SentenceTranslationResponse(
                text_hash=text_hash,
                translated_text=data.translated_text,
                cached=True
            )
    except Exception as e:
        print(f"[translations] POST /sentence 에러: {e}")
        raise HTTPException(status_code=500, detail=f"번역 저장 실패: {str(e)}")


@router.get("/sentence-hash")
def get_text_hash(text: str, target_lang: str = "ko"):
    """원문의 해시값 반환 (프론트에서 캐시 조회용)"""
    return {"text_hash": _make_text_hash(text, target_lang)}
