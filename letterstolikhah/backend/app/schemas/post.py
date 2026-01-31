"""
Pydantic schemas for Post validation and serialization.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class PostBase(BaseModel):
    """Base schema for post data."""
    title: str = Field(..., min_length=1, max_length=255, description="Post title")
    content: str = Field(..., min_length=1, description="Post content (HTML/Markdown)")
    excerpt: Optional[str] = Field(None, description="Short preview text")


class PostCreate(PostBase):
    """Schema for creating a new post."""
    published: bool = Field(default=False, description="Whether to publish immediately")


class PostUpdate(BaseModel):
    """Schema for updating an existing post."""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    excerpt: Optional[str] = None
    published: Optional[bool] = None


class PostResponse(PostBase):
    """Schema for post response."""
    id: int
    published: bool
    created_at: datetime
    updated_at: datetime
    view_count: int
    
    class Config:
        from_attributes = True


class PostListResponse(BaseModel):
    """Schema for paginated post list response."""
    posts: List[PostResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
