from .books import router as books_router
from .borrowers import router as borrowers_router
from .transactions import router as transactions_router
from .search import router as search_router
from .dashboard import router as dashboard_router
__all__ = ["books_router", "borrowers_router", "transactions_router", "search_router", "dashboard_router"]
