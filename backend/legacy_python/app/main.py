import logging
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import mongo_db, MongoDBConnectionError
from app.routes import (
    health_router,
    analyze_router,
    analyses_router,
    dashboard_router,
    model_info_router,
)
from ml.dataset_generator import generate_benchmark_dataset

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s"
)
logger = logging.getLogger("thermal_fault")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=(
        "End-to-end API for infrared thermographic inspection, "
        "equipment ROI segmentation, deep learning fault classification, "
        "hotspot localization, severity estimation, and automated PDF reporting."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Static Files for Uploaded & Annotated Images and PDF Reports
app.mount("/uploads", StaticFiles(directory=str(settings.UPLOAD_DIR)), name="uploads")
app.mount("/reports", StaticFiles(directory=str(settings.REPORTS_DIR)), name="reports")

# Include Routers under /api
app.include_router(health_router, prefix=settings.API_PREFIX)
app.include_router(analyze_router, prefix=settings.API_PREFIX)
app.include_router(analyses_router, prefix=settings.API_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_PREFIX)
app.include_router(model_info_router, prefix=settings.API_PREFIX)

@app.exception_handler(MongoDBConnectionError)
async def mongodb_exception_handler(request: Request, exc: MongoDBConnectionError):
    return JSONResponse(
        status_code=503,
        content={
            "error": "MongoDB Connection Failure",
            "message": exc.message,
            "details": exc.details,
            "recommendation": (
                "Ensure local MongoDB service is running via 'brew services start mongodb-community' "
                "or 'mongod --dbpath <data_dir>'."
            )
        }
    )

@app.on_event("startup")
async def startup_event():
    logger.info("Initializing Thermal Fault Detection Backend...")
    # Check MongoDB connectivity
    connected, err = mongo_db.connect()
    if connected:
        logger.info(f"MongoDB connection established at {settings.MONGODB_URL}")
    else:
        logger.warning(
            f"MongoDB connection notice: {err}. "
            "Database endpoints will return clear 503 errors until MongoDB is running."
        )

    # Ensure test sample images are available
    samples_dir = settings.DATA_DIR / "samples"
    if not samples_dir.exists() or len(list(samples_dir.glob("*.png"))) == 0:
        logger.info("Generating synthetic thermal benchmark images in data/samples...")
        try:
            generate_benchmark_dataset(settings.DATA_DIR, samples_per_class=10)
        except Exception as e:
            logger.warning(f"Could not auto-generate initial sample images: {e}")

    logger.info("Application startup complete. API documentation available at /docs.")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down application...")
    mongo_db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
