"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .config.settings import settings
from .database import create_tables
from .routers import books_router, borrowers_router, transactions_router, search_router, dashboard_router

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Modern Library Management System API",
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

app.include_router(books_router, prefix="/api/v1")
app.include_router(borrowers_router, prefix="/api/v1")
app.include_router(transactions_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(dashboard_router, prefix="/api/v1")


@app.on_event("startup")
async def on_startup():
    create_tables()


@app.get("/")
async def root():
    return {"message": f"Welcome to {settings.app_name} API", "version": settings.app_version, "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "healthy"}
