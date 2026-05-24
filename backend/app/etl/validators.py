"""Data validation utilities for ETL pipeline."""
import re
import pandas as pd
from typing import Tuple, List


def validate_isbn(isbn: str) -> bool:
    """Validate ISBN-10 or ISBN-13 format."""
    if not isbn or pd.isna(isbn):
        return False
    cleaned = re.sub(r'[-\s]', '', str(isbn))
    return bool(re.match(r'^\d{10}$|^\d{13}$|^\d{9}X$', cleaned, re.IGNORECASE))


def normalize_isbn(isbn: str) -> str:
    """Strip hyphens and spaces from ISBN."""
    if not isbn or pd.isna(isbn):
        return ""
    return re.sub(r'[-\s]', '', str(isbn)).strip()


def normalize_author(author: str) -> str:
    """Title-case author name, strip extra whitespace."""
    if not author or pd.isna(author):
        return "Unknown Author"
    return " ".join(str(author).strip().split()).title()


def normalize_category(category: str, valid_categories: List[str] = None) -> str:
    """Standardize category name."""
    if not category or pd.isna(category):
        return "General"
    cat = str(category).strip().title()
    if valid_categories:
        # Find closest match
        for vc in valid_categories:
            if cat.lower() == vc.lower():
                return vc
    return cat


def normalize_name(name: str) -> str:
    """Normalize borrower name."""
    if not name or pd.isna(name):
        return "Unknown"
    return " ".join(str(name).strip().split()).title()


def normalize_email(email: str) -> str:
    """Lowercase and strip email."""
    if not email or pd.isna(email):
        return ""
    return str(email).strip().lower()


def normalize_phone(phone: str) -> str:
    """Normalize phone number format."""
    if not phone or pd.isna(phone):
        return ""
    cleaned = re.sub(r'[^\d+\-\(\)\s]', '', str(phone)).strip()
    return cleaned


def parse_date_safe(date_val) -> pd.Timestamp | None:
    """Safely parse a date value, returning None on failure."""
    if date_val is None or (isinstance(date_val, float) and pd.isna(date_val)):
        return None
    try:
        return pd.to_datetime(date_val, infer_datetime_format=True, errors='coerce')
    except Exception:
        return None


def validate_books_df(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
    """Validate books DataFrame — return (valid_df, error_list)."""
    errors = []
    required = ['title', 'author', 'category', 'isbn']
    missing_cols = [c for c in required if c not in df.columns]
    if missing_cols:
        errors.append(f"Missing required columns: {missing_cols}")
        return pd.DataFrame(), errors

    initial_count = len(df)
    df = df.dropna(subset=['title', 'author'])
    dropped = initial_count - len(df)
    if dropped:
        errors.append(f"Dropped {dropped} rows missing title/author")

    return df, errors


def validate_borrowers_df(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
    """Validate borrowers DataFrame."""
    errors = []
    required = ['borrower_name', 'email']
    missing_cols = [c for c in required if c not in df.columns]
    if missing_cols:
        errors.append(f"Missing required columns: {missing_cols}")
        return pd.DataFrame(), errors

    initial_count = len(df)
    df = df.dropna(subset=['email'])
    dropped = initial_count - len(df)
    if dropped:
        errors.append(f"Dropped {dropped} rows missing email")

    return df, errors


def validate_transactions_df(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[str]]:
    """Validate transactions DataFrame."""
    errors = []
    required = ['book_id', 'borrower_id', 'borrow_date']
    missing_cols = [c for c in required if c not in df.columns]
    if missing_cols:
        errors.append(f"Missing required columns: {missing_cols}")
        return pd.DataFrame(), errors

    initial_count = len(df)
    df = df.dropna(subset=['book_id', 'borrower_id'])
    dropped = initial_count - len(df)
    if dropped:
        errors.append(f"Dropped {dropped} rows with null book_id/borrower_id")

    return df, errors
