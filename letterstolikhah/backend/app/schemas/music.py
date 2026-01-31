"""
Music schemas for request/response validation.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class MusicTrackBase(BaseModel):
    """Base schema for music tracks."""
    title: str = Field(..., max_length=255, description="Track title")
    artist: Optional[str] = Field(None, max_length=255, description="Artist name")
    audio_url: str = Field(..., description="Base64 data or URL of audio file")
    cover_url: Optional[str] = Field(None, description="Album cover image")
    duration: Optional[int] = Field(None, description="Duration in seconds")
    is_active: bool = Field(False, description="Currently displayed track")
    order_index: int = Field(0, description="Order in playlist")


class MusicTrackCreate(MusicTrackBase):
    """Schema for creating a music track."""
    pass


class MusicTrackUpdate(BaseModel):
    """Schema for updating a music track."""
    title: Optional[str] = None
    artist: Optional[str] = None
    audio_url: Optional[str] = None
    cover_url: Optional[str] = None
    duration: Optional[int] = None
    is_active: Optional[bool] = None
    order_index: Optional[int] = None


class MusicTrackResponse(MusicTrackBase):
    """Schema for music track response."""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class MusicTrackListResponse(BaseModel):
    """Schema for music track list response."""
    tracks: List[MusicTrackResponse]
    total: int
