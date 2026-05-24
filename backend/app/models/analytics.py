"""Analytics and ETL tracking ORM models."""
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, Index, JSON
from sqlalchemy.sql import func
from ..database import Base


class AnalyticsPopularBooks(Base):
    """Pre-aggregated popular books summary — refreshed by ETL pipeline."""
    __tablename__ = "analytics_popular_books"

    id = Column(Integer, primary_key=True, autoincrement=True)
    book_id = Column(Integer, nullable=False, index=True)
    title = Column(String(255), nullable=False)
    author = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    isbn = Column(String(20), nullable=True)
    total_borrows = Column(Integer, default=0)
    total_returns = Column(Integer, default=0)
    active_borrows = Column(Integer, default=0)
    avg_borrow_days = Column(Float, default=0.0)
    rank = Column(Integer, default=0)
    last_borrowed_at = Column(DateTime(timezone=True), nullable=True)
    computed_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("idx_popular_books_rank", "rank"),
        Index("idx_popular_books_category", "category"),
    )


class AnalyticsMonthlyTrends(Base):
    """Monthly borrowing trend aggregates."""
    __tablename__ = "analytics_monthly_trends"

    id = Column(Integer, primary_key=True, autoincrement=True)
    year = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)          # 1-12
    month_label = Column(String(20), nullable=False) # "Jan 2025"
    total_borrows = Column(Integer, default=0)
    total_returns = Column(Integer, default=0)
    active_borrows = Column(Integer, default=0)
    overdue_count = Column(Integer, default=0)
    unique_borrowers = Column(Integer, default=0)
    unique_books = Column(Integer, default=0)
    computed_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("idx_monthly_trends_year_month", "year", "month", unique=True),
    )


class AnalyticsCategorySummary(Base):
    """Category-level borrowing distribution summary."""
    __tablename__ = "analytics_category_summary"

    id = Column(Integer, primary_key=True, autoincrement=True)
    category = Column(String(100), nullable=False, unique=True, index=True)
    total_books = Column(Integer, default=0)
    available_books = Column(Integer, default=0)
    borrowed_books = Column(Integer, default=0)
    total_borrows = Column(Integer, default=0)
    total_returns = Column(Integer, default=0)
    borrow_percentage = Column(Float, default=0.0)
    computed_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class AnalyticsOverdueSummary(Base):
    """Overdue transaction tracking and risk summary."""
    __tablename__ = "analytics_overdue_summary"

    id = Column(Integer, primary_key=True, autoincrement=True)
    transaction_id = Column(Integer, nullable=False, unique=True, index=True)
    book_id = Column(Integer, nullable=False, index=True)
    borrower_id = Column(Integer, nullable=False, index=True)
    book_title = Column(String(255), nullable=True)
    borrower_name = Column(String(255), nullable=True)
    borrower_email = Column(String(255), nullable=True)
    borrow_date = Column(DateTime(timezone=True), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    return_date = Column(DateTime(timezone=True), nullable=True)
    overdue_days = Column(Integer, default=0)
    is_returned = Column(Boolean, default=False)
    status = Column(String(20), default="overdue")  # overdue / returned_late / active_overdue
    computed_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("idx_overdue_status", "status"),
        Index("idx_overdue_borrower", "borrower_id"),
    )


class EtlJobLog(Base):
    """ETL pipeline job execution log."""
    __tablename__ = "etl_job_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    job_id = Column(String(36), unique=True, nullable=False, index=True)
    job_type = Column(String(50), nullable=False)   # "full", "books_csv", "borrowers_csv", "transactions_csv", "db_sync"
    status = Column(String(20), default="pending")  # pending / running / completed / failed
    source = Column(String(255), nullable=True)      # filename or "database"
    records_extracted = Column(Integer, default=0)
    records_transformed = Column(Integer, default=0)
    records_loaded = Column(Integer, default=0)
    records_skipped = Column(Integer, default=0)
    records_failed = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    log_output = Column(Text, nullable=True)         # JSON-serialized log lines
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    duration_seconds = Column(Float, nullable=True)

    __table_args__ = (
        Index("idx_etl_job_status", "status"),
        Index("idx_etl_job_type", "job_type"),
    )
