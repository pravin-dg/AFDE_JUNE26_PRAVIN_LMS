"""Report generation utilities — CSV export, summary builders."""
import io
import csv
import json
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from .queries import (
    get_popular_books, get_monthly_trends,
    get_category_trends, get_overdue_analysis,
)


def generate_popular_books_csv(db: Session) -> bytes:
    """Export popular books report as CSV bytes."""
    data = get_popular_books(db, limit=100)
    output = io.StringIO()
    if not data:
        return b"No data available"
    writer = csv.DictWriter(output, fieldnames=data[0].keys())
    writer.writeheader()
    writer.writerows(data)
    return output.getvalue().encode("utf-8")


def generate_monthly_trends_csv(db: Session) -> bytes:
    """Export monthly trends as CSV bytes."""
    data = get_monthly_trends(db, limit=36)
    output = io.StringIO()
    if not data:
        return b"No data available"
    writer = csv.DictWriter(output, fieldnames=data[0].keys())
    writer.writeheader()
    writer.writerows(data)
    return output.getvalue().encode("utf-8")


def generate_overdue_csv(db: Session) -> bytes:
    """Export overdue analysis as CSV bytes."""
    result = get_overdue_analysis(db, limit=500)
    data = result.get("top_overdue", [])
    output = io.StringIO()
    if not data:
        return b"No overdue records"
    writer = csv.DictWriter(output, fieldnames=data[0].keys())
    writer.writeheader()
    writer.writerows(data)
    return output.getvalue().encode("utf-8")


def generate_category_csv(db: Session) -> bytes:
    """Export category distribution as CSV."""
    data = get_category_trends(db)
    output = io.StringIO()
    if not data:
        return b"No data available"
    writer = csv.DictWriter(output, fieldnames=data[0].keys())
    writer.writeheader()
    writer.writerows(data)
    return output.getvalue().encode("utf-8")
