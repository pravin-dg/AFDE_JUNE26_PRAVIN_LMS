"""ETL Transform phase — data cleaning, normalization, derived field generation."""
import logging
from datetime import datetime, timezone
from typing import Dict, Tuple, List
import pandas as pd
import numpy as np
from .validators import (
    normalize_isbn, normalize_author, normalize_category,
    normalize_name, normalize_email, normalize_phone, parse_date_safe
)

logger = logging.getLogger(__name__)

VALID_CATEGORIES = [
    "Classic Fiction", "Dystopian Fiction", "Science Fiction", "Fantasy",
    "Romance", "Mystery", "Thriller", "Horror", "Biography", "History",
    "Non-Fiction", "Technology", "Self-Help", "Business", "Psychology",
    "Philosophy", "Spirituality", "Classic", "General", "Poetry", "Drama",
]


def transform_books(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict]:
    """Clean and normalize books DataFrame."""
    report = {"input_rows": len(df), "duplicate_rows": 0, "cleaned_rows": 0, "issues": []}
    if df.empty:
        return df, report

    # Column mapping — handle alternate column names
    col_map = {
        "book_title": "title", "name": "title",
        "book_author": "author", "writer": "author",
        "genre": "category", "type": "category",
        "book_isbn": "isbn",
        "status": "availability_status",
        "year": "published_year", "pub_year": "published_year",
    }
    df = df.rename(columns={k: v for k, v in col_map.items() if k in df.columns})

    # Ensure required columns
    for col in ["title", "author", "category", "isbn"]:
        if col not in df.columns:
            df[col] = pd.NA

    # 1. Normalize text fields
    df["title"] = df["title"].fillna("Unknown Title").astype(str).str.strip()
    df["author"] = df["author"].apply(lambda x: normalize_author(x))
    df["category"] = df["category"].apply(lambda x: normalize_category(x, VALID_CATEGORIES))
    df["isbn"] = df["isbn"].apply(normalize_isbn)
    df["description"] = df.get("description", pd.Series([""] * len(df))).fillna("").astype(str).str.strip()
    df["publisher"] = df.get("publisher", pd.Series([""] * len(df))).fillna("").astype(str).str.strip()

    # 2. Validate/clean published_year
    if "published_year" in df.columns:
        df["published_year"] = pd.to_numeric(df["published_year"], errors="coerce")
        df.loc[~df["published_year"].between(1000, 2100, inclusive="both"), "published_year"] = pd.NA

    # 3. Availability status
    if "availability_status" not in df.columns:
        df["availability_status"] = True
    else:
        df["availability_status"] = df["availability_status"].apply(
            lambda x: str(x).lower() in ("true", "1", "yes", "available")
        )

    # 4. Remove duplicates on ISBN (keep first)
    before_dedup = len(df)
    df_valid_isbn = df[df["isbn"].str.len() >= 10].copy()
    df_no_isbn = df[df["isbn"].str.len() < 10].copy()
    df_valid_isbn = df_valid_isbn.drop_duplicates(subset=["isbn"], keep="first")
    df = pd.concat([df_valid_isbn, df_no_isbn], ignore_index=True)
    report["duplicate_rows"] = before_dedup - len(df)

    # 5. Drop rows with no title
    df = df[df["title"].str.strip().str.len() > 0]

    report["cleaned_rows"] = len(df)
    logger.info(f"Books transform: {report['input_rows']} → {report['cleaned_rows']} rows (dupes removed: {report['duplicate_rows']})")
    return df, report


def transform_borrowers(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict]:
    """Clean and normalize borrowers DataFrame."""
    report = {"input_rows": len(df), "duplicate_rows": 0, "cleaned_rows": 0, "issues": []}
    if df.empty:
        return df, report

    col_map = {
        "name": "borrower_name", "full_name": "borrower_name", "member_name": "borrower_name",
        "mail": "email", "email_address": "email",
        "mobile": "phone", "telephone": "phone",
    }
    df = df.rename(columns={k: v for k, v in col_map.items() if k in df.columns})

    for col in ["borrower_name", "email"]:
        if col not in df.columns:
            df[col] = pd.NA

    df["borrower_name"] = df["borrower_name"].apply(normalize_name)
    df["email"] = df["email"].apply(normalize_email)
    df["phone"] = df.get("phone", pd.Series([""] * len(df))).apply(normalize_phone)
    df["address"] = df.get("address", pd.Series([""] * len(df))).fillna("").astype(str).str.strip()

    # Drop rows with invalid email
    df = df[df["email"].str.contains(r"@", na=False)]

    # Remove duplicate emails
    before_dedup = len(df)
    df = df.drop_duplicates(subset=["email"], keep="first")
    report["duplicate_rows"] = before_dedup - len(df)

    report["cleaned_rows"] = len(df)
    logger.info(f"Borrowers transform: {report['input_rows']} → {report['cleaned_rows']} rows")
    return df, report


