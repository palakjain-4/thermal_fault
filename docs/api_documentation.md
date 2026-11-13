# REST API Specification: Deep Learning-Based Thermal Fault Detection

Base URL: `http://localhost:8000/api`  
Interactive OpenAPI Swagger Docs: `http://localhost:8000/docs`  
ReDoc Documentation: `http://localhost:8000/redoc`

---

## Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | System health check (MongoDB connectivity, model version, device) |
| `POST` | `/analyze` | Upload and analyze an infrared/thermal image (multipart form-data) |
| `GET` | `/analyses` | Retrieve historical analysis records with pagination |
| `GET` | `/analyses/{id}` | Retrieve details for a single analysis |
| `DELETE` | `/analyses/{id}` | Delete an analysis record and associated assets |
| `GET` | `/analyses/{id}/report`| Download compiled PDF inspection report |
| `GET` | `/dashboard/stats` | Aggregated metrics, counts, and recent analyses for dashboard |
| `GET` | `/model/info` | Deep learning architecture, classes, dataset info, and evaluation metrics |

---

## Detailed Endpoint Specifications

### 1. Health Check
`GET /api/health`

**Response (`200 OK`):**
```json
{
  "status": "healthy",
  "service": "Deep Learning-Based Thermal Fault Detection",
  "version": "1.0.0",
  "database": {
    "type": "MongoDB",
    "url": "mongodb://localhost:27017",
    "connected": true,
    "status": "online"
  },
  "model": {
    "name": "ResNet18-ThermalTransfer",
    "version": "v1.2.0-trained",
    "isTrainedWeightsAvailable": true,
    "device": "cpu"
  }
}
```

---

### 2. Upload & Analyze Thermal Image
`POST /api/analyze`

**Request Headers:** `Content-Type: multipart/form-data`  
**Request Body:**
- `file`: Binary image file (`image/png`, `image/jpeg`, `image/tiff`, `image/bmp`) up to 15MB.

**Response (`201 Created`):**
```json
{
  "_id": "e4f3a762-b91c-4b7b-8b9a-4c919d389a01",
  "imageFilename": "transformer_bushing_scan.png",
  "rawImageUrl": "/uploads/raw/20261014_133000_e4f3a762_transformer_bushing_scan.png",
  "annotatedImageUrl": "/uploads/annotated/annotated_20261014_133000_e4f3a762_transformer_bushing_scan.png",
  "predictedCondition": "Fault Detected",
  "faultType": "Electrical Fault",
  "confidence": 0.9412,
  "allProbabilities": {
    "Normal": 0.0120,
    "Overheating": 0.0210,
    "Electrical Fault": 0.9412,
    "Insulation Fault": 0.0150,
    "Abnormal Hotspot": 0.0108
  },
  "severity": "High",
  "hotspot": {
    "bounding_box": {
      "x_min": 78,
      "y_min": 82,
      "x_max": 128,
      "y_max": 132,
      "width": 50,
      "height": 50
    },
    "centroid": [103, 107],
    "peak_pixel": [105, 104],
    "peak_intensity": 254.0,
    "mean_intensity": 220.4,
    "area_pixels": 780,
    "area_ratio_percent": 6.8,
    "relative_contrast": 1.42
  },
  "equipmentRoi": {
    "bounding_box": {
      "x_min": 25,
      "y_min": 30,
      "x_max": 285,
      "y_max": 290,
      "width": 260,
      "height": 260
    },
    "area_pixels": 67600,
    "coverage_ratio": 0.66
  },
  "explanation": "High-severity abnormal thermal concentration detected (Electrical Fault). Peak thermal contrast is 142.0% above ambient equipment temperature. Immediate inspection and de-energized diagnostic recommended.",
  "modelVersion": "v1.2.0-trained",
  "modelName": "ResNet18-ThermalTransfer",
  "inferenceTimeMs": 28.5,
  "reportUrl": "/reports/report_20261014_133000_e4f3a762_transformer_bushing_scan.pdf",
  "createdAt": "2026-10-14T13:30:00.123456",
  "isDemoMode": false,
  "temperatureNotice": "Thermal severity is computed using relative thermal contrast and hotspot geometry. Calibrated radiometric sensors are required for absolute temperature readings in Celsius."
}
```

**Error Responses:**
- `400 Bad Request`: Invalid file format, corrupted bytes, or resolution $< 32\times 32$.
- `413 Payload Too Large`: File exceeds 15MB.
- `503 Service Unavailable`: MongoDB is offline (provides diagnostic connection guidance).

---

### 3. Retrieve Historical Analyses
`GET /api/analyses?limit=100&skip=0`

**Response (`200 OK`):** Array of `AnalysisResponse` objects.

---

### 4. Delete Analysis Record
`DELETE /api/analyses/{id}`

**Response (`200 OK`):**
```json
{
  "status": "success",
  "message": "Analysis 'e4f3a762-b91c-4b7b-8b9a-4c919d389a01' deleted successfully."
}
```

---

### 5. Download PDF Inspection Report
`GET /api/analyses/{id}/report`

**Response (`200 OK`):** Binary stream with `Content-Type: application/pdf` and `Content-Disposition: attachment; filename="report_...pdf"`.

---

### 6. Dashboard Statistics
`GET /api/dashboard/stats`

**Response (`200 OK`):**
```json
{
  "totalAnalyzed": 24,
  "normalCount": 16,
  "faultCount": 8,
  "severityBreakdown": {
    "Low": 3,
    "Medium": 3,
    "High": 2,
    "None": 16
  },
  "faultTypeBreakdown": {
    "Normal": 16,
    "Overheating": 2,
    "Electrical Fault": 3,
    "Insulation Fault": 2,
    "Abnormal Hotspot": 1
  },
  "recentAnalyses": [...]
}
```

---

### 7. Model Information & Metrics
`GET /api/model/info`

**Response (`200 OK`):**
```json
{
  "modelName": "ResNet18-ThermalTransfer",
  "version": "v1.2.0-trained",
  "architecture": "ResNet18 with Custom 2-Layer Classification Head",
  "device": "cpu",
  "supportedClasses": [
    "Normal",
    "Overheating",
    "Electrical Fault",
    "Insulation Fault",
    "Abnormal Hotspot"
  ],
  "isTrainedWeightsAvailable": true,
  "isDemoMode": false,
  "datasetInfo": {
    "totalSamples": 158,
    "trainSamples": 94,
    "valSamples": 34,
    "testSamples": 30,
    "splits": "70% Train / 15% Validation / 15% Test",
    "augmentation": "RandomHorizontalFlip, RandomRotation(10 deg), ColorJitter"
  },
  "evaluationMetrics": {
    "accuracy": 0.5000,
    "macro_precision": 0.5210,
    "macro_recall": 0.5000,
    "macro_f1": 0.4824,
    "weighted_f1": 0.4910,
    "confusion_matrix": [[...]]
  },
  "limitations": [
    "Requires radiometric sensor calibration for absolute temperature values in degrees Celsius.",
    "Ambient solar radiation or reflective metallic surfaces can produce false-positive thermal gradients.",
    "Inspection angles greater than 60 degrees can reduce apparent thermal contrast.",
    "Ensure high resolution thermal cameras (>=320x240) for fine-pitch terminal inspections."
  ]
}
```
