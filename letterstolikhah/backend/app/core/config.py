"""
Application configuration using Pydantic Settings.
Loads configuration from environment variables.
"""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/blog_db"
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ADMIN_PASSWORD: str = "admin123"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Frontend URL for CORS
    FRONTEND_URL: str = "http://localhost:3000"
    
    # IP Geolocation API
    GEOIP_API_URL: str = "http://ip-api.com/json"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
