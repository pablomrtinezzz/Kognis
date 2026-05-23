from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.core.config import settings
from src.core.database import db

_DEV_BYPASS_TOKEN = "dev-bypass-token"
_DEV_USER_ID = "dev-user-00000000-0000-0000-0000-000000000001"

# Intercepts the Authorization header automatically in Swagger and requests
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """
    Validates the JWT token using Supabase Auth.
    Returns the user ID (UUID as string) if valid, otherwise raises 401 Unauthorized.
    """
    token = credentials.credentials

    # Dev bypass: skip Supabase validation when explicitly enabled in .env
    if settings.BYPASS_AUTH and token == _DEV_BYPASS_TOKEN:
        return _DEV_USER_ID

    try:
        # Supabase validates the cryptographic signature of the JWT
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
