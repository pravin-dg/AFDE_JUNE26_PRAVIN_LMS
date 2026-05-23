from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime


class BookBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    author: str = Field(..., min_length=1, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    isbn: str = Field(..., min_length=10, max_length=20)
    description: Optional[str] = Field(None, max_length=1000)
    publisher: Optional[str] = Field(None, max_length=255)
    published_year: Optional[int] = Field(None, ge=1000, le=2100)
    cover_color: Optional[str] = Field(None, max_length=20)


class BookCreate(BookBase):
    availability_status: bool = True


class BookUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    author: Optional[str] = Field(None, min_length=1, max_length=255)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    isbn: Optional[str] = Field(None, min_length=10, max_length=20)
    description: Optional[str] = Field(None, max_length=1000)
    publisher: Optional[str] = Field(None, max_length=255)
    published_year: Optional[int] = Field(None, ge=1000, le=2100)
    cover_color: Optional[str] = Field(None, max_length=20)
    availability_status: Optional[bool] = None


class BookResponse(BookBase):
    book_id: int
    availability_status: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class BookListResponse(BaseModel):
    items: List[BookResponse]
    total: int
    skip: int
    limit: int
