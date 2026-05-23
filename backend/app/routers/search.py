from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..crud.book import book_crud
from ..crud.borrower import borrower_crud
from ..schemas.book import BookResponse
from ..schemas.borrower import BorrowerResponse

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/")
async def global_search(q: str = Query(..., min_length=1), skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)):
    books, book_total = book_crud.get_multi(db, skip=skip, limit=limit, search=q)
    borrowers, borrower_total = borrower_crud.get_multi(db, skip=0, limit=10, search=q)
    return {
        "query": q,
        "books": {"items": [BookResponse.model_validate(b) for b in books], "total": book_total},
        "borrowers": {"items": [BorrowerResponse.model_validate(b) for b in borrowers], "total": borrower_total},
    }
