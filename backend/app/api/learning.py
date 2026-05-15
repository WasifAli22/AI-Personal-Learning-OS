"""
Chat, Quiz, Roadmap, Flashcard, Dashboard, and Performance API routes.
"""

import uuid
import json
from fastapi import APIRouter, HTTPException, Header
from typing import Optional, List

from app.models.schemas import (
    ChatRequest, ChatResponse, QuizGenerateRequest, Quiz, QuizQuestion,
    QuizSubmission, QuizResult, RoadmapGenerateRequest, Roadmap, RoadmapTask,
    FlashcardGenerateRequest, FlashcardDeck, Flashcard,
    DashboardData, LearningAnalytics, PerformanceUpdate, UserProfile
)
from app.services.supabase_service import get_supabase_service
from app.agents.crew import get_orchestrator

router = APIRouter(tags=["Learning"])


async def _get_user_id(authorization: str) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.replace("Bearer ", "")
    svc = get_supabase_service()
    user = await svc.get_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user["id"]


async def _get_user(authorization: str) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.replace("Bearer ", "")
    svc = get_supabase_service()
    user = await svc.get_user(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user


# ─── Chat ──────────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, authorization: Optional[str] = Header(None)):
    """RAG-powered chat with AI tutor."""
    user_id = await _get_user_id(authorization)
    orch = get_orchestrator()

    result = await orch.tutor.answer_question(
        query=request.message,
        user_id=user_id,
        document_ids=request.document_ids
    )

    conv_id = request.conversation_id or str(uuid.uuid4())

    # Log activity
    svc = get_supabase_service()
    try:
        await svc.save_activity(user_id, {
            "activity_type": "study",
            "topic": "chat",
            "time_spent_minutes": 2
        })
    except Exception:
        pass

    return ChatResponse(
        response=result["response"],
        sources=result.get("sources", []),
        conversation_id=conv_id
    )


# ─── Quizzes ───────────────────────────────────────────────

@router.post("/generate-quiz")
async def generate_quiz(request: QuizGenerateRequest, authorization: Optional[str] = Header(None)):
    """Generate a quiz from uploaded materials."""
    user_id = await _get_user_id(authorization)
    orch = get_orchestrator()

    quiz_data = await orch.quiz.generate_quiz(
        user_id=user_id,
        document_ids=request.document_ids,
        topic=request.topic,
        num_questions=request.num_questions,
        difficulty=request.difficulty,
        question_types=request.question_types
    )

    if "error" in quiz_data:
        raise HTTPException(status_code=400, detail=quiz_data["error"])

    # Add IDs to questions
    quiz_id = str(uuid.uuid4())
    questions = quiz_data.get("questions", [])
    for i, q in enumerate(questions):
        q["id"] = f"{quiz_id}_q{i}"

    # Save to database
    svc = get_supabase_service()
    try:
        await svc.save_quiz(user_id, {
            "title": quiz_data.get("title", "Quiz"),
            "questions": questions,
            "document_ids": request.document_ids,
            "topic": request.topic
        })
    except Exception:
        pass

    return {
        "id": quiz_id,
        "title": quiz_data.get("title", "Quiz"),
        "questions": questions,
        "created_at": ""
    }


@router.post("/submit-quiz", response_model=QuizResult)
async def submit_quiz(submission: QuizSubmission, authorization: Optional[str] = Header(None)):
    """Submit quiz answers and get results."""
    user_id = await _get_user_id(authorization)
    orch = get_orchestrator()
    svc = get_supabase_service()

    # Get quiz questions (from recent quizzes)
    quizzes = await svc.get_quizzes(user_id)
    quiz_questions = []
    for q in quizzes:
        questions = q.get("questions", "[]")
        if isinstance(questions, str):
            questions = json.loads(questions)
        for question in questions:
            if question.get("id", "").startswith(submission.quiz_id):
                quiz_questions.append(question)

    if not quiz_questions:
        raise HTTPException(status_code=404, detail="Quiz not found")

    result = orch.quiz.grade_quiz(quiz_questions, submission.answers)
    result["quiz_id"] = submission.quiz_id

    # Save result
    try:
        await svc.save_quiz_result(user_id, result)
        await svc.save_activity(user_id, {
            "activity_type": "quiz",
            "topic": result.get("weak_topics", ["General"])[0] if result.get("weak_topics") else "General",
            "score": result["score"],
            "time_spent_minutes": 5
        })
    except Exception:
        pass

    # Check if adaptation is needed
    if result["score"] < 60:
        try:
            analytics = await svc.get_analytics(user_id)
            roadmap_data = await svc.get_active_roadmap(user_id)
            if roadmap_data:
                adapt_result = await orch.performance.analyze_and_adapt(
                    user_id, analytics, roadmap_data
                )
                if adapt_result.get("adapted") and adapt_result.get("new_roadmap"):
                    await svc.update_roadmap(roadmap_data["id"], {
                        "tasks": json.dumps(adapt_result["new_roadmap"].get("tasks", [])),
                        "adapted_count": roadmap_data.get("adapted_count", 0) + 1
                    })
        except Exception:
            pass

    return QuizResult(**result)


# ─── Roadmap ───────────────────────────────────────────────

@router.post("/generate-roadmap")
async def generate_roadmap(request: RoadmapGenerateRequest, authorization: Optional[str] = Header(None)):
    """Generate a personalized learning roadmap."""
    user_id = await _get_user_id(authorization)
    orch = get_orchestrator()

    roadmap_data = await orch.planner.create_roadmap(
        user_id=user_id,
        document_ids=request.document_ids,
        duration_weeks=request.duration_weeks,
        daily_hours=request.daily_hours,
        skill_level=request.skill_level
    )

    if "error" in roadmap_data:
        raise HTTPException(status_code=400, detail=roadmap_data["error"])

    # Add IDs to tasks
    roadmap_id = str(uuid.uuid4())
    tasks = roadmap_data.get("tasks", [])
    for i, t in enumerate(tasks):
        t["id"] = f"{roadmap_id}_t{i}"
        t["status"] = "pending"

    # Save to database
    svc = get_supabase_service()
    try:
        saved = await svc.save_roadmap(user_id, {
            "title": roadmap_data.get("title", "Learning Roadmap"),
            "description": roadmap_data.get("description", ""),
            "total_days": roadmap_data.get("total_days", 28),
            "total_weeks": roadmap_data.get("total_weeks", 4),
            "tasks": tasks
        })
    except Exception:
        pass

    return {
        "id": roadmap_id,
        "title": roadmap_data.get("title", "Learning Roadmap"),
        "description": roadmap_data.get("description", ""),
        "total_days": roadmap_data.get("total_days", 28),
        "total_weeks": roadmap_data.get("total_weeks", 4),
        "tasks": tasks,
        "created_at": "",
        "adapted_count": 0
    }


@router.get("/roadmap")
async def get_roadmap(authorization: Optional[str] = Header(None)):
    """Get current active roadmap."""
    user_id = await _get_user_id(authorization)
    svc = get_supabase_service()
    roadmap = await svc.get_active_roadmap(user_id)
    if not roadmap:
        return None
    # Parse tasks if stored as JSON string
    if isinstance(roadmap.get("tasks"), str):
        roadmap["tasks"] = json.loads(roadmap["tasks"])
    return roadmap


# ─── Flashcards ────────────────────────────────────────────

@router.post("/generate-flashcards")
async def generate_flashcards(request: FlashcardGenerateRequest, authorization: Optional[str] = Header(None)):
    """Generate flashcards from uploaded materials."""
    user_id = await _get_user_id(authorization)
    orch = get_orchestrator()

    deck_data = await orch.revision.generate_flashcards(
        user_id=user_id,
        document_ids=request.document_ids,
        topic=request.topic,
        num_cards=request.num_cards
    )

    if "error" in deck_data:
        raise HTTPException(status_code=400, detail=deck_data["error"])

    deck_id = str(uuid.uuid4())
    cards = deck_data.get("cards", [])
    for i, c in enumerate(cards):
        c["id"] = f"{deck_id}_c{i}"
        c["ease_factor"] = 2.5
        c["interval_days"] = 1
        c["times_reviewed"] = 0

    # Save
    svc = get_supabase_service()
    try:
        await svc.save_flashcard_deck(user_id, {
            "title": deck_data.get("title", "Flashcards"),
            "cards": cards,
            "topic": request.topic
        })
    except Exception:
        pass

    return {
        "id": deck_id,
        "title": deck_data.get("title", "Flashcards"),
        "cards": cards,
        "created_at": ""
    }


@router.get("/flashcards")
async def get_flashcards(authorization: Optional[str] = Header(None)):
    """Get all flashcard decks."""
    user_id = await _get_user_id(authorization)
    svc = get_supabase_service()
    decks = await svc.get_flashcard_decks(user_id)
    for d in decks:
        if isinstance(d.get("cards"), str):
            d["cards"] = json.loads(d["cards"])
    return decks


# ─── Dashboard ─────────────────────────────────────────────

@router.get("/dashboard")
async def get_dashboard(authorization: Optional[str] = Header(None)):
    """Get complete dashboard data."""
    user_data = await _get_user(authorization)
    user_id = user_data["id"]
    svc = get_supabase_service()
    orch = get_orchestrator()

    # Gather all data
    analytics = await svc.get_analytics(user_id)
    roadmap = await svc.get_active_roadmap(user_id)
    quizzes = await svc.get_quizzes(user_id)
    docs = await svc.get_documents(user_id)

    # Parse roadmap tasks
    daily_tasks = []
    if roadmap:
        tasks = roadmap.get("tasks", "[]")
        if isinstance(tasks, str):
            tasks = json.loads(tasks)
        daily_tasks = [t for t in tasks if t.get("status") == "pending"][:5]

    # Get AI recommendations
    recommendations = await orch.performance.ai.get_recommendations(analytics)

    return {
        "user": user_data,
        "analytics": analytics,
        "active_roadmap": roadmap,
        "recent_quizzes": quizzes[:5],
        "documents": [
            {"id": d["id"], "filename": d["filename"], "doc_type": d.get("doc_type", ""), "chunk_count": d.get("chunk_count", 0), "created_at": d.get("created_at", "")}
            for d in docs[:10]
        ],
        "ai_recommendations": recommendations if isinstance(recommendations, list) else [],
        "daily_tasks": daily_tasks,
        "upcoming_flashcards": 0
    }


# ─── Performance ───────────────────────────────────────────

@router.post("/update-performance")
async def update_performance(update: PerformanceUpdate, authorization: Optional[str] = Header(None)):
    """Log a performance update and trigger adaptive learning."""
    user_id = await _get_user_id(authorization)
    svc = get_supabase_service()

    await svc.save_activity(user_id, {
        "activity_type": update.activity_type,
        "topic": update.topic,
        "score": update.score,
        "time_spent_minutes": update.time_spent_minutes,
        "metadata": update.metadata
    })

    return {"status": "recorded"}


@router.get("/analytics")
async def get_analytics(authorization: Optional[str] = Header(None)):
    """Get learning analytics."""
    user_id = await _get_user_id(authorization)
    svc = get_supabase_service()
    return await svc.get_analytics(user_id)
