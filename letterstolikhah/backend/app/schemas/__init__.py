# Schemas module
from app.schemas.post import PostCreate, PostUpdate, PostResponse, PostListResponse
from app.schemas.analytics import AnalyticsTrack, AnalyticsResponse, VisitorResponse, StatsResponse
from app.schemas.auth import Token, LoginRequest
from app.schemas.gallery import GalleryMediaCreate, GalleryMediaUpdate, GalleryMediaResponse, GalleryMediaListResponse
from app.schemas.music import MusicTrackCreate, MusicTrackUpdate, MusicTrackResponse, MusicTrackListResponse

__all__ = [
    "PostCreate", "PostUpdate", "PostResponse", "PostListResponse",
    "AnalyticsTrack", "AnalyticsResponse", "VisitorResponse", "StatsResponse",
    "Token", "LoginRequest",
    "GalleryMediaCreate", "GalleryMediaUpdate", "GalleryMediaResponse", "GalleryMediaListResponse",
    "MusicTrackCreate", "MusicTrackUpdate", "MusicTrackResponse", "MusicTrackListResponse"
]
