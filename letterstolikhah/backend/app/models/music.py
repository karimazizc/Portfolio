"""
Music model for storing music tracks.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean

from app.core.database import Base


class MusicTrack(Base):
    """
    MusicTrack model representing music tracks for the vinyl player.
    
    Attributes:
        id: Primary key
        title: Track title
        artist: Artist name
        audio_url: URL or base64 data of the audio file
        cover_url: Album/cover art URL or base64 data
        duration: Duration in seconds
        is_active: Whether this track is the currently displayed track
        order_index: For ordering tracks
        created_at: When the track was added
    """
    __tablename__ = "music_tracks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    artist = Column(String(255), nullable=True)
    audio_url = Column(Text, nullable=False)  # Base64 data or URL
    cover_url = Column(Text, nullable=True)  # Album cover image
    duration = Column(Integer, nullable=True)  # Duration in seconds
    is_active = Column(Boolean, default=False)  # Currently playing track
    order_index = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<MusicTrack(id={self.id}, title='{self.title}')>"
