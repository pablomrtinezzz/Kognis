from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.core.config import settings
from src.core.database import db

_DEV_USER_ID = "00000000-0000-0000-0000-000000000001"

security = HTTPBearer()


def _is_valid_dev_bypass(token: str) -> bool:
    """
    Returns True only when ALL three conditions hold simultaneously:
    1. BYPASS_AUTH is explicitly enabled in .env
    2. ENVIRONMENT is strictly "development" (never staging or production)
    3. The token matches DEV_BYPASS_TOKEN read from the environment (no hardcoded secret)
    """
    if not settings.BYPASS_AUTH:
        return False
    if settings.ENVIRONMENT != "development":
        return False
    dev_token = settings.DEV_BYPASS_TOKEN
    # Reject bypass if the env var is missing or empty
    if not dev_token:
        return False
    return token == dev_token


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """
    Validates the JWT token via Supabase Auth.
    Returns the user ID (UUID string) on success, raises 401 otherwise.
    """
    token = credentials.credentials

    if _is_valid_dev_bypass(token):
        return _DEV_USER_ID

    try:
        user_response = db.auth.get_user(token)
        if not user_response or not user_response.user:
            raise ValueError("Invalid user response from Supabase")
        return user_response.user.id
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
