from fastapi import APIRouter, HTTPException, status
from app.schemas import DashboardStatsResponse
from app.services import thermal_service
from app.database import MongoDBConnectionError

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_statistics():
    """Retrieve summarized statistics and KPIs for dashboard overview."""
    try:
        return thermal_service.get_dashboard_stats()
    except MongoDBConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "Database Connection Failure",
                "message": e.message,
                "diagnostic": e.details
            }
        )
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
