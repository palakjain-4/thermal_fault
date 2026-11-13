import os
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, status
from app.config import settings
from app.schemas import AnalysisResponse
from app.services import thermal_service
from app.database import MongoDBConnectionError

router = APIRouter(tags=["Analysis"])

@router.post("/analyze", response_model=AnalysisResponse, status_code=status.HTTP_201_CREATED)
async def analyze_thermal_image(file: UploadFile = File(...)):
    """
    Upload and analyze an infrared / thermal image.
    Executes end-to-end preprocessing, equipment ROI detection,
    deep learning fault classification, hotspot detection, and PDF report creation.
    """
    # 1. Filename & Extension Validation
    filename = file.filename or "uploaded_image.png"
    ext = Path(filename).suffix.lower()
    if ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"Unsupported file format '{ext}'. Supported formats: "
                f"{', '.join(settings.ALLOWED_EXTENSIONS)}"
            )
        )

    # 2. Read File Bytes with Size Check
    content = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum permitted limit of {settings.MAX_UPLOAD_SIZE_MB}MB."
        )

    if len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    # 3. Execute Analysis & Database Storage
    try:
        result = thermal_service.analyze_image(file_bytes=content, filename=filename)
        return result
    except MongoDBConnectionError as e:
        # Prompt requirement: show clear connection error instead of pretending it saved
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "error": "Database Connection Failure",
                "message": e.message,
                "diagnostic": e.details or "Ensure MongoDB is running at the configured URL.",
            }
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image processing error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal analysis pipeline error: {str(e)}"
        )
