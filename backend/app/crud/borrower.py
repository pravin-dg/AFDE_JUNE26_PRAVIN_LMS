"""CRUD operations for Borrower model."""
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional, Tuple
from ..models.borrower import Borrower
from ..models.transaction import Transaction
from ..schemas.borrower import BorrowerCreate, BorrowerUpdate


class BorrowerCRUD:
    def get(self, db: Session, borrower_id: int) -> Optional[Borrower]:
        return db.query(Borrower).filter(Borrower.borrower_id == borrower_id).first()

    def get_by_email(self, db: Session, email: str) -> Optional[Borrower]:
        return db.query(Borrower).filter(Borrower.email == email).first()

    def get_multi(self, db: Session, skip: int = 0, limit: int = 20, search: Optional[str] = None) -> Tuple[List[Borrower], int]:
        query = db.query(Borrower)
        if search:
            term = f"%{search}%"
            query = query.filter(or_(Borrower.borrower_name.ilike(term), Borrower.email.ilike(term), Borrower.phone.ilike(term)))
        total = query.count()
        return query.order_by(Borrower.created_at.desc()).offset(skip).limit(limit).all(), total

    def create(self, db: Session, borrower_in: BorrowerCreate) -> Borrower:
        db_borrower = Borrower(**borrower_in.model_dump())
        db.add(db_borrower)
        db.commit()
        db.refresh(db_borrower)
        return db_borrower

    def update(self, db: Session, db_borrower: Borrower, borrower_in: BorrowerUpdate) -> Borrower:
        for field, value in borrower_in.model_dump(exclude_unset=True).items():
            setattr(db_borrower, field, value)
        db.commit()
        db.refresh(db_borrower)
        return db_borrower

    def delete(self, db: Session, borrower_id: int) -> Optional[Borrower]:
        db_borrower = self.get(db, borrower_id)
        if db_borrower:
            db.delete(db_borrower)
            db.commit()
        return db_borrower

    def get_active_borrow_count(self, db: Session, borrower_id: int) -> int:
        return db.query(func.count(Transaction.transaction_id)).filter(
            Transaction.borrower_id == borrower_id, Transaction.is_returned == False).scalar()

    def get_stats(self, db: Session) -> dict:
        total = db.query(func.count(Borrower.borrower_id)).scalar()
        active = db.query(func.count(Borrower.borrower_id.distinct())).join(Transaction).filter(Transaction.is_returned == False).scalar()
        return {"total_borrowers": total, "active_borrowers": active}


borrower_crud = BorrowerCRUD()
