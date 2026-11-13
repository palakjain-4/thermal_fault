from pathlib import Path
from typing import List
from fastapi import APIRouter, HTTPException, status, Query
from fastapi.responses import FileResponse
from app.schemas import AnalysisResponse
from app.services import thermal_service
from app.database import MongoDBConnectionError

router = APIRouter(prefix="/analyses", tags=["Analyses"])

@router.get("", response_model=List[AnalysisResponse])
def get_analyses(
    limit: int = Query(100, ge=1, le=500),
    skip: int = Query(0, ge=0)
):
    """Retrieve historical analysis records."""
    try:
        return thermal_service.list_analyses(limit=limit, skip=skip)
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


@router.get("/{analysis_id}", response_model=AnalysisResponse)
def get_analysis_by_id(analysis_id: str):
    """Retrieve a single thermal analysis record by ID."""
    try:
        record = thermal_service.get_analysis_by_id(analysis_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis record with ID '{analysis_id}' not found."
            )
        return record
    except MongoDBConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": "Database Connection Failure", "message": e.message}
        )


@router.delete("/{analysis_id}", status_code=status.HTTP_200_OK)
def delete_analysis(analysis_id: str):
    """Delete an analysis record and associated assets."""
    try:
        deleted = thermal_service.delete_analysis(analysis_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis with ID '{analysis_id}' not found or already deleted."
            )
        return {"status": "success", "message": f"Analysis '{analysis_id}' deleted successfully."}
    except MongoDBConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": "Database Connection Failure", "message": e.message}
        )


@router.get("/{analysis_id}/report")
def download_analysis_report(analysis_id: str):
    """Download the generated PDF inspection report for this analysis."""
    try:
        record = thermal_service.get_analysis_by_id(analysis_id)
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Analysis with ID '{analysis_id}' not found."
            )
        report_path_str = record.get("reportPath")
        if not report_path_str or not Path(report_path_str).exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PDF report file is not available for this analysis."
            )
        return FileResponse(
            path=report_path_str,
            filename=Path(report_path_str).name,
            media_type="application/pdf"
        )
    except MongoDBConnectionError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={"error": "Database Connection Failure", "message": e.message}
        )
