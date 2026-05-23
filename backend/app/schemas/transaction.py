from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from .book import BookResponse
from .borrower import BorrowerResponse


class TransactionCreate(BaseModel):
    book_id: int = Field(..., gt=0)
    borrower_id: int = Field(..., gt=0)
    due_date: Optional[datetime] = None


class ReturnRequest(BaseModel):
    transaction_id: int = Field(..., gt=0)


class TransactionResponse(BaseModel):
    transaction_id: int
    book_id: int
    borrower_id: int
    borrow_date: datetime
    due_date: Optional[datetime] = None
    return_date: Optional[datetime] = None
    is_returned: bool
    created_at: Optional[datetime] = None
    book: Optional[BookResponse] = None
    borrower: Optional[BorrowerResponse] = None

    model_config = {"from_attributes": True}


class TransactionListResponse(BaseModel):
    items: List[TransactionResponse]
    total: int
    skip: int
    limit: int


class BorrowResponse(BaseModel):
    message: str
    transaction: TransactionResponse
