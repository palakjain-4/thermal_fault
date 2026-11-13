from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class BoundingBox(BaseModel):
    x_min: int
    y_min: int
    x_max: int
    y_max: int
    width: int
    height: int

class HotspotData(BaseModel):
    bounding_box: BoundingBox
    centroid: List[int] = Field(..., description="[x, y] coordinates of hotspot centroid")
    peak_pixel: List[int] = Field(..., description="[x, y] coordinates of maximum thermal intensity")
    peak_intensity: float
    mean_intensity: float
    area_pixels: int
    area_ratio_percent: float
    relative_contrast: float

class EquipmentRoi(BaseModel):
    bounding_box: BoundingBox
    area_pixels: int
    coverage_ratio: float

class AnalysisResponse(BaseModel):
    id: str = Field(..., alias="_id", description="Unique analysis record identifier")
    imageFilename: str
    rawImageUrl: str
    annotatedImageUrl: Optional[str] = None
    predictedCondition: str = Field(..., description="'Normal' or 'Fault Detected'")
    faultType: str = Field(..., description="Detected fault classification")
    confidence: float = Field(..., ge=0.0, le=1.0)
    allProbabilities: Dict[str, float] = Field(default_factory=dict)
    severity: Optional[str] = Field(None, description="'Low', 'Medium', 'High', or 'None'")
    hotspot: Optional[HotspotData] = None
    equipmentRoi: Optional[EquipmentRoi] = None
    explanation: str
    modelVersion: str
    modelName: str
    inferenceTimeMs: float
    reportUrl: Optional[str] = None
    createdAt: str
    isDemoMode: bool = False
    temperatureNotice: str = (
        "Thermal severity is computed using relative thermal contrast and hotspot geometry. "
        "Calibrated radiometric sensors are required for absolute temperature readings in Celsius."
    )

    class Config:
        populate_by_name = True

class DashboardStatsResponse(BaseModel):
    totalAnalyzed: int
    normalCount: int
    faultCount: int
    severityBreakdown: Dict[str, int]
    faultTypeBreakdown: Dict[str, int]
    recentAnalyses: List[AnalysisResponse]

class ModelInfoResponse(BaseModel):
    modelName: str
    version: str
    architecture: str
    device: str
    supportedClasses: List[str]
    isTrainedWeightsAvailable: bool
    isDemoMode: bool
    datasetInfo: Dict[str, Any]
    evaluationMetrics: Dict[str, Any]
    limitations: List[str]
