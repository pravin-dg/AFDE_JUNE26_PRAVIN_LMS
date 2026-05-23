from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..crud.book import book_crud
from ..crud.borrower import borrower_crud
from ..crud.transaction import transaction_crud
from ..schemas.book import BookResponse
from ..schemas.transaction import TransactionResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    return {**book_crud.get_stats(db), **borrower_crud.get_stats(db), **transaction_crud.get_stats(db)}


@router.get("/recent-transactions")
async def get_recent_transactions(db: Session = Depends(get_db)):
    return [TransactionResponse.model_validate(t) for t in transaction_crud.get_recent(db, limit=8)]


@router.get("/recent-books")
async def get_recent_books(db: Session = Depends(get_db)):
    return [BookResponse.model_validate(b) for b in book_crud.get_recently_added(db, limit=6)]
