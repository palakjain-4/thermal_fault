from fastapi import APIRouter
from app.config import settings
from app.database import mongo_db
from ml.inference import inference_engine

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    """System health check endpoint verifying database connectivity and ML readiness."""
    db_connected = mongo_db.is_connected()
    return {
        "status": "healthy" if db_connected else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": {
            "type": "MongoDB",
            "url": settings.MONGODB_URL,
            "connected": db_connected,
            "status": "online" if db_connected else "offline"
        },
        "model": {
            "name": inference_engine.metadata.get("modelName", settings.DEFAULT_MODEL_NAME),
            "version": inference_engine.metadata.get("version", settings.MODEL_VERSION),
            "isTrainedWeightsAvailable": inference_engine.is_trained,
            "device": inference_engine.device,
        }
    }
