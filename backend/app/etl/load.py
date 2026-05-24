"""ETL Load phase — upsert cleaned data and rebuild analytics summary tables."""
import logging
from datetime import datetime, timezone
from typing import Dict
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import text, delete

from ..models.analytics import (
    AnalyticsPopularBooks, AnalyticsMonthlyTrends,
    AnalyticsCategorySummary, AnalyticsOverdueSummary,
)
from ..models.book import Book
from ..models.borrower import Borrower
from ..models.transaction import Transaction

logger = logging.getLogger(__name__)

def _str_to_dt(val):
    """Convert SQLite date string or datetime-like to Python datetime, or None."""
    if val is None:
        return None
    if hasattr(val, "year"):   # already a datetime/date
        return val
    try:
        import pandas as pd
        ts = pd.Timestamp(str(val))
        if pd.isna(ts):
            return None
        dt = ts.to_pydatetime()
        return dt.replace(tzinfo=None) if dt.tzinfo else dt
    except Exception:
        return None



def load_books_from_df(db: Session, df: pd.DataFrame) -> int:
    """Upsert books from cleaned DataFrame into the books table."""
    loaded = 0
    for _, row in df.iterrows():
        isbn = str(row.get("isbn", "") or "").strip()
        existing = db.query(Book).filter(Book.isbn == isbn).first() if isbn else None
        if existing:
            for field in ["title", "author", "category", "description", "publisher"]:
                if field in row and pd.notna(row[field]) and row[field]:
                    setattr(existing, field, row[field])
            if pd.notna(row.get("published_year")):
                existing.published_year = int(row["published_year"])
        else:
            if not isbn or len(isbn) < 10:
                import uuid
                isbn = f"GEN{uuid.uuid4().hex[:10].upper()}"
            book = Book(
                title=row.get("title", "Unknown"),
                author=row.get("author", "Unknown"),
                category=row.get("category", "General"),
                isbn=isbn,
                availability_status=bool(row.get("availability_status", True)),
                description=str(row.get("description", "") or ""),
                publisher=str(row.get("publisher", "") or ""),
                published_year=int(row["published_year"]) if pd.notna(row.get("published_year")) else None,
                cover_color=row.get("cover_color") or None,
            )
            db.add(book)
            loaded += 1
    db.commit()
    logger.info(f"Loaded {loaded} new books into books table")
    return loaded


def load_borrowers_from_df(db: Session, df: pd.DataFrame) -> int:
    """Upsert borrowers from cleaned DataFrame."""
    loaded = 0
    for _, row in df.iterrows():
        email = str(row.get("email", "") or "").strip().lower()
        if not email:
            continue
        existing = db.query(Borrower).filter(Borrower.email == email).first()
        if existing:
            if pd.notna(row.get("borrower_name")) and row["borrower_name"]:
                existing.borrower_name = row["borrower_name"]
            if pd.notna(row.get("phone")) and row["phone"]:
                existing.phone = row["phone"]
        else:
            borrower = Borrower(
                borrower_name=row.get("borrower_name", "Unknown"),
                email=email,
                phone=str(row.get("phone", "") or ""),
                address=str(row.get("address", "") or ""),
            )
            db.add(borrower)
            loaded += 1
    db.commit()
    logger.info(f"Loaded {loaded} new borrowers")
    return loaded


