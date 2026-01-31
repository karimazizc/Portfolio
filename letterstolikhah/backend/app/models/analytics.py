"""
Analytics model for tracking page views and visitor information.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class Analytics(Base):
    """
    Analytics model for tracking visitor information.
    
    Attributes:
        id: Primary key
        post_id: Foreign key to the viewed post
        ip_address: Visitor's IP address (IPv4/IPv6)
        country: Visitor's country from geolocation
        city: Visitor's city from geolocation
        user_agent: Browser/device information
        timestamp: When the page was viewed
        session_id: Unique session identifier for deduplication
    """
    __tablename__ = "analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), index=True)
    ip_address = Column(String(45), nullable=True)  # Supports IPv6
    country = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    user_agent = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    session_id = Column(String(255), nullable=True)
    
    # Relationship to post
    post = relationship("Post", back_populates="analytics")
    
    def __repr__(self):
        return f"<Analytics(id={self.id}, post_id={self.post_id}, ip={self.ip_address})>"
