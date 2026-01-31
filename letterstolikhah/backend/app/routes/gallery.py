"""
Gallery routes for managing gallery media.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, func

from app.core.database import get_db
from app.models.gallery import GalleryMedia
from app.schemas.gallery import (
    GalleryMediaCreate,
    GalleryMediaUpdate,
    GalleryMediaResponse,
    GalleryMediaListResponse,
)
from app.dependencies import get_current_admin


router = APIRouter()


@router.get("", response_model=GalleryMediaListResponse)
async def get_gallery_media(
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
):
    """
    Get all gallery media items.
    Public endpoint - anyone can view the gallery.
    """
    # Get total count
    count_result = await db.execute(select(func.count(GalleryMedia.id)))
    total = count_result.scalar()
    
    # Get media items ordered by order_index, then by created_at (newest first)
    result = await db.execute(
        select(GalleryMedia)
        .order_by(GalleryMedia.order_index.asc(), GalleryMedia.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    media_items = result.scalars().all()
    
    return GalleryMediaListResponse(media=media_items, total=total)


@router.get("/{media_id}", response_model=GalleryMediaResponse)
async def get_gallery_media_by_id(
    media_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a single gallery media item by ID."""
    result = await db.execute(
        select(GalleryMedia).where(GalleryMedia.id == media_id)
    )
    media = result.scalar_one_or_none()
    
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found"
        )
    
    return media


@router.post("", response_model=GalleryMediaResponse, status_code=status.HTTP_201_CREATED)
async def create_gallery_media(
    media_data: GalleryMediaCreate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),  # Require admin authentication
):
    """
    Create a new gallery media item.
    Requires admin authentication.
    """
    media = GalleryMedia(
        media_type=media_data.media_type,
        url=media_data.url,
        thumbnail_url=media_data.thumbnail_url,
        caption=media_data.caption,
        order_index=media_data.order_index,
    )
    
    db.add(media)
    await db.commit()
    await db.refresh(media)
    
    return media


@router.put("/{media_id}", response_model=GalleryMediaResponse)
async def update_gallery_media(
    media_id: int,
    media_data: GalleryMediaUpdate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    """
    Update a gallery media item.
    Requires admin authentication.
    """
    result = await db.execute(
        select(GalleryMedia).where(GalleryMedia.id == media_id)
    )
    media = result.scalar_one_or_none()
    
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found"
        )
    
    # Update fields if provided
    update_data = media_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(media, field, value)
    
    await db.commit()
    await db.refresh(media)
    
    return media


@router.delete("/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_gallery_media(
    media_id: int,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    """
    Delete a gallery media item.
    Requires admin authentication.
    """
    result = await db.execute(
        select(GalleryMedia).where(GalleryMedia.id == media_id)
    )
    media = result.scalar_one_or_none()
    
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found"
        )
    
    await db.delete(media)
    await db.commit()
    
    return None


@router.post("/reorder", status_code=status.HTTP_200_OK)
async def reorder_gallery_media(
    order: list[dict],  # List of {id: int, order_index: int}
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    """
    Reorder gallery media items.
    Requires admin authentication.
    """
    for item in order:
        media_id = item.get("id")
        order_index = item.get("order_index")
        
        if media_id is not None and order_index is not None:
            result = await db.execute(
                select(GalleryMedia).where(GalleryMedia.id == media_id)
            )
            media = result.scalar_one_or_none()
            if media:
                media.order_index = order_index
    
    await db.commit()
    
    return {"message": "Gallery reordered successfully"}
