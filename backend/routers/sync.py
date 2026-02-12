import json
from datetime import datetime, timezone

from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import Optional

from database import get_db
from routers.auth import get_current_user

router = APIRouter(prefix="/sync", tags=["sync"])


class SyncData(BaseModel):
    progress: Optional[dict] = None
    statistics: Optional[dict] = None
    streakData: Optional[dict] = None
    badges: Optional[dict] = None
    todayQuestData: Optional[dict] = None


class SyncResponse(BaseModel):
    data: Optional[SyncData] = None
    updatedAt: Optional[str] = None


@router.get("/", response_model=SyncResponse)
def get_sync_data(request: Request):
    """서버에 저장된 동기화 데이터 조회"""
    payload = get_current_user(request)
    user_id = payload["sub"]

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT data, updated_at FROM user_sync_data WHERE user_id = ?",
            (user_id,)
        )
        row = cursor.fetchone()

    if not row:
        return SyncResponse(data=None, updatedAt=None)

    return SyncResponse(
        data=SyncData(**json.loads(row["data"])),
        updatedAt=row["updated_at"]
    )


@router.put("/")
def put_sync_data(sync_data: SyncData, request: Request):
    """동기화 데이터 저장 (UPSERT)"""
    payload = get_current_user(request)
    user_id = payload["sub"]
    now = datetime.now(timezone.utc).isoformat()
    data_json = json.dumps(sync_data.model_dump(), ensure_ascii=False)

    with get_db() as conn:
        cursor = conn.cursor()
        # UPSERT: 있으면 업데이트, 없으면 삽입
        cursor.execute(
            """INSERT INTO user_sync_data (user_id, data, updated_at)
               VALUES (?, ?, ?)
               ON CONFLICT(user_id) DO UPDATE SET data = ?, updated_at = ?""",
            (user_id, data_json, now, data_json, now)
        )
        conn.commit()

    return {"status": "ok", "updatedAt": now}
