from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
import json
from database import get_db

router = APIRouter(tags=["words"])


@router.get("/archaic-words")
def get_archaic_words(category: Optional[str] = None):
    """모든 고어 단어 또는 카테고리별 조회"""
    with get_db() as conn:
        cursor = conn.cursor()

        if category:
            cursor.execute(
                "SELECT * FROM archaic_words WHERE category = ? ORDER BY word",
                (category,)
            )
        else:
            cursor.execute("SELECT * FROM archaic_words ORDER BY word")

        words = cursor.fetchall()

        return [{
            "id": row["id"],
            "word": row["word"],
            "modernEquivalent": row["modern_equivalent"],
            "partOfSpeech": row["part_of_speech"],
            "definition": row["definition"],
            "definitionKo": row["definition_ko"],
            "exampleSentence": row["example_sentence"],
            "usageNote": row["usage_note"],
            "usageNoteKo": row["usage_note_ko"],
            "category": row["category"]
        } for row in words]


@router.get("/archaic-words/{word}")
def get_archaic_word(word: str):
    """특정 고어 단어 조회"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM archaic_words WHERE LOWER(word) = LOWER(?)",
            (word,)
        )
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Archaic word not found")

        return {
            "id": row["id"],
            "word": row["word"],
            "modernEquivalent": row["modern_equivalent"],
            "partOfSpeech": row["part_of_speech"],
            "definition": row["definition"],
            "definitionKo": row["definition_ko"],
            "exampleSentence": row["example_sentence"],
            "usageNote": row["usage_note"],
            "usageNoteKo": row["usage_note_ko"],
            "category": row["category"]
        }


@router.get("/semantic-shifts")
def get_semantic_shifts():
    """모든 의미 변화 단어 조회"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM semantic_shifts ORDER BY word")
        words = cursor.fetchall()

        return [{
            "id": row["id"],
            "word": row["word"],
            "historicalMeaning": row["historical_meaning"],
            "historicalMeaningKo": row["historical_meaning_ko"],
            "modernMeaning": row["modern_meaning"],
            "modernMeaningKo": row["modern_meaning_ko"],
            "exampleHistorical": row["example_historical"],
            "exampleModern": row["example_modern"],
            "tip": row["tip"],
            "tipKo": row["tip_ko"]
        } for row in words]


@router.get("/semantic-shifts/{word}")
def get_semantic_shift(word: str):
    """특정 의미 변화 단어 조회"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT * FROM semantic_shifts WHERE LOWER(word) = LOWER(?)",
            (word,)
        )
        row = cursor.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Semantic shift word not found")

        return {
            "id": row["id"],
            "word": row["word"],
            "historicalMeaning": row["historical_meaning"],
            "historicalMeaningKo": row["historical_meaning_ko"],
            "modernMeaning": row["modern_meaning"],
            "modernMeaningKo": row["modern_meaning_ko"],
            "exampleHistorical": row["example_historical"],
            "exampleModern": row["example_modern"],
            "tip": row["tip"],
            "tipKo": row["tip_ko"]
        }


@router.post("/detect-archaic")
def detect_archaic_words(text: str = Query(..., description="Text to analyze")):
    """텍스트에서 고어 단어 감지"""
    with get_db() as conn:
        cursor = conn.cursor()

        # 모든 고어 단어 가져오기
        cursor.execute("SELECT word, modern_equivalent, definition_ko FROM archaic_words")
        archaic_words = {row["word"].lower(): {
            "word": row["word"],
            "modernEquivalent": row["modern_equivalent"],
            "definitionKo": row["definition_ko"]
        } for row in cursor.fetchall()}

        # 모든 의미 변화 단어 가져오기
        cursor.execute("SELECT word, historical_meaning_ko, modern_meaning_ko, tip_ko FROM semantic_shifts")
        semantic_shifts = {row["word"].lower(): {
            "word": row["word"],
            "historicalMeaningKo": row["historical_meaning_ko"],
            "modernMeaningKo": row["modern_meaning_ko"],
            "tipKo": row["tip_ko"]
        } for row in cursor.fetchall()}

        # 텍스트에서 단어 추출 (소문자로)
        import re
        words_in_text = set(re.findall(r'\b[a-zA-Z]+\b', text.lower()))

        # 감지된 단어들
        detected_archaic = []
        detected_shifts = []

        for word in words_in_text:
            if word in archaic_words:
                detected_archaic.append(archaic_words[word])
            if word in semantic_shifts:
                detected_shifts.append(semantic_shifts[word])

        return {
            "archaicWords": detected_archaic,
            "semanticShifts": detected_shifts,
            "totalArchaic": len(detected_archaic),
            "totalShifts": len(detected_shifts)
        }
