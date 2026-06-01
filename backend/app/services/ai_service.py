"""
AI Service — Groq integration for all generation tasks.
Robust JSON parsing with regex extraction and retry logic.
"""

import re
import json
import time
from typing import List, Optional
from groq import Groq, APIError

from app.config import get_settings


class AIService:
    """Handles all AI generation tasks using Groq."""

    def __init__(self):
        settings = get_settings()
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = "llama-3.3-70b-versatile"

    def _call_groq(self, prompt: str, system: str = None, retries: int = 2) -> str:
        """Call Groq API with retry logic. Returns raw text."""
        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        for attempt in range(retries + 1):
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    max_tokens=4096,
                    temperature=0.3,
                )
                content = response.choices[0].message.content
                if content and content.strip():
                    return content.strip()
                # Empty response, retry
                if attempt < retries:
                    time.sleep(1)
            except APIError as e:
                if attempt < retries and e.status_code in (429, 500, 502, 503):
                    time.sleep(2 ** attempt)
                    continue
                raise
        return ""

    def _extract_json(self, text: str):
        """
        Robustly extract JSON from LLM output.
        Tries multiple strategies before giving up.
        """
        if not text:
            return None

        text = text.strip()

        # Strategy 1: Remove markdown code fences
        cleaned = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
        cleaned = re.sub(r"\s*```$", "", cleaned, flags=re.MULTILINE).strip()

        # Strategy 2: Direct parse
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        # Strategy 3: Find first { ... } block
        brace_match = re.search(r'(\{.*\})', cleaned, re.DOTALL)
        if brace_match:
            try:
                return json.loads(brace_match.group(1))
            except json.JSONDecodeError:
                pass

        # Strategy 4: Find first [ ... ] block (for arrays)
        bracket_match = re.search(r'(\[.*\])', cleaned, re.DOTALL)
        if bracket_match:
            try:
                return json.loads(bracket_match.group(1))
            except json.JSONDecodeError:
                pass

        return None

    # ──────────────────────────────────────────────────────────
    # Chat / Tutor
    # ──────────────────────────────────────────────────────────

    async def chat_with_context(self, query: str, context: str, chat_history: List[dict] = None) -> str:
        """RAG-powered chat: answer strictly from uploaded document context only."""
        if context and context.strip():
            system = (
                "You are a helpful AI tutor. You MUST answer ONLY using the study material provided below. "
                "Do NOT use any outside knowledge or general information. "
                "If the answer cannot be found in the provided material, say exactly: "
                "'I couldn't find that information in your uploaded materials. Please try rephrasing your question or upload more relevant documents.' "
                "Be clear, structured, and use bullet points or numbered steps when helpful.\n\n"
                "UPLOADED STUDY MATERIAL:\n"
                "=" * 60 + "\n"
                f"{context}\n"
                "=" * 60
            )
        else:
            system = (
                "You are a helpful AI tutor. The student has not uploaded any study materials yet. "
                "Inform them that they need to upload documents (PDF, DOCX, TXT) on the Upload page first, "
                "then you can answer questions specifically about those materials. "
                "Do not answer general questions — only questions about uploaded materials."
            )

        messages = [{"role": "system", "content": system}]

        # Include conversation history for continuity (last 8 messages)
        if chat_history:
            for msg in chat_history[-8:]:
                role = "user" if msg["role"] == "user" else "assistant"
                messages.append({"role": role, "content": msg["content"]})

        messages.append({"role": "user", "content": query})

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                max_tokens=1024,
                temperature=0.2,
            )
            return response.choices[0].message.content or "I couldn't generate a response. Please try again."
        except Exception as e:
            return f"An error occurred: {str(e)}. Please try again."

    # ──────────────────────────────────────────────────────────
    # Quiz Generation
    # ──────────────────────────────────────────────────────────

    async def generate_quiz(self, content: str, num_questions: int = 5,
                            difficulty: str = "medium", question_types: List[str] = None) -> dict:
        """Generate a quiz from content. Returns dict with 'title' and 'questions'."""
        if not question_types:
            question_types = ["mcq"]

        types_str = ", ".join(question_types)
        content_snippet = content[:5000] if content else "General knowledge"

        system = (
            "You are a quiz generator. You MUST respond with ONLY valid JSON — no explanation, no markdown, no extra text. "
            "Your entire response must be parseable by Python's json.loads()."
        )

        prompt = f"""Generate exactly {num_questions} {difficulty}-difficulty quiz questions of type: {types_str}.

Use this study material as the source:
---
{content_snippet}
---

Respond with ONLY this JSON structure (no other text):
{{
  "title": "Quiz on [main topic]",
  "questions": [
    {{
      "question": "Question text here?",
      "question_type": "mcq",
      "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
      "correct_answer": "A) option1",
      "explanation": "Brief explanation why this is correct.",
      "difficulty": "{difficulty}",
      "topic": "topic name"
    }}
  ]
}}

Rules:
- For mcq: always include exactly 4 options labeled A) B) C) D)
- For true_false: options should be ["True", "False"]
- For short_answer: leave options as empty array []
- correct_answer must exactly match one of the options
- Generate exactly {num_questions} questions"""

        raw = self._call_groq(prompt, system=system)
        result = self._extract_json(raw)

        if result and isinstance(result, dict) and "questions" in result:
            questions = result["questions"]
            if questions and len(questions) > 0:
                return result

        # If LLM failed, return a descriptive error
        return {"error": f"Could not generate quiz. The AI returned: '{raw[:200] if raw else 'empty response'}'. Please try again."}

    # ──────────────────────────────────────────────────────────
    # Flashcard Generation
    # ──────────────────────────────────────────────────────────

    async def generate_flashcards(self, content: str, num_cards: int = 10, topic: str = None) -> dict:
        """Generate flashcards from content."""
        topic_str = f" on the topic: {topic}" if topic else ""
        content_snippet = content[:5000] if content else "General knowledge"

        system = (
            "You are a flashcard generator. Respond with ONLY valid JSON — no explanation, no markdown, no extra text."
        )

        prompt = f"""Create exactly {num_cards} study flashcards{topic_str}.

Use this material:
---
{content_snippet}
---

Respond with ONLY this JSON (no other text):
{{
  "title": "Flashcards: [topic]",
  "cards": [
    {{
      "front": "Question or concept",
      "back": "Answer or explanation",
      "topic": "topic name",
      "difficulty": "easy"
    }}
  ]
}}

Generate exactly {num_cards} cards with difficulty as easy/medium/hard."""

        raw = self._call_groq(prompt, system=system)
        result = self._extract_json(raw)

        if result and isinstance(result, dict) and "cards" in result:
            if result["cards"] and len(result["cards"]) > 0:
                return result

        return {"error": f"Could not generate flashcards. AI returned: '{raw[:200] if raw else 'empty response'}'. Please try again."}

    # ──────────────────────────────────────────────────────────
    # Roadmap Generation
    # ──────────────────────────────────────────────────────────

    async def generate_roadmap(self, content: str, duration_weeks: int = 4,
                               daily_hours: float = 1.0, skill_level: str = "beginner") -> dict:
        """Generate a personalized learning roadmap."""
        total_days = duration_weeks * 7
        content_snippet = content[:5000] if content else "General knowledge"

        system = (
            "You are a learning roadmap planner. Respond with ONLY valid JSON — no explanation, no markdown, no extra text."
        )

        prompt = f"""Create a {duration_weeks}-week study roadmap for a {skill_level} student studying {daily_hours} hour(s) per day.

Material to study:
---
{content_snippet}
---

Respond with ONLY this JSON (no other text):
{{
  "title": "Learning Roadmap: [topic]",
  "description": "Brief description of this learning plan.",
  "total_days": {total_days},
  "total_weeks": {duration_weeks},
  "tasks": [
    {{
      "title": "Task title",
      "description": "What to do",
      "day": 1,
      "week": 1,
      "estimated_minutes": 30,
      "topic": "topic name",
      "difficulty": "easy",
      "prerequisites": []
    }}
  ]
}}

Generate tasks spread across all {duration_weeks} weeks. Include 3-5 tasks per week."""

        raw = self._call_groq(prompt, system=system)
        result = self._extract_json(raw)

        if result and isinstance(result, dict) and "tasks" in result:
            if result["tasks"] and len(result["tasks"]) > 0:
                return result

        return {"error": f"Could not generate roadmap. AI returned: '{raw[:200] if raw else 'empty response'}'. Please try again."}

    # ──────────────────────────────────────────────────────────
    # Roadmap Adaptation
    # ──────────────────────────────────────────────────────────

    async def adapt_roadmap(self, current_roadmap: dict, performance_data: dict, weak_topics: List[str]) -> dict:
        """Adapt an existing roadmap based on student performance."""
        system = "You are a learning path optimizer. Respond with ONLY valid JSON."
        prompt = f"""Adapt this roadmap for a student who is struggling with: {', '.join(weak_topics)}.
Average score: {performance_data.get('average_score', 0)}%.

Add extra practice tasks for weak topics and slow the pace.

Current roadmap:
{json.dumps(current_roadmap, indent=2)[:2000]}

Return the adapted roadmap as ONLY valid JSON with the same structure."""

        raw = self._call_groq(prompt, system=system)
        result = self._extract_json(raw)

        if result and isinstance(result, dict) and "tasks" in result:
            return result

        return current_roadmap  # Return original if adaptation fails

    # ──────────────────────────────────────────────────────────
    # Recommendations
    # ──────────────────────────────────────────────────────────

    async def get_recommendations(self, analytics: dict) -> List[str]:
        """Get AI-powered learning recommendations."""
        default_recs = [
            "Upload your study materials to get started",
            "Take a quiz to test your knowledge",
            "Review flashcards for better retention",
            "Follow your learning roadmap daily",
            "Study consistently for at least 30 minutes per day"
        ]

        system = "You are a learning coach. Respond with ONLY a valid JSON array of strings."
        prompt = f"""Give 5 specific learning recommendations based on:
- Study streak: {analytics.get('current_streak', 0)} days
- Average quiz score: {analytics.get('average_quiz_score', 0)}%
- Weak topics: {analytics.get('weak_topics', [])}
- Documents uploaded: {analytics.get('total_documents', 0)}
- Total study time: {analytics.get('total_study_time_minutes', 0)} minutes

Respond with ONLY a JSON array of 5 recommendation strings. Example:
["Recommendation 1", "Recommendation 2", "Recommendation 3", "Recommendation 4", "Recommendation 5"]"""

        try:
            raw = self._call_groq(prompt, system=system)
            result = self._extract_json(raw)
            if result and isinstance(result, list) and len(result) > 0:
                return [str(r) for r in result[:5]]
        except Exception:
            pass

        return default_recs


# ──────────────────────────────────────────────────────────────
# Singleton
# ──────────────────────────────────────────────────────────────

_ai_service: Optional[AIService] = None


def get_ai_service() -> AIService:
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service
