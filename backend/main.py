from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import books, heroes, chapters, words
from database import init_db

app = FastAPI(title="Classic Hero API", version="1.0.0")

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(books.router, prefix="/api")
app.include_router(heroes.router, prefix="/api")
app.include_router(chapters.router, prefix="/api")
app.include_router(words.router, prefix="/api")

@app.on_event("startup")
def startup():
    init_db()

@app.get("/")
def root():
    return {"message": "Classic Hero API", "version": "1.0.0"}

@app.get("/api/health")
def health():
    return {"status": "ok"}
