"""
Music routes for managing music tracks.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, update

from app.core.database import get_db
from app.models.music import MusicTrack
from app.schemas.music import (
    MusicTrackCreate,
    MusicTrackUpdate,
    MusicTrackResponse,
    MusicTrackListResponse,
)
from app.dependencies import get_current_admin


router = APIRouter()


@router.get("", response_model=MusicTrackListResponse)
async def get_music_tracks(
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
):
    """
    Get all music tracks.
    Public endpoint - anyone can view the music tracks.
    """
    # Get total count
    count_result = await db.execute(select(func.count(MusicTrack.id)))
    total = count_result.scalar()
    
    # Get tracks ordered by order_index
    result = await db.execute(
        select(MusicTrack)
        .order_by(MusicTrack.order_index.asc(), MusicTrack.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    tracks = result.scalars().all()
    
    return MusicTrackListResponse(tracks=tracks, total=total)


@router.get("/active", response_model=MusicTrackResponse)
async def get_active_track(
    db: AsyncSession = Depends(get_db),
):
    """Get the currently active (displayed) track."""
    result = await db.execute(
        select(MusicTrack).where(MusicTrack.is_active == True)
    )
    track = result.scalar_one_or_none()
    
    if not track:
        # Return the first track if no active track is set
        result = await db.execute(
            select(MusicTrack).order_by(MusicTrack.order_index.asc()).limit(1)
        )
        track = result.scalar_one_or_none()
    
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No music tracks available"
        )
    
    return track


@router.get("/{track_id}", response_model=MusicTrackResponse)
async def get_music_track_by_id(
    track_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a single music track by ID."""
    result = await db.execute(
        select(MusicTrack).where(MusicTrack.id == track_id)
    )
    track = result.scalar_one_or_none()
    
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )
    
    return track


@router.post("", response_model=MusicTrackResponse, status_code=status.HTTP_201_CREATED)
async def create_music_track(
    track_data: MusicTrackCreate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    """
    Create a new music track.
    Requires admin authentication.
    """
    # If this track is set as active, deactivate all others
    if track_data.is_active:
        await db.execute(
            update(MusicTrack).values(is_active=False)
        )
    
    track = MusicTrack(
        title=track_data.title,
        artist=track_data.artist,
        audio_url=track_data.audio_url,
        cover_url=track_data.cover_url,
        duration=track_data.duration,
        is_active=track_data.is_active,
        order_index=track_data.order_index,
    )
    
    db.add(track)
    await db.commit()
    await db.refresh(track)
    
    return track


@router.put("/{track_id}", response_model=MusicTrackResponse)
async def update_music_track(
    track_id: int,
    track_data: MusicTrackUpdate,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    """
    Update a music track.
    Requires admin authentication.
    """
    result = await db.execute(
        select(MusicTrack).where(MusicTrack.id == track_id)
    )
    track = result.scalar_one_or_none()
    
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )
    
    # If setting this track as active, deactivate all others
    if track_data.is_active:
        await db.execute(
            update(MusicTrack).where(MusicTrack.id != track_id).values(is_active=False)
        )
    
    # Update fields if provided
    update_data = track_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(track, field, value)
    
    await db.commit()
    await db.refresh(track)
    
    return track


@router.put("/{track_id}/activate", response_model=MusicTrackResponse)
async def set_active_track(
    track_id: int,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    """
    Set a track as the active (currently displayed) track.
    Requires admin authentication.
    """
    result = await db.execute(
        select(MusicTrack).where(MusicTrack.id == track_id)
    )
    track = result.scalar_one_or_none()
    
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )
    
    # Deactivate all tracks, then activate this one
    await db.execute(
        update(MusicTrack).values(is_active=False)
    )
    track.is_active = True
    
    await db.commit()
    await db.refresh(track)
    
    return track


@router.delete("/{track_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_music_track(
    track_id: int,
    db: AsyncSession = Depends(get_db),
    _: bool = Depends(get_current_admin),
):
    """
    Delete a music track.
    Requires admin authentication.
    """
    result = await db.execute(
        select(MusicTrack).where(MusicTrack.id == track_id)
    )
    track = result.scalar_one_or_none()
    
    if not track:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Track not found"
        )
    
    await db.delete(track)
    await db.commit()
    
    return None
