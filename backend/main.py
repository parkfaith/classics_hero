import os
import traceback
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from routers import books, heroes, chapters, words, openai_proxy, vocabulary
from database import init_db
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Classic Hero API", version="1.0.0")

# CORS 설정 - 환경변수 또는 기본값 사용
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,https://classics-hero.vercel.app")
allowed_origins = [origin.strip() for origin in cors_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(books.router, prefix="/api")
app.include_router(heroes.router, prefix="/api")
app.include_router(chapters.router, prefix="/api")
app.include_router(words.router, prefix="/api")
app.include_router(openai_proxy.router, prefix="/api")
app.include_router(vocabulary.router, prefix="/api")

@app.on_event("startup")
def startup():
    init_db()

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """500 에러 시에도 CORS 헤더가 포함되도록 처리"""
    print(f"[ERROR] {request.method} {request.url}: {exc}")
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )


@app.get("/")
def root():
    return {"message": "Classic Hero API", "version": "1.0.0"}

@app.api_route("/api/health", methods=["GET", "HEAD"])
def health():
    """Health check 엔드포인트 - UptimeRobot keep-alive용"""
    return {"status": "ok"}
