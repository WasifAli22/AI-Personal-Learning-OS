"""
CrewAI Multi-Agent System for AI Personal Learning OS.
Agents: Planner, Tutor, Quiz, Revision, Performance.
"""

from typing import List, Optional
import json
from app.services.ai_service import get_ai_service
from app.rag.pipeline import get_rag_pipeline


class BaseAgent:
    """Base class for all learning agents."""
    def __init__(self, name: str, role: str, goal: str):
        self.name = name
        self.role = role
        self.goal = goal
        self.ai = get_ai_service()
        self.rag = get_rag_pipeline()


class PlannerAgent(BaseAgent):
    """Creates personalized learning roadmaps and schedules."""
    def __init__(self):
        super().__init__(
            name="Planner Agent",
            role="Learning Path Architect",
            goal="Create optimal, personalized study plans based on content and student needs"
        )

    async def create_roadmap(self, user_id: str, document_ids: List[str] = None,
                            duration_weeks: int = 4, daily_hours: float = 1.0,
                            skill_level: str = "beginner") -> dict:
        content = await self.rag.get_all_content(user_id, document_ids)
        # Fall back to general content if no documents uploaded
        if not content:
            content = "general knowledge, study skills, and academic topics"
        roadmap = await self.ai.generate_roadmap(content, duration_weeks, daily_hours, skill_level)
        return roadmap

    async def adapt_roadmap(self, current_roadmap: dict, performance_data: dict,
                           weak_topics: List[str]) -> dict:
        return await self.ai.adapt_roadmap(current_roadmap, performance_data, weak_topics)


class TutorAgent(BaseAgent):
    """Explains concepts and answers questions using RAG."""
    def __init__(self):
        super().__init__(
            name="Tutor Agent",
            role="AI Learning Companion",
            goal="Help students understand concepts through clear explanations"
        )

    async def answer_question(self, query: str, user_id: str,
                             document_ids: List[str] = None,
                             chat_history: List[dict] = None) -> dict:
        context, sources = await self.rag.get_context_for_query(query, user_id, document_ids)
        if not context:
            return {
                "response": "I don't have any uploaded materials to reference. Please upload documents first.",
                "sources": []
            }
        answer = await self.ai.chat_with_context(query, context, chat_history)
        return {"response": answer, "sources": sources}


class QuizAgent(BaseAgent):
    """Generates quizzes and assessments from learning materials."""
    def __init__(self):
        super().__init__(
            name="Quiz Agent",
            role="Assessment Creator",
            goal="Generate effective assessments to test and reinforce learning"
        )

    async def generate_quiz(self, user_id: str, document_ids: List[str] = None,
                           topic: str = None, num_questions: int = 10,
                           difficulty: str = "medium",
                           question_types: List[str] = None) -> dict:
        content = await self.rag.get_all_content(user_id, document_ids)
        # Fall back to topic if no uploaded content
        if not content:
            content = topic if topic else "general knowledge and common study topics"
        quiz = await self.ai.generate_quiz(content, num_questions, difficulty, question_types)
        return quiz

    def grade_quiz(self, quiz_questions: List[dict], user_answers: dict) -> dict:
        correct = 0
        wrong_answers = []
        for q in quiz_questions:
            q_id = q.get("id", "")
            user_answer = user_answers.get(q_id, "").strip().lower()
            correct_answer = q.get("correct_answer", "").strip().lower()
            if user_answer == correct_answer or user_answer in correct_answer:
                correct += 1
            else:
                wrong_answers.append({
                    "question_id": q_id,
                    "question": q.get("question", ""),
                    "correct": q.get("correct_answer", ""),
                    "user_answer": user_answers.get(q_id, ""),
                    "topic": q.get("topic", "General"),
                    "explanation": q.get("explanation", "")
                })
        total = len(quiz_questions)
        score = (correct / total * 100) if total > 0 else 0
        weak_topics = list(set(w["topic"] for w in wrong_answers))
        return {
            "score": round(score, 1),
            "total_questions": total,
            "correct_answers": correct,
            "wrong_answers": wrong_answers,
            "weak_topics": weak_topics,
            "recommendations": [
                f"Review: {t}" for t in weak_topics[:3]
            ] if weak_topics else ["Great job! Keep up the good work!"]
        }


class RevisionAgent(BaseAgent):
    """Creates flashcards and summaries for revision."""
    def __init__(self):
        super().__init__(
            name="Revision Agent",
            role="Study Material Creator",
            goal="Create effective revision materials for spaced repetition learning"
        )

    async def generate_flashcards(self, user_id: str, document_ids: List[str] = None,
                                  topic: str = None, num_cards: int = 20) -> dict:
        content = await self.rag.get_all_content(user_id, document_ids)
        # Fall back to topic if no uploaded content
        if not content:
            content = topic if topic else "general knowledge and common study topics"
        return await self.ai.generate_flashcards(content, num_cards, topic)


class PerformanceAgent(BaseAgent):
    """Tracks performance and triggers adaptive learning."""
    def __init__(self):
        super().__init__(
            name="Performance Agent",
            role="Learning Analytics Analyst",
            goal="Monitor student progress and adapt learning paths for optimal outcomes"
        )

    async def analyze_and_adapt(self, user_id: str, analytics: dict,
                                current_roadmap: dict = None) -> dict:
        result = {"adapted": False, "recommendations": [], "new_roadmap": None}

        recommendations = await self.ai.get_recommendations(analytics)
        result["recommendations"] = recommendations

        # Check if adaptation is needed
        avg_score = analytics.get("average_quiz_score", 100)
        weak_topics = analytics.get("weak_topics", [])

        if current_roadmap and (avg_score < 60 or len(weak_topics) >= 2):
            adapted = await self.ai.adapt_roadmap(
                current_roadmap,
                {"average_score": avg_score, "recent_scores": analytics.get("recent_scores", [])},
                weak_topics
            )
            result["adapted"] = True
            result["new_roadmap"] = adapted

        return result


class AgentOrchestrator:
    """Orchestrates all agents for collaborative workflows."""
    def __init__(self):
        self.planner = PlannerAgent()
        self.tutor = TutorAgent()
        self.quiz = QuizAgent()
        self.revision = RevisionAgent()
        self.performance = PerformanceAgent()

    async def full_learning_pipeline(self, user_id: str, document_ids: List[str] = None) -> dict:
        """Run complete learning pipeline: roadmap + quiz + flashcards."""
        roadmap = await self.planner.create_roadmap(user_id, document_ids)
        quiz = await self.quiz.generate_quiz(user_id, document_ids, num_questions=5)
        flashcards = await self.revision.generate_flashcards(user_id, document_ids, num_cards=10)
        return {"roadmap": roadmap, "quiz": quiz, "flashcards": flashcards}


_orchestrator: Optional[AgentOrchestrator] = None

def get_orchestrator() -> AgentOrchestrator:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = AgentOrchestrator()
    return _orchestrator
