"""
Authentication API routes.
"""

from fastapi import APIRouter, HTTPException, Header
from typing import Optional

from app.models.schemas import SignUpRequest, LoginRequest, AuthResponse, UserProfile
from app.services.supabase_service import get_supabase_service

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=AuthResponse)
async def signup(request: SignUpRequest):
    """Register a new user."""
    try:
        svc = get_supabase_service()
        result = await svc.sign_up(request.email, request.password, request.full_name)
        return AuthResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """Sign in an existing user."""
    try:
        svc = get_supabase_service()
        result = await svc.sign_in(request.email, request.password)
        return AuthResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid email or password")


@router.get("/me", response_model=UserProfile)
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Get current authenticated user."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = authorization.replace("Bearer ", "")
    svc = get_supabase_service()
    user = await svc.get_user(token)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return UserProfile(**user)