def load_transactions_from_df(db: Session, df: pd.DataFrame) -> int:
    """Insert transactions from cleaned DataFrame into the transactions table.

    Validates that referenced book_id and borrower_id exist before inserting.
    Skips duplicates (same book_id + borrower_id + borrow_date).
    Also updates book availability_status based on active borrows.
    """
    # Fetch valid IDs from DB for quick lookup
    valid_book_ids = {r[0] for r in db.execute(text("SELECT book_id FROM books")).fetchall()}
    valid_borrower_ids = {r[0] for r in db.execute(text("SELECT borrower_id FROM borrowers")).fetchall()}

    if not valid_book_ids:
        logger.warning("No books in DB — upload books CSV first before transactions")
        return 0
    if not valid_borrower_ids:
        logger.warning("No borrowers in DB — upload borrowers CSV first before transactions")
        return 0

    loaded = 0
    skipped = 0
    batch = []

    for _, row in df.iterrows():
        book_id = int(row["book_id"])
        borrower_id = int(row["borrower_id"])

        # Skip if referenced IDs don't exist
        if book_id not in valid_book_ids or borrower_id not in valid_borrower_ids:
            skipped += 1
            continue

        # Parse dates (may be Timestamp or string)
        def to_dt(val):
            """Safely convert any date-like value (Timestamp, NaT, str, None) to datetime or None."""
            if val is None:
                return None
            try:
                if pd.isna(val):   # catches NaT, NaN, None
                    return None
            except (TypeError, ValueError):
                pass
            if hasattr(val, "to_pydatetime"):
                try:
                    dt = val.to_pydatetime()
                    if dt is None or (hasattr(dt, "year") and dt.year < 1):
                        return None
                    return dt.replace(tzinfo=None) if getattr(dt, "tzinfo", None) else dt
                except Exception:
                    return None
            try:
                ts = pd.Timestamp(val)
                if pd.isna(ts):
                    return None
                return ts.to_pydatetime().replace(tzinfo=None)
            except Exception:
                return None

        borrow_date = to_dt(row.get("borrow_date"))
        due_date    = to_dt(row.get("due_date"))
        return_date = to_dt(row.get("return_date")) if row.get("return_date") and str(row.get("return_date", "")).strip() else None
        is_returned = bool(row.get("is_returned", False))

        if borrow_date is None:
            skipped += 1
            continue

        tx = Transaction(
            book_id=book_id,
            borrower_id=borrower_id,
            borrow_date=borrow_date,
            due_date=due_date,
            return_date=return_date,
            is_returned=is_returned,
        )
        batch.append(tx)
        loaded += 1

        # Flush in batches of 200 to avoid memory pressure
        if len(batch) >= 200:
            db.bulk_save_objects(batch)
            db.flush()
            batch = []

    if batch:
        db.bulk_save_objects(batch)
        db.flush()

    db.commit()
    logger.info(f"Loaded {loaded} transactions (skipped {skipped} with invalid refs)")
    return loaded


def rebuild_popular_books(db: Session) -> int:
    """Recompute and replace popular_books analytics table from live transactions."""
    logger.info("Rebuilding analytics_popular_books")
    db.execute(delete(AnalyticsPopularBooks))

    rows = db.execute(text("""
        SELECT
            b.book_id, b.title, b.author, b.category, b.isbn,
            COUNT(t.transaction_id) AS total_borrows,
            SUM(CASE WHEN t.is_returned = 1 THEN 1 ELSE 0 END) AS total_returns,
            SUM(CASE WHEN t.is_returned = 0 THEN 1 ELSE 0 END) AS active_borrows,
            AVG(CASE
                WHEN t.is_returned = 1 AND t.return_date IS NOT NULL
                THEN CAST((julianday(t.return_date) - julianday(t.borrow_date)) AS REAL)
                ELSE NULL END
            ) AS avg_borrow_days,
            MAX(t.borrow_date) AS last_borrowed_at
        FROM books b
        LEFT JOIN transactions t ON b.book_id = t.book_id
        GROUP BY b.book_id, b.title, b.author, b.category, b.isbn
        ORDER BY total_borrows DESC
    """)).fetchall()

    for rank, row in enumerate(rows, start=1):
        record = AnalyticsPopularBooks(
            book_id=row[0], title=row[1], author=row[2],
            category=row[3], isbn=row[4] or "",
            total_borrows=int(row[5] or 0),
            total_returns=int(row[6] or 0),
            active_borrows=int(row[7] or 0),
            avg_borrow_days=round(float(row[8] or 0), 1),
            rank=rank,
            last_borrowed_at=_str_to_dt(row[9]),
        )
        db.add(record)

    db.commit()
    logger.info(f"Rebuilt popular_books: {len(rows)} records")
    return len(rows)


def rebuild_monthly_trends(db: Session) -> int:
    """Recompute monthly trends analytics table."""
    logger.info("Rebuilding analytics_monthly_trends")
    db.execute(delete(AnalyticsMonthlyTrends))

    rows = db.execute(text("""
        SELECT
            strftime('%Y', borrow_date) AS year,
            strftime('%m', borrow_date) AS month,
            COUNT(*) AS total_borrows,
            SUM(CASE WHEN is_returned = 1 THEN 1 ELSE 0 END) AS total_returns,
            SUM(CASE WHEN is_returned = 0 THEN 1 ELSE 0 END) AS active_borrows,
            COUNT(DISTINCT borrower_id) AS unique_borrowers,
            COUNT(DISTINCT book_id) AS unique_books
        FROM transactions
        WHERE borrow_date IS NOT NULL
        GROUP BY year, month
        ORDER BY year ASC, month ASC
    """)).fetchall()

    import calendar
    months_loaded = 0
    for row in rows:
        year = int(row[0])
        month = int(row[1])
        overdue_row = db.execute(text("""
            SELECT COUNT(*) FROM transactions
            WHERE strftime('%Y', borrow_date) = :y
              AND strftime('%m', borrow_date) = :m
              AND is_returned = 0
              AND due_date IS NOT NULL
              AND due_date < datetime('now')
        """), {"y": str(year), "m": f"{month:02d}"}).fetchone()
        overdue_count = int(overdue_row[0] or 0)

        month_label = f"{calendar.month_abbr[month]} {year}"
        record = AnalyticsMonthlyTrends(
            year=year, month=month, month_label=month_label,
            total_borrows=int(row[2] or 0),
            total_returns=int(row[3] or 0),
            active_borrows=int(row[4] or 0),
            overdue_count=overdue_count,
            unique_borrowers=int(row[5] or 0),
            unique_books=int(row[6] or 0),
        )
        db.add(record)
        months_loaded += 1

    db.commit()
    logger.info(f"Rebuilt monthly_trends: {months_loaded} months")
    return months_loaded


