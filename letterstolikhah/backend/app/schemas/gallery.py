"""
Gallery schemas for request/response validation.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class GalleryMediaBase(BaseModel):
    """Base schema for gallery media."""
    media_type: str = Field(..., description="Type of media: 'image' or 'video'")
    url: str = Field(..., description="Base64 data or URL of the media")
    thumbnail_url: Optional[str] = Field(None, description="Thumbnail for videos")
    caption: Optional[str] = Field(None, max_length=255, description="Optional caption")
    order_index: int = Field(0, description="Order in gallery")


class GalleryMediaCreate(GalleryMediaBase):
    """Schema for creating gallery media."""
    pass


class GalleryMediaUpdate(BaseModel):
    """Schema for updating gallery media."""
    media_type: Optional[str] = None
    url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    order_index: Optional[int] = None


class GalleryMediaResponse(GalleryMediaBase):
    """Schema for gallery media response."""
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class GalleryMediaListResponse(BaseModel):
    """Schema for gallery media list response."""
    media: List[GalleryMediaResponse]
    total: int
