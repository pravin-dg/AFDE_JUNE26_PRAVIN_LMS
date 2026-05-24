"""Optimized analytics SQL queries against analytics summary tables."""
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Dict, Any


def get_popular_books(db: Session, limit: int = 10, category: str = None) -> List[Dict]:
    base_sql = """
        SELECT book_id, title, author, category, isbn,
               total_borrows, total_returns, active_borrows,
               avg_borrow_days, rank, last_borrowed_at
        FROM analytics_popular_books
        WHERE total_borrows > 0
    """
    params = {"limit": limit}
    if category:
        base_sql += " AND LOWER(category) = LOWER(:category)"
        params["category"] = category
    base_sql += " ORDER BY rank ASC LIMIT :limit"
    rows = db.execute(text(base_sql), params).fetchall()
    return [dict(zip(["book_id","title","author","category","isbn",
                      "total_borrows","total_returns","active_borrows",
                      "avg_borrow_days","rank","last_borrowed_at"], r)) for r in rows]


def get_monthly_trends(db: Session, limit: int = 24) -> List[Dict]:
    rows = db.execute(text("""
        SELECT year, month, month_label, total_borrows, total_returns,
               active_borrows, overdue_count, unique_borrowers, unique_books
        FROM analytics_monthly_trends
        ORDER BY year DESC, month DESC
        LIMIT :limit
    """), {"limit": limit}).fetchall()
    result = [dict(zip(["year","month","month_label","total_borrows","total_returns",
                        "active_borrows","overdue_count","unique_borrowers","unique_books"], r))
              for r in rows]
    return list(reversed(result))


def get_category_trends(db: Session) -> List[Dict]:
    rows = db.execute(text("""
        SELECT category, total_books, available_books, borrowed_books,
               total_borrows, total_returns, borrow_percentage
        FROM analytics_category_summary
        ORDER BY total_borrows DESC
    """)).fetchall()
    return [dict(zip(["category","total_books","available_books","borrowed_books",
                      "total_borrows","total_returns","borrow_percentage"], r)) for r in rows]


def get_overdue_analysis(db: Session, limit: int = 50) -> Dict[str, Any]:
    stats_row = db.execute(text("""
        SELECT
            COUNT(*) AS total_overdue,
            AVG(overdue_days) AS avg_overdue_days,
            MAX(overdue_days) AS max_overdue_days,
            SUM(CASE WHEN status = 'active_overdue' THEN 1 ELSE 0 END) AS currently_overdue,
            SUM(CASE WHEN status = 'returned_late' THEN 1 ELSE 0 END) AS returned_late
        FROM analytics_overdue_summary
    """)).fetchone()

    total_tx = db.execute(text("SELECT COUNT(*) FROM transactions")).scalar() or 1

    detail_rows = db.execute(text("""
        SELECT transaction_id, book_id, borrower_id, book_title, borrower_name,
               borrower_email, borrow_date, due_date, return_date,
               overdue_days, is_returned, status
        FROM analytics_overdue_summary
        ORDER BY overdue_days DESC
        LIMIT :limit
    """), {"limit": limit}).fetchall()

    freq_rows = db.execute(text("""
        SELECT borrower_id, borrower_name, COUNT(*) AS overdue_count, AVG(overdue_days) AS avg_days
        FROM analytics_overdue_summary
        GROUP BY borrower_id, borrower_name
        ORDER BY overdue_count DESC
        LIMIT 10
    """)).fetchall()

    return {
        "summary": {
            "total_overdue": int(stats_row[0] or 0),
            "avg_overdue_days": round(float(stats_row[1] or 0), 1),
            "max_overdue_days": int(stats_row[2] or 0),
            "currently_overdue": int(stats_row[3] or 0),
            "returned_late": int(stats_row[4] or 0),
            "overdue_percentage": round(int(stats_row[0] or 0) / total_tx * 100, 1),
        },
        "top_overdue": [
            dict(zip(["transaction_id","book_id","borrower_id","book_title","borrower_name",
                      "borrower_email","borrow_date","due_date","return_date",
                      "overdue_days","is_returned","status"], r))
            for r in detail_rows
        ],
        "frequent_offenders": [
            {"borrower_id": r[0], "borrower_name": r[1],
             "overdue_count": int(r[2]), "avg_days": round(float(r[3] or 0), 1)}
            for r in freq_rows
        ],
    }


def get_dashboard_summary(db: Session) -> Dict[str, Any]:
    """Aggregate KPIs for the analytics dashboard — queries live DB tables."""
    book_row = db.execute(text("""
        SELECT
            COUNT(*) AS total_books,
            SUM(CASE WHEN availability_status = 1 THEN 1 ELSE 0 END) AS available_books,
            SUM(CASE WHEN availability_status = 0 THEN 1 ELSE 0 END) AS borrowed_books
        FROM books
    """)).fetchone()

    total_borrowers = db.execute(text("SELECT COUNT(*) FROM borrowers")).scalar() or 0

    tx_row = db.execute(text("""
        SELECT
            COUNT(*) AS total_transactions,
            SUM(CASE WHEN is_returned = 0 THEN 1 ELSE 0 END) AS active_borrows,
            SUM(CASE WHEN is_returned = 0 AND due_date IS NOT NULL
                      AND due_date < datetime('now') THEN 1 ELSE 0 END) AS overdue_count
        FROM transactions
    """)).fetchone()

    total_transactions = int(tx_row[0] or 0)
    active_borrows     = int(tx_row[1] or 0)
    overdue_count      = int(tx_row[2] or 0)
    overdue_rate       = round(overdue_count / total_transactions * 100, 1) if total_transactions else 0.0

    # Top 5 books by borrow count
    top5 = db.execute(text("""
        SELECT b.title, COUNT(t.transaction_id) AS borrows
        FROM books b
        LEFT JOIN transactions t ON b.book_id = t.book_id
        GROUP BY b.book_id, b.title
        ORDER BY borrows DESC
        LIMIT 5
    """)).fetchall()

    # Last 6 months of borrow counts
    monthly = db.execute(text("""
        SELECT strftime('%Y-%m', borrow_date) AS ym, COUNT(*) AS borrows
        FROM transactions
        WHERE borrow_date >= datetime('now', '-6 months')
        GROUP BY ym
        ORDER BY ym ASC
    """)).fetchall()

    return {
        "total_books":       int(book_row[0] or 0),
        "available_books":   int(book_row[1] or 0),
        "borrowed_books":    int(book_row[2] or 0),
        "total_borrowers":   int(total_borrowers),
        "active_borrows":    active_borrows,
        "total_transactions": total_transactions,
        "overdue_count":     overdue_count,
        "overdue_rate":      overdue_rate,
        "top_books":         [{"title": r[0], "borrows": int(r[1])} for r in top5],
        "monthly_trends":    [{"month": r[0], "borrows": int(r[1])} for r in monthly],
    }
