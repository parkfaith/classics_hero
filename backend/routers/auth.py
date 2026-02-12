import os
import json
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import jwt

from database import get_db

router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 7


class GoogleLoginRequest(BaseModel):
    credential: str


class AuthResponse(BaseModel):
    token: str
    user: dict


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    picture: str | None = None


def verify_google_token(token: str) -> dict:
    """Google ID token 검증"""
    try:
        idinfo = id_token.verify_oauth2_token(
            token, google_requests.Request(), GOOGLE_CLIENT_ID
        )
        return idinfo
    except ValueError as e:
        raise HTTPException(status_code=401, detail=f"유효하지 않은 Google 토큰: {str(e)}")


def create_jwt(user_id: str) -> str:
    """앱 자체 JWT 발급"""
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def get_current_user(request: Request) -> dict:
    """Authorization 헤더에서 JWT 검증 후 유저 정보 반환"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="인증이 필요합니다")
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="토큰이 만료되었습니다")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰입니다")


@router.post("/google", response_model=AuthResponse)
def google_login(request: GoogleLoginRequest):
    """Google ID token으로 로그인/회원가입"""
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="서버에 GOOGLE_CLIENT_ID가 설정되지 않았습니다")

    # Google 토큰 검증
    idinfo = verify_google_token(request.credential)
    google_id = idinfo["sub"]
    email = idinfo.get("email", "")
    name = idinfo.get("name", "")
    picture = idinfo.get("picture", "")

    with get_db() as conn:
        cursor = conn.cursor()
        now = datetime.now(timezone.utc).isoformat()

        # 기존 유저 조회
        cursor.execute("SELECT id, email, name, picture FROM users WHERE google_id = ?", (google_id,))
        existing = cursor.fetchone()

        if existing:
            user_id = existing["id"]
            # 마지막 로그인 시간 업데이트
            cursor.execute(
                "UPDATE users SET last_login_at = ?, name = ?, picture = ? WHERE id = ?",
                (now, name, picture, user_id)
            )
        else:
            # 신규 유저 생성
            user_id = str(uuid.uuid4())
            cursor.execute(
                "INSERT INTO users (id, google_id, email, name, picture, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                (user_id, google_id, email, name, picture, now, now)
            )

        conn.commit()

    # JWT 발급
    token = create_jwt(user_id)

    return AuthResponse(
        token=token,
        user={"id": user_id, "email": email, "name": name, "picture": picture}
    )


@router.get("/me", response_model=UserResponse)
def get_me(request: Request):
    """현재 로그인된 유저 정보 반환"""
    payload = get_current_user(request)
    user_id = payload["sub"]

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT id, email, name, picture FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()

    if not user:
        raise HTTPException(status_code=404, detail="유저를 찾을 수 없습니다")

    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        picture=user.get("picture")
    )
