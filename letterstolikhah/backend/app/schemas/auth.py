"""
Pydantic schemas for authentication.
"""

from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    """Schema for login request."""
    password: str = Field(..., min_length=1, description="Admin password")


class Token(BaseModel):
    """Schema for JWT token response."""
    access_token: str
    token_type: str = "bearer"
