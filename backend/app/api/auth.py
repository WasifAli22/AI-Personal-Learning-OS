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
        msg = str(e)
        # Surface friendly messages for known Supabase errors
        if "rate limit" in msg.lower() or "email rate" in msg.lower():
            detail = (
                "Email rate limit exceeded. "
                "To fix: go to Supabase Dashboard → Authentication → Providers → Email "
                "and disable 'Confirm email' (for development)."
            )
        elif "already registered" in msg.lower() or "already exists" in msg.lower():
            detail = "An account with this email already exists. Please log in instead."
        else:
            detail = msg
        raise HTTPException(status_code=400, detail=detail)


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """Sign in an existing user."""
    try:
        svc = get_supabase_service()
        result = await svc.sign_in(request.email, request.password)
        return AuthResponse(**result)
    except Exception as e:
        msg = str(e)
        print(f"[AUTH] /login error for {request.email}: {msg}")

        # If the error is "Email not confirmed", auto-confirm and retry
        if "not confirmed" in msg.lower() or "email not confirmed" in msg.lower():
            try:
                fixed = await svc.confirm_and_login(request.email, request.password)
                return AuthResponse(**fixed)
            except Exception as retry_err:
                raise HTTPException(status_code=401, detail=str(retry_err))

        if "invalid login" in msg.lower() or "invalid credentials" in msg.lower():
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        raise HTTPException(status_code=401, detail=msg)


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
