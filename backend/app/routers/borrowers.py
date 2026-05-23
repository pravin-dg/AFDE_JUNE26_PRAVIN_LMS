from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..crud.borrower import borrower_crud
from ..schemas.borrower import BorrowerCreate, BorrowerUpdate, BorrowerResponse, BorrowerListResponse
from ..schemas.common import MessageResponse

router = APIRouter(prefix="/borrowers", tags=["Borrowers"])


@router.get("/", response_model=BorrowerListResponse)
async def list_borrowers(skip: int = Query(0, ge=0), limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None), db: Session = Depends(get_db)):
    items, total = borrower_crud.get_multi(db, skip=skip, limit=limit, search=search)
    result = []
    for b in items:
        r = BorrowerResponse.model_validate(b)
        r.active_borrows = borrower_crud.get_active_borrow_count(db, b.borrower_id)
        result.append(r)
    return BorrowerListResponse(items=result, total=total, skip=skip, limit=limit)


@router.get("/stats")
async def get_borrower_stats(db: Session = Depends(get_db)):
    return borrower_crud.get_stats(db)


@router.get("/{borrower_id}", response_model=BorrowerResponse)
async def get_borrower(borrower_id: int, db: Session = Depends(get_db)):
    b = borrower_crud.get(db, borrower_id)
    if not b:
        raise HTTPException(status_code=404, detail=f"Borrower {borrower_id} not found")
    r = BorrowerResponse.model_validate(b)
    r.active_borrows = borrower_crud.get_active_borrow_count(db, borrower_id)
    return r


@router.post("/", response_model=BorrowerResponse, status_code=201)
async def create_borrower(borrower_in: BorrowerCreate, db: Session = Depends(get_db)):
    if borrower_crud.get_by_email(db, borrower_in.email):
        raise HTTPException(status_code=409, detail=f"Borrower with email '{borrower_in.email}' already exists")
    return borrower_crud.create(db, borrower_in)


@router.put("/{borrower_id}", response_model=BorrowerResponse)
async def update_borrower(borrower_id: int, borrower_in: BorrowerUpdate, db: Session = Depends(get_db)):
    db_b = borrower_crud.get(db, borrower_id)
    if not db_b:
        raise HTTPException(status_code=404, detail=f"Borrower {borrower_id} not found")
    if borrower_in.email and borrower_in.email != db_b.email and borrower_crud.get_by_email(db, borrower_in.email):
        raise HTTPException(status_code=409, detail=f"Email '{borrower_in.email}' already in use")
    return borrower_crud.update(db, db_b, borrower_in)


@router.delete("/{borrower_id}", response_model=MessageResponse)
async def delete_borrower(borrower_id: int, db: Session = Depends(get_db)):
    db_b = borrower_crud.get(db, borrower_id)
    if not db_b:
        raise HTTPException(status_code=404, detail=f"Borrower {borrower_id} not found")
    active = borrower_crud.get_active_borrow_count(db, borrower_id)
    if active > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete borrower with {active} active borrow(s)")
    borrower_crud.delete(db, borrower_id)
    return MessageResponse(message=f"Borrower '{db_b.borrower_name}' deleted successfully")