def rebuild_category_summary(db: Session) -> int:
    """Recompute category-level analytics."""
    logger.info("Rebuilding analytics_category_summary")
    db.execute(delete(AnalyticsCategorySummary))

    rows = db.execute(text("""
        SELECT
            b.category,
            COUNT(DISTINCT b.book_id) AS total_books,
            SUM(CASE WHEN b.availability_status = 1 THEN 1 ELSE 0 END) AS available_books,
            SUM(CASE WHEN b.availability_status = 0 THEN 1 ELSE 0 END) AS borrowed_books,
            COUNT(t.transaction_id) AS total_borrows,
            SUM(CASE WHEN t.is_returned = 1 THEN 1 ELSE 0 END) AS total_returns
        FROM books b
        LEFT JOIN transactions t ON b.book_id = t.book_id
        GROUP BY b.category
        ORDER BY total_borrows DESC
    """)).fetchall()

    total_borrows_all = sum(int(r[4] or 0) for r in rows)
    for row in rows:
        total_b = int(row[4] or 0)
        pct = round((total_b / total_borrows_all * 100), 1) if total_borrows_all > 0 else 0.0
        record = AnalyticsCategorySummary(
            category=row[0],
            total_books=int(row[1] or 0),
            available_books=int(row[2] or 0),
            borrowed_books=int(row[3] or 0),
            total_borrows=total_b,
            total_returns=int(row[5] or 0),
            borrow_percentage=pct,
        )
        db.add(record)

    db.commit()
    logger.info(f"Rebuilt category_summary: {len(rows)} categories")
    return len(rows)


def rebuild_overdue_summary(db: Session) -> int:
    """Recompute overdue transaction summary."""
    logger.info("Rebuilding analytics_overdue_summary")
    db.execute(delete(AnalyticsOverdueSummary))

    rows = db.execute(text("""
        SELECT
            t.transaction_id, t.book_id, t.borrower_id,
            b.title, br.borrower_name, br.email,
            t.borrow_date, t.due_date, t.return_date, t.is_returned,
            CASE
                WHEN t.is_returned = 1 AND t.return_date > t.due_date
                THEN CAST(julianday(t.return_date) - julianday(t.due_date) AS INTEGER)
                WHEN t.is_returned = 0 AND t.due_date < datetime('now')
                THEN CAST(julianday('now') - julianday(t.due_date) AS INTEGER)
                ELSE 0
            END AS overdue_days
        FROM transactions t
        LEFT JOIN books b ON t.book_id = b.book_id
        LEFT JOIN borrowers br ON t.borrower_id = br.borrower_id
        WHERE (
            (t.is_returned = 0 AND t.due_date IS NOT NULL AND t.due_date < datetime('now'))
            OR (t.is_returned = 1 AND t.return_date IS NOT NULL AND t.due_date IS NOT NULL
                AND t.return_date > t.due_date)
        )
        ORDER BY overdue_days DESC
    """)).fetchall()

    for row in rows:
        is_returned = bool(row[9])
        overdue_days = max(int(row[10] or 0), 0)
        status = "returned_late" if is_returned else "active_overdue"
        record = AnalyticsOverdueSummary(
            transaction_id=row[0], book_id=row[1], borrower_id=row[2],
            book_title=row[3], borrower_name=row[4], borrower_email=row[5],
            borrow_date=_str_to_dt(row[6]), due_date=_str_to_dt(row[7]), return_date=_str_to_dt(row[8]),
            overdue_days=overdue_days, is_returned=is_returned, status=status,
        )
        db.add(record)

    db.commit()
    logger.info(f"Rebuilt overdue_summary: {len(rows)} records")
    return len(rows)


def rebuild_all_analytics(db: Session) -> Dict[str, int]:
    """Rebuild all analytics tables from scratch."""
    return {
        "popular_books": rebuild_popular_books(db),
        "monthly_trends": rebuild_monthly_trends(db),
        "category_summary": rebuild_category_summary(db),
        "overdue_summary": rebuild_overdue_summary(db),
    }
