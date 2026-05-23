"""CRUD operations for Book model."""
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from typing import List, Optional, Tuple
from ..models.book import Book
from ..schemas.book import BookCreate, BookUpdate


class BookCRUD:
    def get(self, db: Session, book_id: int) -> Optional[Book]:
        return db.query(Book).filter(Book.book_id == book_id).first()

    def get_by_isbn(self, db: Session, isbn: str) -> Optional[Book]:
        return db.query(Book).filter(Book.isbn == isbn).first()

    def get_multi(
        self, db: Session, skip: int = 0, limit: int = 20,
        category: Optional[str] = None, availability_status: Optional[bool] = None,
        search: Optional[str] = None, sort_by: str = "book_id", sort_order: str = "desc",
    ) -> Tuple[List[Book], int]:
        query = db.query(Book)
        if category:
            query = query.filter(Book.category.ilike(f"%{category}%"))
        if availability_status is not None:
            query = query.filter(Book.availability_status == availability_status)
        if search:
            term = f"%{search}%"
            query = query.filter(or_(
                Book.title.ilike(term), Book.author.ilike(term),
                Book.isbn.ilike(term), Book.category.ilike(term),
            ))
        total = query.count()
        sort_col = getattr(Book, sort_by, Book.book_id)
        query = query.order_by(sort_col.desc() if sort_order == "desc" else sort_col.asc())
        return query.offset(skip).limit(limit).all(), total

    def create(self, db: Session, book_in: BookCreate) -> Book:
        db_book = Book(**book_in.model_dump())
        db.add(db_book)
        db.commit()
        db.refresh(db_book)
        return db_book

    def update(self, db: Session, db_book: Book, book_in: BookUpdate) -> Book:
        for field, value in book_in.model_dump(exclude_unset=True).items():
            setattr(db_book, field, value)
        db.commit()
        db.refresh(db_book)
        return db_book

    def delete(self, db: Session, book_id: int) -> Optional[Book]:
        db_book = self.get(db, book_id)
        if db_book:
            db.delete(db_book)
            db.commit()
        return db_book

    def get_categories(self, db: Session) -> List[str]:
        return [r[0] for r in db.query(Book.category).distinct().order_by(Book.category).all()]

    def get_stats(self, db: Session) -> dict:
        total = db.query(func.count(Book.book_id)).scalar()
        available = db.query(func.count(Book.book_id)).filter(Book.availability_status == True).scalar()
        return {"total_books": total, "available_books": available, "borrowed_books": total - available,
                "total_categories": db.query(func.count(Book.category.distinct())).scalar()}

    def get_recently_added(self, db: Session, limit: int = 5) -> List[Book]:
        return db.query(Book).order_by(Book.created_at.desc()).limit(limit).all()


book_crud = BookCRUD()
