from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


class BorrowerBase(BaseModel):
    borrower_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)


class BorrowerCreate(BorrowerBase):
    pass


class BorrowerUpdate(BaseModel):
    borrower_name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    address: Optional[str] = Field(None, max_length=500)


class BorrowerResponse(BorrowerBase):
    borrower_id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    active_borrows: Optional[int] = 0

    model_config = {"from_attributes": True}


class BorrowerListResponse(BaseModel):
    items: List[BorrowerResponse]
    total: int
    skip: int
    limit: int
