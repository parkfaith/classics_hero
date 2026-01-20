from pydantic import BaseModel
from typing import Optional, List

class Chapter(BaseModel):
    id: int
    book_id: str
    chapter_number: int
    title: str
    content: str
    word_count: Optional[int] = None
    vocabulary: Optional[List[str]] = None

class ChapterInBook(BaseModel):
    id: str  # 고유 챕터 ID (예: "aesop-fables-ch1")
    chapterNumber: Optional[int] = None
    title: str
    content: str
    wordCount: Optional[int] = None
    vocabulary: Optional[List[str]] = None

class Book(BaseModel):
    id: str
    title: str
    author: str
    difficulty: str
    genre: Optional[str] = None
    year: Optional[int] = None
    description: Optional[str] = None
    coverColor: Optional[str] = None
    coverImage: Optional[str] = None
    wordCount: Optional[int] = None
    readingTime: Optional[str] = None
    learningFocus: Optional[List[str]] = None
    heroId: Optional[str] = None

class BookWithChapters(Book):
    chapters: List[ChapterInBook] = []

class RecommendedTopic(BaseModel):
    title: str
    titleKo: str
    questions: List[str]

class Hero(BaseModel):
    id: str
    name: str
    nameKo: Optional[str] = None
    period: Optional[str] = None
    nationality: Optional[str] = None
    nationalityKo: Optional[str] = None
    occupation: Optional[List[str]] = None
    occupationKo: Optional[List[str]] = None
    avatar: Optional[str] = None
    difficulty: Optional[str] = None
    linkedContent: Optional[str] = None
    profile: Optional[dict] = None
    conversationStyle: Optional[dict] = None
    recommendedTopics: Optional[List[RecommendedTopic]] = None
    ttsConfig: Optional[dict] = None
    portraitImage: Optional[str] = None
