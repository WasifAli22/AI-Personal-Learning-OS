"""
Supabase database service for user data, progress, quizzes, etc.
"""

from supabase import create_client, Client
from app.config import get_settings
from typing import Optional, List
import json
from datetime import datetime, timedelta


class SupabaseService:
    """Handles all Supabase database operations."""

    def __init__(self):
        settings = get_settings()
        self.client: Client = create_client(
            settings.supabase_url,
            settings.supabase_service_key or settings.supabase_key
        )

    # ─── Auth ──────────────────────────────────────────────

    async def sign_up(self, email: str, password: str, full_name: str) -> dict:
        """Register a new user, auto-confirm email, and return a live session."""
        # Step 1: Create the user in auth.users
        response = self.client.auth.sign_up({
            "email": email,
            "password": password,
            "options": {
                "data": {"full_name": full_name}
            }
        })

        user = response.user
        if not user:
            raise Exception("Signup failed: no user returned from Supabase.")

        print(f"[AUTH] sign_up: user created — id={user.id}, email={email}")

        # Step 2: Auto-confirm email using admin API (requires service_role key)
        # This bypasses the email-confirmation requirement entirely.
        try:
            self.client.auth.admin.update_user_by_id(
                user.id,
                {"email_confirm": True}
            )
            print(f"[AUTH] sign_up: email auto-confirmed for {email}")
        except Exception as confirm_err:
            print(f"[WARN] Could not auto-confirm email: {confirm_err}")

        # Step 3: Sign in immediately so the client gets a valid session token
        try:
            login_resp = self.client.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            session = login_resp.session
            print(f"[AUTH] sign_up: immediate sign-in succeeded for {email}")
        except Exception as login_err:
            print(f"[WARN] Immediate sign-in after signup failed: {login_err}")
            session = response.session  # fallback to signup session (may be None)

        # Step 4: Persist profile into public.user_profiles
        try:
            self.client.table("user_profiles").upsert({
                "id": user.id,
                "email": email,
                "full_name": full_name,
                "avatar_url": "",
                "role": "student",
                "is_active": True
            }, on_conflict="id").execute()
            print(f"[AUTH] sign_up: user_profile saved for {email}")
        except Exception as profile_err:
            print(f"[WARN] Could not upsert user_profile: {profile_err}")

        # Step 5: Log registration event
        try:
            self.client.table("auth_sessions").insert({
                "user_id": user.id,
                "event": "register",
                "status": "success"
            }).execute()
        except Exception as session_err:
            print(f"[WARN] Could not log auth_session (register): {session_err}")

        if not session:
            raise Exception(
                "Account created but could not start a session. "
                "Please try logging in directly."
            )

        return {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "user_id": user.id,
            "email": email,
            "full_name": full_name
        }

    async def sign_in(self, email: str, password: str) -> dict:
        """Sign in an existing user and log the session."""
        try:
            response = self.client.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
        except Exception as e:
            # Log failed attempt if we can resolve the user
            print(f"[AUTH] sign_in FAILED for {email}: {e}")
            raise  # re-raise so the caller sees the real error

        user = response.user
        session = response.session
        user_meta = user.user_metadata if user else {}

        # Ensure user_profile row exists (covers users registered before this fix)
        if user:
            try:
                self.client.table("user_profiles").upsert({
                    "id": user.id,
                    "email": email,
                    "full_name": user_meta.get("full_name", ""),
                    "avatar_url": user_meta.get("avatar_url", ""),
                    "role": "student",
                    "is_active": True
                }, on_conflict="id").execute()
            except Exception as profile_err:
                print(f"[WARN] Could not upsert user_profile on login: {profile_err}")

            # Log successful login
            try:
                self.client.table("auth_sessions").insert({
                    "user_id": user.id,
                    "event": "login",
                    "status": "success"
                }).execute()
            except Exception as session_err:
                print(f"[WARN] Could not log auth_session (login): {session_err}")

        return {
            "access_token": session.access_token,
            "refresh_token": session.refresh_token,
            "user_id": user.id,
            "email": email,
            "full_name": user_meta.get("full_name", "")
        }

    async def confirm_and_login(self, email: str, password: str) -> dict:
        """
        Force-confirm an unconfirmed user's email via admin API, then sign them in.
        Used as a recovery path for accounts created before auto-confirm was enabled.
        """
        # Find the user by email using the admin API
        users_resp = self.client.auth.admin.list_users()
        target_user = None
        for u in (users_resp or []):
            if u.email == email:
                target_user = u
                break

        if not target_user:
            raise Exception("No account found with that email address.")

        # Confirm the email
        self.client.auth.admin.update_user_by_id(
            target_user.id,
            {"email_confirm": True}
        )
        print(f"[AUTH] confirm_and_login: confirmed email for {email}")

        # Now sign in normally
        return await self.sign_in(email, password)

    async def get_user(self, token: str) -> Optional[dict]:
        """Get user from JWT token."""
        try:
            response = self.client.auth.get_user(token)
            if response.user:
                meta = response.user.user_metadata or {}
                return {
                    "id": response.user.id,
                    "email": response.user.email,
                    "full_name": meta.get("full_name", ""),
                    "avatar_url": meta.get("avatar_url", ""),
                    "created_at": str(response.user.created_at) if response.user.created_at else ""
                }
        except Exception:
            return None

    # ─── Documents ─────────────────────────────────────────

    async def save_document(self, user_id: str, doc_data: dict) -> dict:
        """Save document metadata to database."""
        result = self.client.table("documents").insert({
            "user_id": user_id,
            "filename": doc_data["filename"],
            "doc_type": doc_data["doc_type"],
            "chunk_count": doc_data["chunk_count"],
            "file_size": doc_data.get("file_size", 0),
            "status": "processed"
        }).execute()
        return result.data[0] if result.data else {}

    async def get_documents(self, user_id: str) -> List[dict]:
        """Get all documents for a user."""
        result = self.client.table("documents").select("*").eq(
            "user_id", user_id
        ).order("created_at", desc=True).execute()
        return result.data or []

    async def get_document(self, doc_id: str, user_id: str) -> Optional[dict]:
        """Get a single document."""
        result = self.client.table("documents").select("*").eq(
            "id", doc_id
        ).eq("user_id", user_id).execute()
        return result.data[0] if result.data else None

    # ─── Quizzes ───────────────────────────────────────────

    async def save_quiz(self, user_id: str, quiz_data: dict) -> dict:
        """Save a generated quiz."""
        result = self.client.table("quizzes").insert({
            "user_id": user_id,
            "title": quiz_data["title"],
            "questions": json.dumps(quiz_data["questions"]),
            "document_ids": quiz_data.get("document_ids", []),
            "topic": quiz_data.get("topic", "")
        }).execute()
        return result.data[0] if result.data else {}

    async def get_quizzes(self, user_id: str) -> List[dict]:
        """Get all quizzes for a user."""
        result = self.client.table("quizzes").select("*").eq(
            "user_id", user_id
        ).order("created_at", desc=True).execute()
        return result.data or []

    async def save_quiz_result(self, user_id: str, result_data: dict) -> dict:
        """Save quiz submission results."""
        result = self.client.table("quiz_results").insert({
            "user_id": user_id,
            "quiz_id": result_data["quiz_id"],
            "score": result_data["score"],
            "total_questions": result_data["total_questions"],
            "correct_answers": result_data["correct_answers"],
            "wrong_answers": json.dumps(result_data["wrong_answers"]),
            "weak_topics": result_data["weak_topics"]
        }).execute()
        return result.data[0] if result.data else {}

    # ─── Roadmaps ──────────────────────────────────────────

    async def save_roadmap(self, user_id: str, roadmap_data: dict) -> dict:
        """Save a generated roadmap."""
        result = self.client.table("roadmaps").insert({
            "user_id": user_id,
            "title": roadmap_data["title"],
            "description": roadmap_data["description"],
            "total_days": roadmap_data["total_days"],
            "total_weeks": roadmap_data["total_weeks"],
            "tasks": json.dumps(roadmap_data["tasks"]),
            "adapted_count": 0
        }).execute()
        return result.data[0] if result.data else {}

    async def get_active_roadmap(self, user_id: str) -> Optional[dict]:
        """Get the most recent active roadmap."""
        result = self.client.table("roadmaps").select("*").eq(
            "user_id", user_id
        ).order("created_at", desc=True).limit(1).execute()
        return result.data[0] if result.data else None

    async def update_roadmap(self, roadmap_id: str, updates: dict) -> dict:
        """Update roadmap (e.g., adapt tasks)."""
        result = self.client.table("roadmaps").update(updates).eq(
            "id", roadmap_id
        ).execute()
        return result.data[0] if result.data else {}

    # ─── Flashcards ────────────────────────────────────────

    async def save_flashcard_deck(self, user_id: str, deck_data: dict) -> dict:
        """Save a flashcard deck."""
        result = self.client.table("flashcard_decks").insert({
            "user_id": user_id,
            "title": deck_data["title"],
            "cards": json.dumps(deck_data["cards"]),
            "topic": deck_data.get("topic", "")
        }).execute()
        return result.data[0] if result.data else {}

    async def get_flashcard_decks(self, user_id: str) -> List[dict]:
        """Get all flashcard decks for a user."""
        result = self.client.table("flashcard_decks").select("*").eq(
            "user_id", user_id
        ).order("created_at", desc=True).execute()
        return result.data or []

    # ─── Analytics ─────────────────────────────────────────

    async def save_activity(self, user_id: str, activity: dict) -> dict:
        """Log a learning activity."""
        result = self.client.table("activities").insert({
            "user_id": user_id,
            "activity_type": activity["activity_type"],
            "topic": activity.get("topic", ""),
            "score": activity.get("score"),
            "time_spent_minutes": activity.get("time_spent_minutes", 0),
            "metadata": json.dumps(activity.get("metadata", {}))
        }).execute()
        return result.data[0] if result.data else {}

    async def get_analytics(self, user_id: str) -> dict:
        """Compute learning analytics for a user."""
        # Get all activities
        activities = self.client.table("activities").select("*").eq(
            "user_id", user_id
        ).order("created_at", desc=True).execute()

        # Get quiz results
        quiz_results = self.client.table("quiz_results").select("*").eq(
            "user_id", user_id
        ).order("created_at", desc=True).execute()

        # Get documents count
        docs = self.client.table("documents").select("id").eq(
            "user_id", user_id
        ).execute()

        all_activities = activities.data or []
        all_quizzes = quiz_results.data or []

        # Calculate streak
        streak = self._calculate_streak(all_activities)

        # Calculate quiz stats
        total_quizzes = len(all_quizzes)
        avg_score = (
            sum(q.get("score", 0) for q in all_quizzes) / total_quizzes
            if total_quizzes > 0 else 0
        )

        # Find weak topics
        weak_topics = self._find_weak_topics(all_quizzes)
        strong_topics = self._find_strong_topics(all_quizzes)

        # Total study time
        total_time = sum(a.get("time_spent_minutes", 0) for a in all_activities)

        # Recent scores for chart
        recent_scores = [
            {"date": q.get("created_at", ""), "score": q.get("score", 0)}
            for q in all_quizzes[:10]
        ]

        return {
            "total_study_time_minutes": total_time,
            "current_streak": streak,
            "longest_streak": streak,  # simplified
            "total_quizzes_taken": total_quizzes,
            "average_quiz_score": round(avg_score, 1),
            "total_documents": len(docs.data or []),
            "total_flashcards_reviewed": sum(
                1 for a in all_activities if a.get("activity_type") == "flashcard"
            ),
            "weak_topics": weak_topics,
            "strong_topics": strong_topics,
            "progress_percentage": min(100, total_quizzes * 5 + len(docs.data or []) * 10),
            "daily_activity": self._get_daily_activity(all_activities),
            "recent_scores": recent_scores
        }

    def _calculate_streak(self, activities: List[dict]) -> int:
        """Calculate current learning streak in days."""
        if not activities:
            return 0
        dates = set()
        for a in activities:
            if a.get("created_at"):
                date_str = a["created_at"][:10]
                dates.add(date_str)

        sorted_dates = sorted(dates, reverse=True)
        if not sorted_dates:
            return 0

        streak = 1
        for i in range(len(sorted_dates) - 1):
            current = datetime.strptime(sorted_dates[i], "%Y-%m-%d")
            prev = datetime.strptime(sorted_dates[i + 1], "%Y-%m-%d")
            if (current - prev).days == 1:
                streak += 1
            else:
                break
        return streak

    def _find_weak_topics(self, quiz_results: List[dict]) -> List[str]:
        """Identify topics where user scores are low."""
        topic_scores = {}
        for q in quiz_results:
            wrong = q.get("wrong_answers", "[]")
            if isinstance(wrong, str):
                try:
                    wrong = json.loads(wrong)
                except Exception:
                    wrong = []
            for w in wrong:
                topic = w.get("topic", "General")
                topic_scores.setdefault(topic, []).append(0)

        return [t for t, scores in topic_scores.items() if len(scores) >= 2][:5]

    def _find_strong_topics(self, quiz_results: List[dict]) -> List[str]:
        """Identify topics where user consistently scores well."""
        topic_correct = {}
        for q in quiz_results:
            weak_topics = q.get("weak_topics", [])
            if isinstance(weak_topics, str):
                try:
                    weak_topics = json.loads(weak_topics)
                except Exception:
                    weak_topics = []
            # Topics NOT in weak are potentially strong
        return list(topic_correct.keys())[:5]

    def _get_daily_activity(self, activities: List[dict]) -> List[dict]:
        """Get daily activity summary for last 7 days."""
        daily = {}
        for a in activities:
            if a.get("created_at"):
                date = a["created_at"][:10]
                daily.setdefault(date, 0)
                daily[date] += a.get("time_spent_minutes", 0)

        return [
            {"date": date, "minutes": minutes}
            for date, minutes in sorted(daily.items())[-7:]
        ]


# Singleton
_supabase_service: Optional[SupabaseService] = None


def get_supabase_service() -> SupabaseService:
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service
