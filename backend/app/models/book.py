"""Book ORM model."""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base


class Book(Base):
    __tablename__ = "books"

    book_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    title = Column(String(255), nullable=False, index=True)
    author = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    isbn = Column(String(20), unique=True, nullable=False, index=True)
    availability_status = Column(Boolean, default=True, nullable=False)
    description = Column(String(1000), nullable=True)
    publisher = Column(String(255), nullable=True)
    published_year = Column(Integer, nullable=True)
    cover_color = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    transactions = relationship("Transaction", back_populates="book", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_book_title_author", "title", "author"),
        Index("idx_book_category_status", "category", "availability_status"),
    )

    def __repr__(self):
        return f"<Book(id={self.book_id}, title='{self.title}')>"
