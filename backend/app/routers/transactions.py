from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..crud.transaction import transaction_crud
from ..crud.book import book_crud
from ..crud.borrower import borrower_crud
from ..schemas.transaction import TransactionCreate, TransactionResponse, TransactionListResponse, ReturnRequest, BorrowResponse

router = APIRouter(tags=["Transactions"])


@router.get("/transactions", response_model=TransactionListResponse)
async def list_transactions(skip: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100),
    is_returned: Optional[bool] = Query(None), borrower_id: Optional[int] = Query(None),
    book_id: Optional[int] = Query(None), db: Session = Depends(get_db)):
    items, total = transaction_crud.get_multi(db, skip=skip, limit=limit, is_returned=is_returned,
        borrower_id=borrower_id, book_id=book_id)
    return TransactionListResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/transactions/stats")
async def get_transaction_stats(db: Session = Depends(get_db)):
    return transaction_crud.get_stats(db)


@router.get("/transactions/recent")
async def get_recent_transactions(limit: int = Query(10, ge=1, le=50), db: Session = Depends(get_db)):
    txs = transaction_crud.get_recent(db, limit=limit)
    return [TransactionResponse.model_validate(t) for t in txs]


@router.get("/transactions/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(transaction_id: int, db: Session = Depends(get_db)):
    tx = transaction_crud.get(db, transaction_id)
    if not tx:
        raise HTTPException(status_code=404, detail=f"Transaction {transaction_id} not found")
    return tx


@router.post("/borrow", response_model=BorrowResponse, status_code=201)
async def borrow_book(tx_in: TransactionCreate, db: Session = Depends(get_db)):
    book = book_crud.get(db, tx_in.book_id)
    if not book:
        raise HTTPException(status_code=404, detail=f"Book {tx_in.book_id} not found")
    if not book.availability_status:
        raise HTTPException(status_code=400, detail=f"'{book.title}' is not available for borrowing")
    borrower = borrower_crud.get(db, tx_in.borrower_id)
    if not borrower:
        raise HTTPException(status_code=404, detail=f"Borrower {tx_in.borrower_id} not found")
    if transaction_crud.get_active_for_borrower_book(db, tx_in.borrower_id, tx_in.book_id):
        raise HTTPException(status_code=409, detail="This borrower already has this book checked out")
    tx = transaction_crud.borrow_book(db, tx_in)
    return BorrowResponse(message=f"'{book.title}' borrowed by {borrower.borrower_name}", transaction=tx)


@router.post("/return", response_model=TransactionResponse)
async def return_book(req: ReturnRequest, db: Session = Depends(get_db)):
    tx = transaction_crud.get(db, req.transaction_id)
    if not tx:
        raise HTTPException(status_code=404, detail=f"Transaction {req.transaction_id} not found")
    if tx.is_returned:
        raise HTTPException(status_code=400, detail="This book has already been returned")
    return transaction_crud.return_book(db, req.transaction_id)
