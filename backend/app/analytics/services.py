"""Analytics service layer — business logic on top of queries."""
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
from .queries import (
    get_popular_books, get_monthly_trends,
    get_category_trends, get_overdue_analysis,
    get_dashboard_summary,
)
from ..models.analytics import EtlJobLog
import logging

logger = logging.getLogger(__name__)


class AnalyticsService:
    def popular_books(self, db: Session, limit: int = 10, category: Optional[str] = None) -> List:
        return get_popular_books(db, limit=limit, category=category)

    def monthly_trends(self, db: Session, limit: int = 24) -> List:
        return get_monthly_trends(db, limit=limit)

    def category_trends(self, db: Session) -> List:
        return get_category_trends(db)

    def overdue_analysis(self, db: Session, limit: int = 50) -> Dict:
        return get_overdue_analysis(db, limit=limit)

    def dashboard_summary(self, db: Session) -> Dict:
        return get_dashboard_summary(db)

    def etl_logs(self, db: Session, limit: int = 20) -> List:
        jobs = (
            db.query(EtlJobLog)
            .order_by(EtlJobLog.started_at.desc())
            .limit(limit)
            .all()
        )
        items = []
        for j in jobs:
            items.append({
                "job_id": j.job_id,
                "job_type": j.job_type,
                "status": j.status,
                "source": j.source,
                "records_extracted": j.records_extracted,
                "records_transformed": j.records_transformed,
                "records_loaded": j.records_loaded,
                "records_skipped": j.records_skipped,
                "records_failed": j.records_failed,
                "error_message": j.error_message,
                "duration_seconds": j.duration_seconds,
                "started_at": j.started_at.isoformat() if j.started_at else None,
                "completed_at": j.completed_at.isoformat() if j.completed_at else None,
            })
        return items

    def etl_job_status(self, db: Session, job_id: str) -> Optional[Dict]:
        job = db.query(EtlJobLog).filter(EtlJobLog.job_id == job_id).first()
        if not job:
            return None
        return {
            "job_id": job.job_id, "status": job.status,
            "job_type": job.job_type, "source": job.source,
            "records_extracted": job.records_extracted,
            "records_transformed": job.records_transformed,
            "records_loaded": job.records_loaded,
            "records_skipped": job.records_skipped,
            "error_message": job.error_message,
            "duration_seconds": job.duration_seconds,
            "started_at": job.started_at.isoformat() if job.started_at else None,
            "completed_at": job.completed_at.isoformat() if job.completed_at else None,
        }


analytics_service = AnalyticsService()
