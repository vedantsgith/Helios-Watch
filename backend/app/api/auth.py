"""
Auth API Routes — Helios-Watch Backend

JWT-based email + password authentication.
Endpoints: /api/auth/register, /api/auth/login, /api/auth/logout, /api/auth/me
"""

from fastapi import APIRouter, Depends, HTTPException, status, Response, Cookie
from sqlalchemy.orm import Session
from typing import Optional

from app.models.db_models import get_db, User
from app.models.schemas import RegisterRequest, LoginRequest, AuthResponse, UserResponse, UserPreferencesRequest, UserPreferencesResponse
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from app.core.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


# ─── Register ─────────────────────────────────────────────────────────────────

@router.post("/register", response_model=AuthResponse)
def register(req: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    """
    Register a new user account.

    - Checks if email already exists
    - Hashes password with bcrypt
    - Creates JWT and sets it as an httpOnly cookie
    """
    # Check for existing account
    existing = db.query(User).filter(User.email == req.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Create user with hashed password
    user = User(
        email=req.email.lower(),
        hashed_password=hash_password(req.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Issue JWT
    token = create_access_token({"sub": user.email, "id": user.id})
    _set_auth_cookie(response, token)

    return AuthResponse(
        message="Account created successfully.",
        user=UserResponse(id=user.id, email=user.email),
    )


# ─── Login ────────────────────────────────────────────────────────────────────

@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, response: Response, db: Session = Depends(get_db)):
    """
    Log in with email and password.

    - Verifies credentials
    - Issues JWT as httpOnly cookie
    """
    user = db.query(User).filter(User.email == req.email.lower()).first()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = create_access_token({"sub": user.email, "id": user.id})
    _set_auth_cookie(response, token)

    return AuthResponse(
        message="Login successful.",
        user=UserResponse(id=user.id, email=user.email),
    )


# ─── Logout ───────────────────────────────────────────────────────────────────

@router.post("/logout")
def logout(response: Response):
    """Clear the auth cookie to log out."""
    response.delete_cookie(key=settings.COOKIE_NAME, httponly=True, samesite="lax")
    return {"message": "Logged out successfully."}


# ─── Me (Session Check) ───────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
def get_me(
    db: Session = Depends(get_db),
    token: Optional[str] = Cookie(default=None, alias=settings.COOKIE_NAME),
):
    """
    Return the currently authenticated user from the JWT cookie.
    Returns 401 if not logged in or token is invalid/expired.
    """
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated.")

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token invalid or expired.")

    user_id = payload.get("id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")

    return UserResponse(id=user.id, email=user.email)


# ─── Preferences ──────────────────────────────────────────────────────────────

@router.get("/preferences", response_model=UserPreferencesResponse)
def get_preferences(
    db: Session = Depends(get_db),
    token: Optional[str] = Cookie(default=None, alias=settings.COOKIE_NAME),
):
    """Get preferences of the currently authenticated user."""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated.")

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token invalid or expired.")

    user_id = payload.get("id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")

    return UserPreferencesResponse(
        email_alerts_enabled=user.email_alerts_enabled or False,
        alert_min_status=user.alert_min_status or "M_CLASS_FLARE"
    )


@router.post("/preferences", response_model=UserPreferencesResponse)
def update_preferences(
    req: UserPreferencesRequest,
    db: Session = Depends(get_db),
    token: Optional[str] = Cookie(default=None, alias=settings.COOKIE_NAME),
):
    """Update preferences of the currently authenticated user."""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated.")

    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token invalid or expired.")

    user_id = payload.get("id")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found.")

    # Validate and save
    user.email_alerts_enabled = req.email_alerts_enabled
    if req.alert_min_status in ["RAPID_INTENSIFICATION", "M_CLASS_FLARE", "X_CLASS_FLARE"]:
        user.alert_min_status = req.alert_min_status
    else:
        raise HTTPException(status_code=400, detail="Invalid minimum status threshold.")

    db.commit()

    return UserPreferencesResponse(
        email_alerts_enabled=user.email_alerts_enabled,
        alert_min_status=user.alert_min_status
    )


# ─── Helper ───────────────────────────────────────────────────────────────────

def _set_auth_cookie(response: Response, token: str):
    """Set the JWT as a secure httpOnly cookie."""
    response.set_cookie(
        key=settings.COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,  # Set to True in production with HTTPS
        max_age=settings.JWT_EXPIRE_MINUTES * 60,
    )
