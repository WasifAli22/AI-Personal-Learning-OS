from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    app_name: str = "AI Personal Learning OS"
    app_env: str = "development"
    cors_origins: str = "http://localhost:3000"

    # Gemini AI
    gemini_api_key: str = ""

    # Supabase
    supabase_url: str = ""
    supabase_key: str = ""
    supabase_service_key: str = ""

    # Groq (fallback)
    groq_api_key: str = ""

    # ChromaDB
    chroma_persist_dir: str = "./chroma_db"

    # Uploads
    upload_dir: str = "./uploads"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
