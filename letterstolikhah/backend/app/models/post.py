"""
Post model for blog posts/letters.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.orm import relationship

from app.core.database import Base


class Post(Base):
    """
    Post model representing blog posts/letters.
    
    Attributes:
        id: Primary key
        title: Post title (max 255 chars)
        content: Full post content (HTML/Markdown)
        excerpt: Short preview text
        published: Whether the post is publicly visible
        created_at: When the post was created
        updated_at: When the post was last modified
        view_count: Total number of views
    """
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    excerpt = Column(Text, nullable=True)
    published = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    view_count = Column(Integer, default=0)
    
    # Relationship to analytics
    analytics = relationship(
        "Analytics",
        back_populates="post",
        cascade="all, delete-orphan",
        lazy="dynamic"
    )
    
    def __repr__(self):
        return f"<Post(id={self.id}, title='{self.title}', published={self.published})>"
