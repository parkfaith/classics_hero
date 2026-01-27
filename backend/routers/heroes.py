from fastapi import APIRouter, HTTPException
from typing import List, Optional
import json
from database import get_db
from models import Hero

router = APIRouter(tags=["heroes"])

def row_to_hero(row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "nameKo": row["name_ko"],
        "period": row["period"],
        "nationality": row["nationality"],
        "nationalityKo": row["nationality_ko"],
        "occupation": json.loads(row["occupation"]) if row["occupation"] else None,
        "occupationKo": json.loads(row["occupation_ko"]) if row["occupation_ko"] else None,
        "avatar": row["avatar"],
        "difficulty": row["difficulty"],
        "linkedContent": row["id"],  # hero_id와 같은 책의 id
        "profile": {
            "summary": row["summary"],
            "summaryKo": row["summary_ko"],
            "achievements": json.loads(row["achievements"]) if row["achievements"] else [],
            "quotes": json.loads(row["quotes"]) if row["quotes"] else []
        },
        "conversationStyle": {
            "tone": row["conversation_tone"],
            "personality": row["conversation_personality"],
            "systemPrompt": row["system_prompt"]
        },
        "recommendedTopics": json.loads(row["recommended_topics"]) if row["recommended_topics"] else [],
        "ttsConfig": {
            "rate": row["tts_rate"],
            "pitch": row["tts_pitch"]
        },
        "portraitImage": row["portrait_image"],
        "scenarios": json.loads(row["scenarios"]) if row.get("scenarios") else []
    }

@router.get("/heroes")
def get_heroes(difficulty: Optional[str] = None):
    with get_db() as conn:
        cursor = conn.cursor()

        if difficulty:
            cursor.execute("SELECT * FROM heroes WHERE difficulty = ?", (difficulty,))
        else:
            cursor.execute("SELECT * FROM heroes")

        heroes = cursor.fetchall()
        return [row_to_hero(row) for row in heroes]

@router.get("/heroes/{hero_id}")
def get_hero(hero_id: str):
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM heroes WHERE id = ?", (hero_id,))
        hero_row = cursor.fetchone()

        if not hero_row:
            raise HTTPException(status_code=404, detail="Hero not found")

        return row_to_hero(hero_row)
