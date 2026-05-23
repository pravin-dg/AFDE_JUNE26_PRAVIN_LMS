from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..crud.book import book_crud
from ..schemas.book import BookCreate, BookUpdate, BookResponse, BookListResponse
from ..schemas.common import MessageResponse

router = APIRouter(prefix="/books", tags=["Books"])


@router.get("/", response_model=BookListResponse)
async def list_books(
    skip: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100),
    category: Optional[str] = Query(None), availability_status: Optional[bool] = Query(None),
    search: Optional[str] = Query(None), sort_by: str = Query("book_id"), sort_order: str = Query("desc"),
    db: Session = Depends(get_db),
):
    items, total = book_crud.get_multi(db, skip=skip, limit=limit, category=category,
        availability_status=availability_status, search=search, sort_by=sort_by, sort_order=sort_order)
    return BookListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/categories")
async def get_categories(db: Session = Depends(get_db)):
    return book_crud.get_categories(db)


@router.get("/stats")
async def get_book_stats(db: Session = Depends(get_db)):
    return book_crud.get_stats(db)


@router.get("/recent")
async def get_recent_books(limit: int = Query(5, ge=1, le=20), db: Session = Depends(get_db)):
    books = book_crud.get_recently_added(db, limit=limit)
    return [BookResponse.model_validate(b) for b in books]


@router.get("/{book_id}", response_model=BookResponse)
async def get_book(book_id: int, db: Session = Depends(get_db)):
    book = book_crud.get(db, book_id)
    if not book:
        raise HTTPException(status_code=404, detail=f"Book with id {book_id} not found")
    return book


@router.post("/", response_model=BookResponse, status_code=201)
async def create_book(book_in: BookCreate, db: Session = Depends(get_db)):
    if book_crud.get_by_isbn(db, book_in.isbn):
        raise HTTPException(status_code=409, detail=f"Book with ISBN '{book_in.isbn}' already exists")
    return book_crud.create(db, book_in)


@router.put("/{book_id}", response_model=BookResponse)
async def update_book(book_id: int, book_in: BookUpdate, db: Session = Depends(get_db)):
    db_book = book_crud.get(db, book_id)
    if not db_book:
        raise HTTPException(status_code=404, detail=f"Book with id {book_id} not found")
    if book_in.isbn and book_in.isbn != db_book.isbn and book_crud.get_by_isbn(db, book_in.isbn):
        raise HTTPException(status_code=409, detail=f"ISBN '{book_in.isbn}' already in use")
    return book_crud.update(db, db_book, book_in)


@router.delete("/{book_id}", response_model=MessageResponse)
async def delete_book(book_id: int, db: Session = Depends(get_db)):
    db_book = book_crud.get(db, book_id)
    if not db_book:
        raise HTTPException(status_code=404, detail=f"Book with id {book_id} not found")
    if not db_book.availability_status:
        raise HTTPException(status_code=400, detail="Cannot delete a book that is currently borrowed")
    book_crud.delete(db, book_id)
    return MessageResponse(message=f"Book '{db_book.title}' deleted successfully")
