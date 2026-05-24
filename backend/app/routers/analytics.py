"""Analytics reporting API routes."""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
import io
from sqlalchemy.orm import Session

from ..database import get_db
from ..analytics.services import analytics_service
from ..analytics.reports import (
    generate_popular_books_csv, generate_monthly_trends_csv,
    generate_overdue_csv, generate_category_csv,
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/popular-books")
async def popular_books(
    limit: int = Query(10, ge=1, le=50),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """Get most borrowed books ranked by borrow count."""
    return analytics_service.popular_books(db, limit=limit, category=category)


@router.get("/monthly-trends")
async def monthly_trends(
    limit: int = Query(24, ge=1, le=60),
    db: Session = Depends(get_db),
):
    """Get monthly borrowing trends."""
    return analytics_service.monthly_trends(db, limit=limit)


@router.get("/category-trends")
async def category_trends(db: Session = Depends(get_db)):
    """Get category-level borrowing distribution."""
    return analytics_service.category_trends(db)


@router.get("/overdue-analysis")
async def overdue_analysis(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Get overdue transaction analysis and statistics."""
    return analytics_service.overdue_analysis(db, limit=limit)


@router.get("/dashboard-summary")
async def dashboard_summary(db: Session = Depends(get_db)):
    """Get aggregated KPIs for the analytics dashboard."""
    return analytics_service.dashboard_summary(db)


# ── Export endpoints ──────────────────────────────────────────────────────────

@router.get("/export/popular-books")
async def export_popular_books_csv(db: Session = Depends(get_db)):
    data = generate_popular_books_csv(db)
    return StreamingResponse(
        io.BytesIO(data),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=popular_books.csv"},
    )


@router.get("/export/monthly-trends")
async def export_monthly_trends_csv(db: Session = Depends(get_db)):
    data = generate_monthly_trends_csv(db)
    return StreamingResponse(
        io.BytesIO(data),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=monthly_trends.csv"},
    )


@router.get("/export/overdue")
async def export_overdue_csv(db: Session = Depends(get_db)):
    data = generate_overdue_csv(db)
    return StreamingResponse(
        io.BytesIO(data),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=overdue_analysis.csv"},
    )


@router.get("/export/categories")
async def export_categories_csv(db: Session = Depends(get_db)):
    data = generate_category_csv(db)
    return StreamingResponse(
        io.BytesIO(data),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=category_trends.csv"},
    )
