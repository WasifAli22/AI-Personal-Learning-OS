"""
Pydantic models for the AI Personal Learning OS.
Covers users, documents, quizzes, roadmaps, flashcards, and analytics.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ─── Auth Models ───────────────────────────────────────────────

class SignUpRequest(BaseModel):
    email: str
    password: str
    full_name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user_id: str
    email: str
    full_name: Optional[str] = None


class UserProfile(BaseModel):
    id: str
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: Optional[str] = None


# ─── Document Models ──────────────────────────────────────────

class DocumentType(str, Enum):
    PDF = "pdf"
    DOCX = "docx"
    TXT = "txt"
    IMAGE = "image"
    YOUTUBE = "youtube"


class DocumentUploadResponse(BaseModel):
    id: str
    filename: str
    doc_type: DocumentType
    chunk_count: int
    status: str = "processed"
    created_at: str


class DocumentListItem(BaseModel):
    id: str
    filename: str
    doc_type: str
    chunk_count: int
    created_at: str


# ─── Chat Models ──────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    sources: Optional[List[dict]] = None
    timestamp: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    document_ids: Optional[List[str]] = None
    conversation_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    sources: List[dict] = []
    conversation_id: str


# ─── Quiz Models ──────────────────────────────────────────────

class QuestionType(str, Enum):
    MCQ = "mcq"
    TRUE_FALSE = "true_false"
    SHORT_ANSWER = "short_answer"


class QuizQuestion(BaseModel):
    id: str
    question: str
    question_type: QuestionType
    options: Optional[List[str]] = None  # For MCQ
    correct_answer: str
    explanation: Optional[str] = None
    difficulty: str = "medium"  # easy, medium, hard
    topic: Optional[str] = None


class QuizGenerateRequest(BaseModel):
    document_ids: Optional[List[str]] = None
    topic: Optional[str] = None
    num_questions: int = 10
    difficulty: str = "medium"
    question_types: List[str] = ["mcq", "true_false", "short_answer"]


class Quiz(BaseModel):
    id: str
    title: str
    questions: List[QuizQuestion]
    created_at: str
    document_ids: Optional[List[str]] = None


class QuizSubmission(BaseModel):
    quiz_id: str
    answers: dict  # question_id -> user_answer


class QuizResult(BaseModel):
    quiz_id: str
    score: float
    total_questions: int
    correct_answers: int
    wrong_answers: List[dict]  # [{question_id, correct, user_answer, topic}]
    weak_topics: List[str]
    recommendations: List[str]


# ─── Roadmap Models ──────────────────────────────────────────

class RoadmapTask(BaseModel):
    id: str
    title: str
    description: str
    day: int
    week: int
    status: str = "pending"  # pending, in_progress, completed, skipped
    estimated_minutes: int = 30
    topic: str
    difficulty: str = "medium"
    prerequisites: List[str] = []


class Roadmap(BaseModel):
    id: str
    title: str
    description: str
    total_days: int
    total_weeks: int
    tasks: List[RoadmapTask]
    created_at: str
    adapted_count: int = 0


class RoadmapGenerateRequest(BaseModel):
    document_ids: Optional[List[str]] = None
    topic: Optional[str] = None
    duration_weeks: int = 4
    daily_hours: float = 1.0
    skill_level: str = "beginner"  # beginner, intermediate, advanced


# ─── Flashcard Models ────────────────────────────────────────

class Flashcard(BaseModel):
    id: str
    front: str
    back: str
    topic: str
    difficulty: str = "medium"
    ease_factor: float = 2.5  # Spaced repetition
    interval_days: int = 1
    next_review: Optional[str] = None
    times_reviewed: int = 0


class FlashcardGenerateRequest(BaseModel):
    document_ids: Optional[List[str]] = None
    topic: Optional[str] = None
    num_cards: int = 20


class FlashcardDeck(BaseModel):
    id: str
    title: str
    cards: List[Flashcard]
    created_at: str


class FlashcardReview(BaseModel):
    card_id: str
    rating: int  # 1=again, 2=hard, 3=good, 4=easy


# ─── Analytics Models ────────────────────────────────────────

class LearningAnalytics(BaseModel):
    total_study_time_minutes: int = 0
    current_streak: int = 0
    longest_streak: int = 0
    total_quizzes_taken: int = 0
    average_quiz_score: float = 0.0
    total_documents: int = 0
    total_flashcards_reviewed: int = 0
    weak_topics: List[str] = []
    strong_topics: List[str] = []
    progress_percentage: float = 0.0
    daily_activity: List[dict] = []
    recent_scores: List[dict] = []


class PerformanceUpdate(BaseModel):
    activity_type: str  # quiz, flashcard, study, roadmap_task
    topic: Optional[str] = None
    score: Optional[float] = None
    time_spent_minutes: int = 0
    metadata: Optional[dict] = None


# ─── Dashboard Models ────────────────────────────────────────

class DashboardData(BaseModel):
    user: UserProfile
    analytics: LearningAnalytics
    active_roadmap: Optional[Roadmap] = None
    recent_quizzes: List[dict] = []
    upcoming_flashcards: int = 0
    documents: List[DocumentListItem] = []
    ai_recommendations: List[str] = []
    daily_tasks: List[RoadmapTask] = []
