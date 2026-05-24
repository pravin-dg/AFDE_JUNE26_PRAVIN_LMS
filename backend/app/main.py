"""FastAPI application entry point — Phase 1 + Phase 2."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config.settings import settings
from .database import create_tables
from .routers import (
    books_router, borrowers_router, transactions_router,
    search_router, dashboard_router,
    etl_router, analytics_router,
)

app = FastAPI(
    title=settings.app_name,
    version="2.0.0",
    description="Modern Library Management System — with ETL Pipeline & Analytics",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Phase 1 routes
app.include_router(books_router, prefix="/api/v1")
app.include_router(borrowers_router, prefix="/api/v1")
app.include_router(transactions_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")

# Phase 2 routes
app.include_router(etl_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")


@app.on_event("startup")
async def on_startup():
    create_tables()


@app.get("/health")
def health():
    return {"status": "ok", "version": "2.0.0"}
