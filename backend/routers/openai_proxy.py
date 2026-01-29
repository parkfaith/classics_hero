import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import httpx

router = APIRouter(prefix="/openai", tags=["openai"])

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_API_URL = "https://api.openai.com/v1/chat/completions"


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[Message]
    model: str = "gpt-4o-mini"
    temperature: float = 0.7
    max_tokens: int = 500


class ChatResponse(BaseModel):
    content: str
    role: str = "assistant"


@router.post("/chat", response_model=ChatResponse)
async def chat_completion(request: ChatRequest):
    """OpenAI Chat Completion API 프록시"""
    if not OPENAI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="서버에 OpenAI API 키가 설정되지 않았습니다."
        )

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                OPENAI_API_URL,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {OPENAI_API_KEY}"
                },
                json={
                    "model": request.model,
                    "messages": [msg.model_dump() for msg in request.messages],
                    "temperature": request.temperature,
                    "max_tokens": request.max_tokens
                }
            )

            if response.status_code != 200:
                error_data = response.json()
                raise HTTPException(
                    status_code=response.status_code,
                    detail=error_data.get("error", {}).get("message", "OpenAI API 오류")
                )

            data = response.json()
            return ChatResponse(
                content=data["choices"][0]["message"]["content"],
                role="assistant"
            )

    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="OpenAI API 응답 시간 초과")
    except httpx.RequestError as e:
        raise HTTPException(status_code=502, detail=f"OpenAI API 연결 실패: {str(e)}")
