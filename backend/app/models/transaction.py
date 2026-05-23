"""Transaction ORM model."""
from sqlalchemy import Column, Integer, ForeignKey, DateTime, Boolean, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    book_id = Column(Integer, ForeignKey("books.book_id", ondelete="CASCADE"), nullable=False, index=True)
    borrower_id = Column(Integer, ForeignKey("borrowers.borrower_id", ondelete="CASCADE"), nullable=False, index=True)
    borrow_date = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    due_date = Column(DateTime(timezone=True), nullable=True)
    return_date = Column(DateTime(timezone=True), nullable=True)
    is_returned = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    book = relationship("Book", back_populates="transactions")
    borrower = relationship("Borrower", back_populates="transactions")

    __table_args__ = (
        Index("idx_transaction_book_borrower", "book_id", "borrower_id"),
        Index("idx_transaction_status", "is_returned"),
    )
