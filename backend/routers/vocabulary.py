import traceback
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from database import get_db, USE_TURSO

router = APIRouter(prefix="/vocabulary", tags=["vocabulary"])


# 새 컬럼(phonetic, is_idiom) 존재 여부 캐시
_has_new_columns = None


def _check_new_columns(cursor):
    """chapter_vocabulary 테이블에 phonetic, is_idiom 컬럼이 있는지 확인"""
    global _has_new_columns
    if _has_new_columns is not None:
        return _has_new_columns
    try:
        # 실제 쿼리로 컬럼 존재 여부 확인 (PRAGMA는 Turso에서 미지원)
        cursor.execute("SELECT phonetic, is_idiom FROM chapter_vocabulary LIMIT 0")
        _has_new_columns = True
    except Exception:
        _has_new_columns = False
    return _has_new_columns


class VocabularyItem(BaseModel):
    word: str
    definition: str
    example: Optional[str] = None
    phonetic: Optional[str] = None
    is_idiom: Optional[bool] = False


class VocabularyCreate(BaseModel):
    chapter_id: str
    items: List[VocabularyItem]


class VocabularyResponse(BaseModel):
    id: int
    chapter_id: str
    word: str
    definition: str
    example: Optional[str] = None
    phonetic: Optional[str] = None
    is_idiom: Optional[bool] = False


@router.get("/chapter/{chapter_id}", response_model=List[VocabularyResponse])
def get_chapter_vocabulary(chapter_id: str):
    """챕터의 저장된 중요 단어/숙어 조회"""
    with get_db() as conn:
        cursor = conn.cursor()
        has_new = _check_new_columns(cursor)

        if has_new:
            cursor.execute(
                """
                SELECT id, chapter_id, word, definition, example, phonetic, is_idiom
                FROM chapter_vocabulary
                WHERE chapter_id = ?
                ORDER BY id
                """,
                (chapter_id,)
            )
        else:
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
                example=row["example"],
                phonetic=row["phonetic"] if has_new else None,
                is_idiom=bool(row["is_idiom"]) if has_new and row["is_idiom"] is not None else False
            )
            for row in rows
        ]


@router.post("/chapter/{chapter_id}", response_model=List[VocabularyResponse])
def save_chapter_vocabulary(chapter_id: str, data: VocabularyCreate):
    """챕터의 중요 단어/숙어 저장 (GPT 추출 결과)"""
    if data.chapter_id != chapter_id:
        raise HTTPException(status_code=400, detail="chapter_id mismatch")

    try:
        with get_db() as conn:
            cursor = conn.cursor()
            has_new = _check_new_columns(cursor)

            if USE_TURSO:
                # Turso: batch()로 DELETE + INSERT를 한 번의 HTTP 요청으로 실행
                statements = [
                    ("DELETE FROM chapter_vocabulary WHERE chapter_id = ?", [chapter_id])
                ]
                for item in data.items:
                    if has_new:
                        statements.append((
                            "INSERT INTO chapter_vocabulary (chapter_id, word, definition, example, phonetic, is_idiom) VALUES (?, ?, ?, ?, ?, ?)",
                            [chapter_id, item.word, item.definition, item.example, item.phonetic, 1 if item.is_idiom else 0]
                        ))
                    else:
                        statements.append((
                            "INSERT INTO chapter_vocabulary (chapter_id, word, definition, example) VALUES (?, ?, ?, ?)",
                            [chapter_id, item.word, item.definition, item.example]
                        ))

                conn.batch(statements)
            else:
                # 로컬 SQLite: 기존 방식
                cursor.execute(
                    "DELETE FROM chapter_vocabulary WHERE chapter_id = ?",
                    (chapter_id,)
                )
                for item in data.items:
                    if has_new:
                        cursor.execute(
                            "INSERT INTO chapter_vocabulary (chapter_id, word, definition, example, phonetic, is_idiom) VALUES (?, ?, ?, ?, ?, ?)",
                            (chapter_id, item.word, item.definition, item.example, item.phonetic, 1 if item.is_idiom else 0)
                        )
                    else:
                        cursor.execute(
                            "INSERT INTO chapter_vocabulary (chapter_id, word, definition, example) VALUES (?, ?, ?, ?)",
                            (chapter_id, item.word, item.definition, item.example)
                        )
                conn.commit()

            # 저장된 데이터 반환
            if has_new:
                cursor.execute(
                    """
                    SELECT id, chapter_id, word, definition, example, phonetic, is_idiom
                    FROM chapter_vocabulary
                    WHERE chapter_id = ?
                    ORDER BY id
                    """,
                    (chapter_id,)
                )
            else:
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
                    example=row["example"],
                    phonetic=row["phonetic"] if has_new else None,
                    is_idiom=bool(row["is_idiom"]) if has_new and row["is_idiom"] is not None else False
                )
                for row in rows
            ]
    except HTTPException:
        raise
    except Exception as e:
        print(f"[vocabulary] POST /chapter/{chapter_id} 에러: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"DB 저장 실패: {str(e)}")


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
