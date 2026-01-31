"""
Analytics routes for tracking and reporting.
"""

from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request, BackgroundTasks
from sqlalchemy import select, func, distinct
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.core.database import get_db
from app.core.config import settings
from app.models.post import Post
from app.models.analytics import Analytics
from app.schemas.analytics import (
    AnalyticsTrack,
    VisitorResponse,
    StatsResponse,
    PostStats,
    GeoStats,
    DailyStats,
)
from app.dependencies.auth import get_current_admin

router = APIRouter()


async def get_geolocation(ip_address: str) -> dict:
    """
    Get geolocation data for an IP address using ip-api.com.
    
    Args:
        ip_address: IP address to look up
        
    Returns:
        Dictionary with country and city, or empty values on failure
    """
    # Skip for localhost/private IPs
    if ip_address in ["127.0.0.1", "localhost", "::1"] or ip_address.startswith("192.168.") or ip_address.startswith("10."):
        return {"country": "Local", "city": "Development"}
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{settings.GEOIP_API_URL}/{ip_address}")
            if response.status_code == 200:
                data = response.json()
                if data.get("status") == "success":
                    return {
                        "country": data.get("country", "Unknown"),
                        "city": data.get("city", "Unknown"),
                    }
    except Exception:
        pass
    
    return {"country": "Unknown", "city": "Unknown"}


async def track_view_background(
    post_id: Optional[int],
    ip_address: str,
    user_agent: str,
    session_id: Optional[str],
    db: AsyncSession,
):
    """
    Background task to track a page view.
    
    Performs geolocation lookup and stores analytics data.
    """
    # Get geolocation
    geo_data = await get_geolocation(ip_address)
    
    # Check for duplicate view (same IP + session within 24 hours)
    if session_id:
        yesterday = datetime.utcnow() - timedelta(hours=24)
        existing_query = select(Analytics).where(
            Analytics.post_id == post_id,
            Analytics.ip_address == ip_address,
            Analytics.session_id == session_id,
            Analytics.timestamp > yesterday,
        )
        result = await db.execute(existing_query)
        if result.scalar_one_or_none():
            return  # Skip duplicate
    
    # Create analytics entry
    analytics = Analytics(
        post_id=post_id,
        ip_address=ip_address,
        country=geo_data["country"],
        city=geo_data["city"],
        user_agent=user_agent,
        session_id=session_id,
    )
    
    db.add(analytics)
    
    # Increment view count on post
    if post_id:
        post_result = await db.execute(select(Post).where(Post.id == post_id))
        post = post_result.scalar_one_or_none()
        if post:
            post.view_count = (post.view_count or 0) + 1
    
    await db.commit()


@router.post("/track", status_code=status.HTTP_202_ACCEPTED)
async def track_view(
    data: AnalyticsTrack,
    request: Request,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    """
    Track a page view.
    
    Extracts IP and user agent from request, performs geolocation
    in background to avoid slowing down response.
    """
    # Extract IP from headers (handle proxies)
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        ip_address = forwarded_for.split(",")[0].strip()
    else:
        ip_address = request.client.host if request.client else "Unknown"
    
    user_agent = request.headers.get("User-Agent", "Unknown")
    
    # Run tracking in background
    background_tasks.add_task(
        track_view_background,
        data.post_id,
        ip_address,
        user_agent,
        data.session_id,
        db,
    )
    
    return {"status": "accepted"}


@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """
    Get analytics statistics (admin only).
    
    Returns aggregated stats including total views, geographic distribution,
    and daily view counts.
    """
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)
    
    # Total views
    total_views_result = await db.execute(select(func.count(Analytics.id)))
    total_views = total_views_result.scalar() or 0
    
    # Unique visitors (by IP)
    unique_visitors_result = await db.execute(
        select(func.count(distinct(Analytics.ip_address)))
    )
    total_unique_visitors = unique_visitors_result.scalar() or 0
    
    # Total posts
    total_posts_result = await db.execute(select(func.count(Post.id)))
    total_posts = total_posts_result.scalar() or 0
    
    # Views today
    views_today_result = await db.execute(
        select(func.count(Analytics.id)).where(Analytics.timestamp >= today_start)
    )
    views_today = views_today_result.scalar() or 0
    
    # Views this week
    views_week_result = await db.execute(
        select(func.count(Analytics.id)).where(Analytics.timestamp >= week_start)
    )
    views_this_week = views_week_result.scalar() or 0
    
    # Views this month
    views_month_result = await db.execute(
        select(func.count(Analytics.id)).where(Analytics.timestamp >= month_start)
    )
    views_this_month = views_month_result.scalar() or 0
    
    # Per-post stats
    posts_stats_query = (
        select(
            Post.id,
            Post.title,
            Post.view_count,
            func.count(distinct(Analytics.ip_address)).label("unique_visitors")
        )
        .outerjoin(Analytics, Post.id == Analytics.post_id)
        .group_by(Post.id)
        .order_by(Post.view_count.desc())
    )
    posts_stats_result = await db.execute(posts_stats_query)
    posts_stats = [
        PostStats(
            post_id=row.id,
            title=row.title,
            view_count=row.view_count or 0,
            unique_visitors=row.unique_visitors or 0,
        )
        for row in posts_stats_result.all()
    ]
    
    # Geographic distribution
    geo_query = (
        select(Analytics.country, func.count(Analytics.id).label("count"))
        .where(Analytics.country.isnot(None))
        .group_by(Analytics.country)
        .order_by(func.count(Analytics.id).desc())
        .limit(10)
    )
    geo_result = await db.execute(geo_query)
    geo_stats = [
        GeoStats(country=row.country, count=row.count)
        for row in geo_result.all()
    ]
    
    # Daily stats for last 30 days
    daily_query = (
        select(
            func.date(Analytics.timestamp).label("date"),
            func.count(Analytics.id).label("views")
        )
        .where(Analytics.timestamp >= month_start)
        .group_by(func.date(Analytics.timestamp))
        .order_by(func.date(Analytics.timestamp))
    )
    daily_result = await db.execute(daily_query)
    daily_stats = [
        DailyStats(date=str(row.date), views=row.views)
        for row in daily_result.all()
    ]
    
    return StatsResponse(
        total_views=total_views,
        total_unique_visitors=total_unique_visitors,
        total_posts=total_posts,
        views_today=views_today,
        views_this_week=views_this_week,
        views_this_month=views_this_month,
        posts_stats=posts_stats,
        geo_stats=geo_stats,
        daily_stats=daily_stats,
    )


@router.get("/visitors", response_model=list[VisitorResponse])
async def get_visitors(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _admin: dict = Depends(get_current_admin),
):
    """
    Get visitor details with pagination (admin only).
    
    Returns detailed visitor information including geolocation and browser info.
    """
    offset = (page - 1) * page_size
    
    query = (
        select(Analytics, Post.title)
        .outerjoin(Post, Analytics.post_id == Post.id)
        .order_by(Analytics.timestamp.desc())
        .offset(offset)
        .limit(page_size)
    )
    
    result = await db.execute(query)
    visitors = []
    
    for row in result.all():
        analytics, post_title = row
        visitors.append(
            VisitorResponse(
                id=analytics.id,
                post_id=analytics.post_id,
                post_title=post_title,
                ip_address=analytics.ip_address,
                country=analytics.country,
                city=analytics.city,
                user_agent=analytics.user_agent,
                timestamp=analytics.timestamp,
            )
        )
    
    return visitors
