"""ETL Extract phase — reads CSV files and existing DB tables."""
import io
import logging
from typing import Optional, Dict, Any
import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import text

logger = logging.getLogger(__name__)


class DataExtractor:
    """Handles data extraction from CSV files and the live database."""

    # ── CSV Extraction ────────────────────────────────────────────────────────

    def extract_csv(self, file_bytes: bytes, filename: str = "upload.csv") -> pd.DataFrame:
        """Parse a CSV file from bytes into a DataFrame."""
        logger.info(f"Extracting CSV: {filename} ({len(file_bytes)} bytes)")
        try:
            df = pd.read_csv(io.BytesIO(file_bytes), dtype=str, keep_default_na=False)
            # Replace empty strings with NaN
            df = df.replace("", pd.NA)
            logger.info(f"Extracted {len(df)} rows, {len(df.columns)} columns from {filename}")
            return df
        except Exception as e:
            logger.error(f"CSV extraction failed for {filename}: {e}")
            raise ValueError(f"Failed to parse CSV '{filename}': {e}")

    def extract_csv_path(self, path: str) -> pd.DataFrame:
        """Read a CSV file from disk."""
        logger.info(f"Extracting CSV from path: {path}")
        df = pd.read_csv(path, dtype=str, keep_default_na=False)
        df = df.replace("", pd.NA)
        logger.info(f"Extracted {len(df)} rows from {path}")
        return df

    # ── Database Extraction ───────────────────────────────────────────────────

    def extract_books_from_db(self, db: Session) -> pd.DataFrame:
        """Extract all books from the live database."""
        logger.info("Extracting books from database")
        result = db.execute(text("""
            SELECT book_id, title, author, category, isbn,
                   availability_status, description, publisher,
                   published_year, cover_color, created_at
            FROM books
        """))
        rows = result.fetchall()
        df = pd.DataFrame(rows, columns=result.keys())
        logger.info(f"Extracted {len(df)} books from DB")
        return df

    def extract_borrowers_from_db(self, db: Session) -> pd.DataFrame:
        """Extract all borrowers from the live database."""
        logger.info("Extracting borrowers from database")
        result = db.execute(text("""
            SELECT borrower_id, borrower_name, email, phone, address, created_at
            FROM borrowers
        """))
        rows = result.fetchall()
        df = pd.DataFrame(rows, columns=result.keys())
        logger.info(f"Extracted {len(df)} borrowers from DB")
        return df

    def extract_transactions_from_db(self, db: Session) -> pd.DataFrame:
        """Extract all transactions with joined book/borrower fields."""
        logger.info("Extracting transactions from database")
        result = db.execute(text("""
            SELECT
                t.transaction_id, t.book_id, t.borrower_id,
                t.borrow_date, t.due_date, t.return_date, t.is_returned,
                t.created_at,
                b.title AS book_title, b.author AS book_author,
                b.category AS book_category,
                br.borrower_name, br.email AS borrower_email
            FROM transactions t
            LEFT JOIN books b ON t.book_id = b.book_id
            LEFT JOIN borrowers br ON t.borrower_id = br.borrower_id
        """))
        rows = result.fetchall()
        df = pd.DataFrame(rows, columns=result.keys())
        logger.info(f"Extracted {len(df)} transactions from DB")
        return df

    def extract_all_from_db(self, db: Session) -> Dict[str, pd.DataFrame]:
        """Extract all tables from DB and return as dict of DataFrames."""
        return {
            "books": self.extract_books_from_db(db),
            "borrowers": self.extract_borrowers_from_db(db),
            "transactions": self.extract_transactions_from_db(db),
        }

    def detect_file_type(self, filename: str) -> str:
        """Detect dataset type from filename."""
        name = filename.lower()
        if "book" in name:
            return "books"
        if "borrower" in name or "member" in name:
            return "borrowers"
        if "transaction" in name or "borrow" in name:
            return "transactions"
        return "unknown"


extractor = DataExtractor()
