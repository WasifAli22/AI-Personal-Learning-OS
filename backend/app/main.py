"""
AI Personal Learning OS — FastAPI Main Application
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import get_settings
from app.api.auth import router as auth_router
from app.api.documents import router as documents_router
from app.api.learning import router as learning_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown lifecycle."""
    print("🚀 AI Personal Learning OS starting...")
    print("📚 Initializing RAG pipeline...")
    # Pre-initialize services on startup
    try:
        from app.rag.pipeline import get_rag_pipeline
        get_rag_pipeline()
        print("✅ RAG pipeline ready")
    except Exception as e:
        print(f"⚠️ RAG pipeline init deferred: {e}")

    yield

    print("👋 AI Personal Learning OS shutting down...")


app = FastAPI(
    title="AI Personal Learning OS",
    description="Autonomous AI-powered personalized learning platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
settings = get_settings()
origins = settings.cors_origins.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(learning_router, prefix="/api")


@app.get("/")
async def root():
    return {
        "name": "AI Personal Learning OS",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "auth": "/api/auth",
            "documents": "/api/documents",
            "chat": "/api/chat",
            "quiz": "/api/generate-quiz",
            "roadmap": "/api/generate-roadmap",
            "flashcards": "/api/generate-flashcards",
            "dashboard": "/api/dashboard",
            "analytics": "/api/analytics"
        }
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
