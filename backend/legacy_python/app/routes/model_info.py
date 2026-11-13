from fastapi import APIRouter
from app.schemas import ModelInfoResponse
from app.services import thermal_service

router = APIRouter(prefix="/model", tags=["Model"])

@router.get("/info", response_model=ModelInfoResponse)
def get_model_information():
    """
    Retrieve model metadata, architecture configuration, evaluation metrics,
    and verified limitations.
    """
    return thermal_service.get_model_info()
