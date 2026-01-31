"""
Pydantic schemas for Analytics validation and serialization.
"""

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class AnalyticsTrack(BaseModel):
    """Schema for tracking a page view."""
    post_id: Optional[int] = Field(None, description="ID of the viewed post")
    session_id: Optional[str] = Field(None, description="Client session identifier")


class AnalyticsResponse(BaseModel):
    """Schema for analytics entry response."""
    id: int
    post_id: Optional[int]
    ip_address: Optional[str]
    country: Optional[str]
    city: Optional[str]
    user_agent: Optional[str]
    timestamp: datetime
    session_id: Optional[str]
    
    class Config:
        from_attributes = True


class VisitorResponse(BaseModel):
    """Schema for visitor details response."""
    id: int
    post_id: Optional[int]
    post_title: Optional[str]
    ip_address: Optional[str]
    country: Optional[str]
    city: Optional[str]
    user_agent: Optional[str]
    timestamp: datetime
    
    class Config:
        from_attributes = True


class PostStats(BaseModel):
    """Stats for a single post."""
    post_id: int
    title: str
    view_count: int
    unique_visitors: int


class GeoStats(BaseModel):
    """Geographic distribution stats."""
    country: str
    count: int


class DailyStats(BaseModel):
    """Daily view statistics."""
    date: str
    views: int


class StatsResponse(BaseModel):
    """Schema for overall analytics statistics."""
    total_views: int
    total_unique_visitors: int
    total_posts: int
    views_today: int
    views_this_week: int
    views_this_month: int
    posts_stats: List[PostStats]
    geo_stats: List[GeoStats]
    daily_stats: List[DailyStats]
