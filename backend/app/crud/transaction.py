"""CRUD operations for Transaction model."""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional, Tuple
from datetime import datetime, timedelta
from ..models.transaction import Transaction
from ..models.book import Book
from ..schemas.transaction import TransactionCreate


class TransactionCRUD:
    def get(self, db: Session, transaction_id: int) -> Optional[Transaction]:
        return db.query(Transaction).options(
            joinedload(Transaction.book), joinedload(Transaction.borrower)
        ).filter(Transaction.transaction_id == transaction_id).first()

    def get_active_for_book(self, db: Session, book_id: int) -> Optional[Transaction]:
        return db.query(Transaction).filter(Transaction.book_id == book_id, Transaction.is_returned == False).first()

    def get_active_for_borrower_book(self, db: Session, borrower_id: int, book_id: int) -> Optional[Transaction]:
        return db.query(Transaction).filter(
            Transaction.borrower_id == borrower_id, Transaction.book_id == book_id, Transaction.is_returned == False
        ).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 20,
                  is_returned: Optional[bool] = None, borrower_id: Optional[int] = None,
                  book_id: Optional[int] = None) -> Tuple[List[Transaction], int]:
        query = db.query(Transaction).options(joinedload(Transaction.book), joinedload(Transaction.borrower))
        if is_returned is not None:
            query = query.filter(Transaction.is_returned == is_returned)
        if borrower_id:
            query = query.filter(Transaction.borrower_id == borrower_id)
        if book_id:
            query = query.filter(Transaction.book_id == book_id)
        total = query.count()
        return query.order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all(), total

    def borrow_book(self, db: Session, tx_in: TransactionCreate) -> Transaction:
        due_date = tx_in.due_date or datetime.utcnow() + timedelta(days=14)
        db_tx = Transaction(book_id=tx_in.book_id, borrower_id=tx_in.borrower_id, due_date=due_date, is_returned=False)
        book = db.query(Book).filter(Book.book_id == tx_in.book_id).first()
        book.availability_status = False
        db.add(db_tx)
        db.commit()
        db.refresh(db_tx)
        return self.get(db, db_tx.transaction_id)

    def return_book(self, db: Session, transaction_id: int) -> Optional[Transaction]:
        tx = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
        if tx and not tx.is_returned:
            tx.is_returned = True
            tx.return_date = datetime.utcnow()
            book = db.query(Book).filter(Book.book_id == tx.book_id).first()
            if book:
                book.availability_status = True
            db.commit()
            db.refresh(tx)
            return self.get(db, transaction_id)
        return None

    def get_stats(self, db: Session) -> dict:
        total = db.query(func.count(Transaction.transaction_id)).scalar()
        active = db.query(func.count(Transaction.transaction_id)).filter(Transaction.is_returned == False).scalar()
        return {"total_transactions": total, "active_transactions": active, "returned_transactions": total - active}

    def get_recent(self, db: Session, limit: int = 10) -> List[Transaction]:
        return db.query(Transaction).options(
            joinedload(Transaction.book), joinedload(Transaction.borrower)
        ).order_by(Transaction.created_at.desc()).limit(limit).all()


transaction_crud = TransactionCRUD()
