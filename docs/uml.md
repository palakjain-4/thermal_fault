# UML System Diagrams: Deep Learning-Based Thermal Fault Detection

## 1. UML Use-Case Diagram

```mermaid
flowchart LR
    subgraph Actors
        Tech["Field Maintenance Technician"]
        Engineer["Reliability / Electrical Engineer"]
        SystemAdmin["Maintenance Supervisor"]
    end

    subgraph System["Thermal Fault Detection System"]
        UC1(["Upload Thermal / Infrared Image"])
        UC2(["Inspect Dual-View Thermal Overlay"])
        UC3(["Review Fault Classification & Severity"])
        UC4(["Download Official PDF Diagnostic Report"])
        UC5(["Browse Historical Inspection Records"])
        UC6(["Delete Analysis Record"])
        UC7(["Review Model Architecture & Evaluation Metrics"])
        UC8(["Retrain Deep Learning Model on New Scans"])
        UC9(["Monitor Real-Time Database & Backend Health"])
    end

    Tech --> UC1
    Tech --> UC2
    Tech --> UC3
    Tech --> UC4
    Tech --> UC5

    Engineer --> UC2
    Engineer --> UC3
    Engineer --> UC4
    Engineer --> UC5
    Engineer --> UC7
    Engineer --> UC8

    SystemAdmin --> UC5
    SystemAdmin --> UC6
    SystemAdmin --> UC7
    SystemAdmin --> UC9
```

---

## 2. UML Class Diagram

This diagram reflects the actual Python classes and relationships implemented in the codebase.

```mermaid
classDiagram
    class MongoDatabase {
        -client: MongoClient
        -db: Database
        +connect() Tuple~bool, str~
        +is_connected() bool
        +get_collection() Collection
        +close() void
    }

    class AnalysisRepository {
        -db_manager: MongoDatabase
        +create(record: dict) dict
        +get_by_id(analysis_id: str) dict
        +list_all(limit: int, skip: int) list
        +delete(analysis_id: str) bool
        +get_stats() dict
        -_format_doc(doc: dict) dict
    }

    class ThermalResNet {
        +backbone: ResNet
        +forward(x: Tensor) Tensor
    }

    class ThermalInferenceEngine {
        +device: str
        +classes: list~str~
        +model: ThermalResNet
        +is_trained: bool
        +metadata: dict
        +run_inference(file_bytes: bytes, filename: str, annotated_save_path: Path) dict
        +estimate_severity(predicted_class: str, hotspot_info: dict, confidence: float) Tuple~str, str~
        +reload_weights() void
    }

    class ThermalService {
        -inference: ThermalInferenceEngine
        -repo: AnalysisRepository
        +analyze_image(file_bytes: bytes, filename: str) dict
        +get_analysis_by_id(analysis_id: str) dict
        +list_analyses(limit: int, skip: int) list
        +delete_analysis(analysis_id: str) bool
        +get_dashboard_stats() dict
        +get_model_info() dict
    }

    class PreprocessingPipeline {
        <<module>>
        +validate_thermal_image(file_bytes: bytes) Tuple~bool, str, ndarray~
        +extract_thermal_intensity(img_bgr: ndarray) ndarray
        +denoise_thermal_image(intensity_map: ndarray) ndarray
        +enhance_contrast(intensity_map: ndarray) ndarray
        +detect_equipment_roi(enhanced_img: ndarray) dict
        +detect_hotspots(intensity_map: ndarray, equipment_roi: dict) dict
        +generate_annotated_overlay(...) Path
        +prepare_model_tensor(img_bgr: ndarray) Tensor
    }

    class ReportService {
        <<module>>
        +generate_pdf_report(analysis_data: dict, raw_path: Path, annotated_path: Path, out_path: Path) Path
    }

    ThermalService --> ThermalInferenceEngine : delegates inference
    ThermalService --> AnalysisRepository : delegates persistence
    ThermalService --> ReportService : generates reports
    ThermalInferenceEngine --> ThermalResNet : executes forward pass
    ThermalInferenceEngine --> PreprocessingPipeline : executes image transformations
    AnalysisRepository --> MongoDatabase : queries collections
```

---

## 3. UML Sequence Diagram: End-to-End Analysis Workflow

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Technician
    participant UI as React Frontend
    participant API as FastAPI Router (/api/analyze)
    participant Service as ThermalService
    participant Preproc as Preprocessing Pipeline
    participant CNN as ResNet-18 Model
    participant PDF as ReportService
    participant DB as MongoDB Repository

    User->>UI: Selects or drops thermal image (.png/.jpg)
    UI->>API: POST /api/analyze (multipart/form-data)
    
    API->>API: Validate file extension & size (<= 15MB)
    API->>Service: analyze_image(file_bytes, filename)
    
    Service->>Preproc: validate_thermal_image(file_bytes)
    Preproc-->>Service: Valid, decoded BGR image
    
    Service->>Preproc: extract_intensity + denoise + CLAHE
    Preproc-->>Service: Enhanced thermal gradient map
    
    Service->>Preproc: detect_equipment_roi(enhanced_map)
    Preproc-->>Service: Equipment ROI bounding box & contour
    
    Service->>CNN: forward(prepare_model_tensor(img_bgr))
    CNN-->>Service: Class logits & Softmax probabilities
    
    Service->>Preproc: detect_hotspots(denoised_map, equipment_roi)
    Preproc-->>Service: Hotspot bounding box, centroid, peak pixel
    
    Service->>Service: estimate_severity(class, hotspot, confidence)
    
    Service->>Preproc: generate_annotated_overlay(...)
    Preproc-->>Service: Annotated image written to uploads/annotated/
    
    Service->>PDF: generate_pdf_report(...)
    PDF-->>Service: PDF report written to reports/
    
    Service->>DB: create(analysis_record)
    alt MongoDB Online
        DB-->>Service: Record inserted with _id
        Service-->>API: AnalysisResponse JSON
        API-->>UI: HTTP 201 Created (Analysis data)
        UI-->>User: Displays dual-view results, overlays & report button
    else MongoDB Offline
        DB-->>Service: MongoDBConnectionError
        Service-->>API: Raise 503 Service Unavailable
        API-->>UI: HTTP 503 (Clear database offline diagnosis)
        UI-->>User: Displays actionable MongoDB connection error modal
    end
```
