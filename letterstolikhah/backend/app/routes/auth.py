"""
Authentication routes for admin login.
"""

from fastapi import APIRouter, HTTPException, status

from app.core.config import settings
from app.core.security import create_access_token
from app.schemas.auth import LoginRequest, Token

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(request: LoginRequest):
    """
    Admin login endpoint.
    
    Validates the provided password against the configured admin password
    and returns a JWT token if valid.
    
    Args:
        request: Login request containing the password
        
    Returns:
        JWT access token
        
    Raises:
        HTTPException: 401 if password is incorrect
    """
    if request.password != settings.ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token with admin claim
    access_token = create_access_token(data={"sub": "admin", "role": "admin"})
    
    return Token(access_token=access_token)


@router.post("/verify", response_model=dict)
async def verify_token(request: LoginRequest):
    """
    Verify if the current token/session is valid.
    This is a simple endpoint to check authentication status.
    """
    # For simplicity, just check the password again
    if request.password != settings.ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    
    return {"valid": True}
