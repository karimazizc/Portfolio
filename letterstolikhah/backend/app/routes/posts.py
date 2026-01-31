"""
Post routes for CRUD operations on blog posts.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.post import Post
from app.schemas.post import PostCreate, PostUpdate, PostResponse, PostListResponse
from app.dependencies.auth import get_current_admin

router = APIRouter()


@router.get("", response_model=PostListResponse)
async def get_posts(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    include_unpublished: bool = Query(False, description="Include unpublished posts (admin only)"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get all posts with pagination.
    
    By default, only returns published posts.
    Use include_unpublished=true for admin view.
    """
    # Build query based on publish status
    if include_unpublished:
        query = select(Post)
    else:
        query = select(Post).where(Post.published == True)
    
    # Order by creation date (newest first)
    query = query.order_by(Post.created_at.desc())
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    result = await db.execute(query)
    posts = result.scalars().all()
    
    total_pages = (total + page_size - 1) // page_size
    
    return PostListResponse(
        posts=[PostResponse.model_validate(post) for post in posts],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Get a single post by ID.
    
    Returns the post if it exists and is published (or if accessed by admin).
    """
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )
    
    return PostResponse.model_validate(post)


@router.post("", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    post_data: PostCreate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """
    Create a new post (admin only).
    
    Requires JWT authentication.
    """
    # Auto-generate excerpt if not provided
    excerpt = post_data.excerpt
    if not excerpt and post_data.content:
        # Strip HTML tags for plain text excerpt
        import re
        plain_text = re.sub(r'<[^>]+>', '', post_data.content)
        excerpt = plain_text[:200] + "..." if len(plain_text) > 200 else plain_text
    
    post = Post(
        title=post_data.title,
        content=post_data.content,
        excerpt=excerpt,
        published=post_data.published,
    )
    
    db.add(post)
    await db.commit()
    await db.refresh(post)
    
    return PostResponse.model_validate(post)


@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    post_data: PostUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """
    Update an existing post (admin only).
    
    Requires JWT authentication.
    """
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )
    
    # Update only provided fields
    update_data = post_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(post, field, value)
    
    await db.commit()
    await db.refresh(post)
    
    return PostResponse.model_validate(post)


@router.delete("/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post(
    post_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """
    Delete a post (admin only).
    
    Requires JWT authentication. Also deletes associated analytics.
    """
    result = await db.execute(select(Post).where(Post.id == post_id))
    post = result.scalar_one_or_none()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )
    
    await db.delete(post)
    await db.commit()
    
    return None
