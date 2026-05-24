"""ETL management API routes."""
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.orm import Session

from ..database import get_db
from ..etl.pipeline import ETLPipeline, run_etl_pipeline
from ..analytics.services import analytics_service

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/etl", tags=["ETL Pipeline"])


@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    dataset_type: Optional[str] = Query(None, description="books | borrowers | transactions"),
    db: Session = Depends(get_db),
):
    """Upload a CSV dataset and immediately run ETL pipeline on it."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    max_size = 50 * 1024 * 1024  # 50 MB
    file_bytes = await file.read()
    if len(file_bytes) > max_size:
        raise HTTPException(status_code=413, detail="File too large (max 50 MB)")

    pipeline = ETLPipeline(db)
    result = pipeline.run_csv_pipeline(
        file_bytes=file_bytes,
        filename=file.filename,
        dataset_type=dataset_type,
    )
    return result


@router.post("/run")
async def run_etl(db: Session = Depends(get_db)):
    """Run full ETL pipeline — syncs from the live database into analytics tables."""
    pipeline = ETLPipeline(db)
    result = pipeline.run_db_sync_pipeline()
    return result


@router.get("/status/{job_id}")
async def get_job_status(job_id: str, db: Session = Depends(get_db)):
    """Get status of a specific ETL job by ID."""
    status = analytics_service.etl_job_status(db, job_id)
    if not status:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    return status


@router.get("/logs")
async def get_etl_logs(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Get recent ETL job logs (returns a plain list)."""
    return analytics_service.etl_logs(db, limit=limit)
