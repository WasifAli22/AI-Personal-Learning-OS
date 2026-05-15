"""
AI Service — Gemini Flash integration for generation tasks.
"""

import google.generativeai as genai
from typing import List, Optional
import json

from app.config import get_settings


class AIService:
    """Handles all Gemini AI generation tasks."""

    def __init__(self):
        settings = get_settings()
        genai.configure(api_key=settings.gemini_api_key)
        self.model = genai.GenerativeModel("gemini-2.0-flash")

    async def chat_with_context(self, query: str, context: str, chat_history: List[dict] = None) -> str:
        """RAG-powered chat: answer from provided context only."""
        system_prompt = f"""You are an expert AI tutor. Answer ONLY from the provided context.
If the answer isn't in context, say so. Explain clearly for beginners. Use examples.

CONTEXT:
---
{context}
---"""
        messages = [
            {"role": "user", "parts": [system_prompt]},
            {"role": "model", "parts": ["Ready to help! Ask me anything about your materials."]}
        ]
        if chat_history:
            for msg in chat_history[-6:]:
                role = "user" if msg["role"] == "user" else "model"
                messages.append({"role": role, "parts": [msg["content"]]})
        messages.append({"role": "user", "parts": [query]})
        response = self.model.generate_content(messages)
        return response.text

    async def generate_quiz(self, content: str, num_questions: int = 10,
                           difficulty: str = "medium", question_types: List[str] = None) -> dict:
        if not question_types:
            question_types = ["mcq", "true_false", "short_answer"]
        prompt = f"""Generate {num_questions} {difficulty} quiz questions. Types: {', '.join(question_types)}.
Return ONLY valid JSON: {{"title":"Quiz on [topic]","questions":[{{"question":"...","question_type":"mcq|true_false|short_answer","options":["A)...","B)...","C)...","D)..."],"correct_answer":"...","explanation":"...","difficulty":"...","topic":"..."}}]}}

MATERIAL:
{content[:6000]}"""
        response = self.model.generate_content(prompt)
        return self._parse_json(response.text)

    async def generate_roadmap(self, content: str, duration_weeks: int = 4,
                              daily_hours: float = 1.0, skill_level: str = "beginner") -> dict:
        prompt = f"""Create a {duration_weeks}-week study roadmap for a {skill_level} student ({daily_hours}h/day).
Return ONLY valid JSON: {{"title":"...","description":"...","total_days":{duration_weeks*7},"total_weeks":{duration_weeks},"tasks":[{{"title":"...","description":"...","day":1,"week":1,"estimated_minutes":30,"topic":"...","difficulty":"easy|medium|hard","prerequisites":[]}}]}}

MATERIAL:
{content[:6000]}"""
        response = self.model.generate_content(prompt)
        return self._parse_json(response.text)

    async def generate_flashcards(self, content: str, num_cards: int = 20, topic: str = None) -> dict:
        t = f" on {topic}" if topic else ""
        prompt = f"""Create {num_cards} flashcards{t}.
Return ONLY valid JSON: {{"title":"Flashcards: [topic]","cards":[{{"front":"...","back":"...","topic":"...","difficulty":"easy|medium|hard"}}]}}

MATERIAL:
{content[:6000]}"""
        response = self.model.generate_content(prompt)
        return self._parse_json(response.text)

    async def adapt_roadmap(self, current_roadmap: dict, performance_data: dict, weak_topics: List[str]) -> dict:
        prompt = f"""Adapt this roadmap. Student is weak in: {', '.join(weak_topics)}. Avg score: {performance_data.get('average_score', 0)}.
Add extra practice for weak topics, slow pace, add prerequisites.
Return adapted roadmap as ONLY valid JSON (same structure).

ROADMAP:
{json.dumps(current_roadmap, indent=2)[:3000]}"""
        response = self.model.generate_content(prompt)
        return self._parse_json(response.text)

    async def get_recommendations(self, analytics: dict) -> List[str]:
        prompt = f"""Give 5 learning recommendations based on: streak={analytics.get('current_streak',0)}, avg_score={analytics.get('average_quiz_score',0)}, weak={analytics.get('weak_topics',[])}, docs={analytics.get('total_documents',0)}.
Return ONLY a JSON array of 5 strings."""
        try:
            response = self.model.generate_content(prompt)
            return self._parse_json(response.text)
        except Exception:
            return ["Upload materials", "Take quizzes", "Review flashcards", "Follow your roadmap", "Study daily"]

    def _parse_json(self, text: str):
        text = text.strip()
        if text.startswith("```json"): text = text[7:]
        elif text.startswith("```"): text = text[3:]
        if text.endswith("```"): text = text[:-3]
        return json.loads(text.strip())


_ai_service: Optional[AIService] = None

def get_ai_service() -> AIService:
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service
