"""ETL Pipeline orchestrator — coordinates Extract -> Transform -> Load flow."""
import uuid
import json
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import pandas as pd
from sqlalchemy.orm import Session

from .extract import DataExtractor, extractor
from .transform import transform_books, transform_borrowers, transform_transactions
from .load import (
    load_books_from_df, load_borrowers_from_df, load_transactions_from_df,
    rebuild_all_analytics
)
from ..models.analytics import EtlJobLog

logger = logging.getLogger(__name__)


class ETLPipeline:
    def __init__(self, db: Session):
        self.db = db
        self._extractor = extractor

    def _create_job(self, job_type: str, source: str = "database") -> EtlJobLog:
        job = EtlJobLog(
            job_id=str(uuid.uuid4()),
            job_type=job_type,
            status="running",
            source=source,
            started_at=datetime.now(timezone.utc).replace(tzinfo=None),
        )
        self.db.add(job)
        self.db.commit()
        self.db.refresh(job)
        return job

    def _finish_job(self, job: EtlJobLog, stats: Dict, logs: List[str], error: str = None):
        now = datetime.utcnow()
        job.status = "failed" if error else "completed"
        job.records_extracted  = stats.get("extracted",  0)
        job.records_transformed = stats.get("transformed", 0)
        job.records_loaded     = stats.get("loaded",     0)
        job.records_skipped    = stats.get("skipped",    0)
        job.records_failed     = stats.get("failed",     0)
        job.error_message = error
        job.log_output = json.dumps(logs[-200:])
        job.completed_at = now
        try:
            started = job.started_at or now
            job.duration_seconds = round((now - started).total_seconds(), 2)
        except Exception:
            job.duration_seconds = 0.0
        self.db.commit()

    def run_csv_pipeline(
        self, file_bytes: bytes, filename: str, dataset_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """Run ETL for a single uploaded CSV file."""
        if not dataset_type:
            dataset_type = self._extractor.detect_file_type(filename)

        job = self._create_job(job_type=f"{dataset_type}_csv", source=filename)
        logs = [f"[START] CSV ETL — file: {filename}, type: {dataset_type}"]
        stats = {"extracted": 0, "transformed": 0, "loaded": 0, "skipped": 0, "failed": 0}

        try:
            # ── EXTRACT ──────────────────────────────────────────────────────
            df_raw = self._extractor.extract_csv(file_bytes, filename)
            stats["extracted"] = len(df_raw)
            logs.append(f"[EXTRACT] {stats['extracted']} rows from {filename}")

            # ── TRANSFORM ────────────────────────────────────────────────────
            if dataset_type == "books":
                df_clean, report = transform_books(df_raw)
            elif dataset_type == "borrowers":
                df_clean, report = transform_borrowers(df_raw)
            elif dataset_type == "transactions":
                df_clean, report = transform_transactions(df_raw)
            else:
                raise ValueError(
                    f"Unknown dataset type: '{dataset_type}'. "
                    "Expected: books, borrowers, or transactions"
                )

            stats["transformed"] = len(df_clean)
            stats["skipped"] = stats["extracted"] - stats["transformed"]
            logs.append(
                f"[TRANSFORM] {stats['transformed']} valid rows "
                f"(skipped {stats['skipped']})"
            )
            for issue in report.get("issues", []):
                logs.append(f"[WARN] {issue}")

            # ── LOAD ─────────────────────────────────────────────────────────
            if dataset_type == "books":
                loaded = load_books_from_df(self.db, df_clean)
            elif dataset_type == "borrowers":
                loaded = load_borrowers_from_df(self.db, df_clean)
            elif dataset_type == "transactions":
                loaded = load_transactions_from_df(self.db, df_clean)
            else:
                loaded = 0

            stats["loaded"] = loaded
            logs.append(f"[LOAD] {loaded} records inserted/updated")

            # ── REBUILD ANALYTICS ────────────────────────────────────────────
            logs.append("[ANALYTICS] Rebuilding analytics tables...")
            counts = rebuild_all_analytics(self.db)
            logs.append(f"[ANALYTICS] Done: {counts}")
            logs.append("[DONE] Pipeline completed successfully")
            self._finish_job(job, stats, logs)

        except Exception as e:
            logs.append(f"[ERROR] {str(e)}")
            logger.exception(f"ETL pipeline failed: {e}")
            self._finish_job(job, stats, logs, error=str(e))

        return {
            "job_id": job.job_id,
            "status": job.status,
            "dataset_type": dataset_type,
            "filename": filename,
            "records_extracted": stats["extracted"],
            "records_loaded": stats["loaded"],
            "records_skipped": stats["skipped"],
            "records_failed": stats["failed"],
            "duration_seconds": job.duration_seconds,
            "logs": logs,
        }

    def run_db_sync_pipeline(self) -> Dict[str, Any]:
        """Rebuild all analytics tables from the live database."""
        job = self._create_job(job_type="db_sync", source="database")
        logs = [f"[START] DB sync — job {job.job_id}"]
        stats = {"extracted": 0, "transformed": 0, "loaded": 0, "skipped": 0, "failed": 0}

        try:
            data = self._extractor.extract_all_from_db(self.db)
            stats["extracted"] = sum(len(df) for df in data.values())
            logs.append(
                f"[EXTRACT] books={len(data['books'])}, "
                f"borrowers={len(data['borrowers'])}, "
                f"transactions={len(data['transactions'])}"
            )

            from .transform import transform_all
            cleaned, report = transform_all(data)
            stats["transformed"] = sum(len(df) for df in cleaned.values())
            logs.append(f"[TRANSFORM] {stats['transformed']} records")

            logs.append("[ANALYTICS] Rebuilding all analytics tables...")
            counts = rebuild_all_analytics(self.db)
            stats["loaded"] = sum(counts.values())
            logs.append(f"[ANALYTICS] {counts}")
            logs.append("[DONE] DB sync completed successfully")
            self._finish_job(job, stats, logs)

        except Exception as e:
            logs.append(f"[ERROR] {str(e)}")
            logger.exception(f"DB sync failed: {e}")
            self._finish_job(job, stats, logs, error=str(e))

        return {
            "job_id": job.job_id,
            "status": job.status,
            "records_extracted": stats["extracted"],
            "records_loaded": stats["loaded"],
            "records_skipped": stats["skipped"],
            "records_failed": stats["failed"],
            "duration_seconds": job.duration_seconds,
            "logs": logs,
        }


def run_etl_pipeline(db: Session, source: str = "database") -> Dict[str, Any]:
    pipeline = ETLPipeline(db)
    return pipeline.run_db_sync_pipeline()
