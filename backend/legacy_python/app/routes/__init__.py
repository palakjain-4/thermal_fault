from .health import router as health_router
from .analyze import router as analyze_router
from .analyses import router as analyses_router
from .dashboard import router as dashboard_router
from .model_info import router as model_info_router

__all__ = [
    "health_router",
    "analyze_router",
    "analyses_router",
    "dashboard_router",
    "model_info_router"
]