def transform_transactions(df: pd.DataFrame) -> Tuple[pd.DataFrame, Dict]:
    """Clean transactions and generate analytics-ready derived fields."""
    report = {"input_rows": len(df), "duplicate_rows": 0, "cleaned_rows": 0, "issues": []}
    if df.empty:
        return df, report

    col_map = {
        "book": "book_id", "bid": "book_id",
        "borrower": "borrower_id", "member_id": "borrower_id",
        "borrowed_date": "borrow_date", "checkout_date": "borrow_date",
        "returned_date": "return_date",
        "returned": "is_returned",
    }
    df = df.rename(columns={k: v for k, v in col_map.items() if k in df.columns})

    # Coerce IDs
    df["book_id"] = pd.to_numeric(df.get("book_id", pd.Series([pd.NA] * len(df))), errors="coerce")
    df["borrower_id"] = pd.to_numeric(df.get("borrower_id", pd.Series([pd.NA] * len(df))), errors="coerce")
    df = df.dropna(subset=["book_id", "borrower_id"])
    df["book_id"] = df["book_id"].astype(int)
    df["borrower_id"] = df["borrower_id"].astype(int)

    # Parse dates
    now_utc = pd.Timestamp.now(tz="UTC")
    df["borrow_date"] = pd.to_datetime(df.get("borrow_date"), errors="coerce", utc=True)
    df["due_date"] = pd.to_datetime(df.get("due_date", pd.Series([pd.NaT] * len(df))), errors="coerce", utc=True)
    df["return_date"] = pd.to_datetime(df.get("return_date", pd.Series([pd.NaT] * len(df))), errors="coerce", utc=True)

    # Drop rows with no borrow_date
    df = df.dropna(subset=["borrow_date"])

    # is_returned
    if "is_returned" in df.columns:
        df["is_returned"] = df["is_returned"].apply(
            lambda x: str(x).lower() in ("true", "1", "yes") if pd.notna(x) else False
        )
    else:
        df["is_returned"] = df["return_date"].notna()

    # ── Derived analytics fields ───────────────────────────────────────────
    # borrowing_month / borrowing_year
    df["borrowing_month"] = df["borrow_date"].dt.month
    df["borrowing_year"] = df["borrow_date"].dt.year
    df["month_label"] = df["borrow_date"].dt.strftime("%b %Y")

    # overdue_days
    effective_due = df["due_date"].fillna(df["borrow_date"] + pd.Timedelta(days=14))
    ref_date = df["return_date"].where(df["is_returned"] & df["return_date"].notna(), other=now_utc)
    df["overdue_days"] = ((ref_date - effective_due).dt.total_seconds() / 86400).clip(lower=0).fillna(0).astype(int)

    # transaction_status
    def compute_status(row):
        if row["is_returned"]:
            if row["overdue_days"] > 0:
                return "returned_late"
            return "returned_on_time"
        if row["overdue_days"] > 0:
            return "overdue"
        return "active"
    df["transaction_status"] = df.apply(compute_status, axis=1)

    # Remove duplicate transaction IDs if present
    if "transaction_id" in df.columns:
        before = len(df)
        df = df.drop_duplicates(subset=["transaction_id"], keep="first")
        report["duplicate_rows"] = before - len(df)

    report["cleaned_rows"] = len(df)
    logger.info(f"Transactions transform: {report['input_rows']} → {report['cleaned_rows']} rows")
    return df, report


def transform_all(data: Dict[str, pd.DataFrame]) -> Tuple[Dict[str, pd.DataFrame], Dict]:
    """Run all transform functions and return cleaned data + combined report."""
    report = {}
    cleaned = {}
    if "books" in data:
        cleaned["books"], report["books"] = transform_books(data["books"])
    if "borrowers" in data:
        cleaned["borrowers"], report["borrowers"] = transform_borrowers(data["borrowers"])
    if "transactions" in data:
        cleaned["transactions"], report["transactions"] = transform_transactions(data["transactions"])
    return cleaned, report
