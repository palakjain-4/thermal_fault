# DEEP LEARNING-BASED THERMAL FAULT DETECTION
### University Engineering Project — Task–4: Core Implementation of the Module (30% Completion Checkpoint)

---

## 1. Executive Summary

This project implements an end-to-end, enterprise-grade, Java-based system for **Deep Learning-Based Thermal Fault Detection** in industrial electrical equipment (switchgear, transformers, busbars, power distribution panels, and high-voltage bolted joints).

The entire backend, image processing pipeline, and neural network inference engine are engineered in **100% pure Java 21** using **Spring Boot 3.x**, **OpenCV Java 4.9.0**, and **ONNX Runtime Java 1.18.0**. Python is strictly omitted from runtime backend execution.

### Key Capabilities Demonstrated (Task–4 Checkpoint):
1. **Thermal Radiometric Intake**: Secure multipart image upload, header/magic-number validation, and payload integrity verification.
2. **OpenCV Java 4.9.0 Preprocessing**: Native Mat image loading, bilateral/Gaussian sensor noise reduction, Contrast Limited Adaptive Histogram Equalization (CLAHE) on the Luminance channel in LAB color space, resolution scaling to $224 \times 224$, and tensor normalization using ImageNet mean/standard deviation.
3. **Equipment ROI & Hotspot Localization**: Automatic thermal contour analysis, bounding box extraction ($[x, y, w, h]$), peak intensity detection, and visual overlay bounding boxes rendered directly onto the enhanced output image.
4. **Deep Learning Model Inference (ONNX Runtime Java)**: ResNet-18 Transfer Learning CNN inference executed on CPU/CoreML via ONNX Runtime Java, delivering fault classification across 5 supported thermodynamic classes:
   - *Normal Condition*
   - *Overheating*
   - *Electrical Fault*
   - *Insulation Fault*
   - *Abnormal Hotspot*
5. **MongoDB Persistence with In-Memory Resilience**: MongoDB document storage (`spring-boot-starter-data-mongodb`) with automatic graceful fallback to an in-memory cached repository if MongoDB is offline.
6. **Automated Diagnostic PDF Generation (OpenPDF)**: Downloadable university engineering inspection reports generated natively with embedded radiometric imagery, hotspot coordinate telemetry, severity matrices, and academic disclaimers.
7. **Fairy-Pink Feminine UI/UX**: Professional, soft aesthetic styled strictly with approved hex codes (`#FFDBDB`, `#FDC3D1`, `#FDA8BF`, `#FB8CAC`, `#FFFFFF`), Cormorant Garamond / Playfair Display serif typography, delicate badges, and responsive views.

---

## 2. Technology Stack

| Layer | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Language** | Java | 21 (LTS) | Core backend logic, multi-threading, tensor memory management |
| **Framework** | Spring Boot | 3.3.4 | RESTful microservice API, validation, multipart parsing |
| **Build Tool** | Apache Maven | 3.9.x | Dependency management and JAR packaging |
| **Computer Vision** | OpenCV Java (`org.openpnp:opencv`) | 4.9.0-0 | Mat manipulations, Gaussian blur, CLAHE, contour analysis |
| **Deep Learning** | ONNX Runtime Java (`com.microsoft.onnxruntime`) | 1.18.0 | Native tensor allocation, session inference, softmax classification |
| **Database** | MongoDB / Spring Data MongoDB | 9.0.x / 4.3.4 | Inspection record documents, bounding box telemetry, JSON audit logs |
| **Reporting** | OpenPDF (`com.github.librepdf:openpdf`) | 1.3.40 | Native PDF generation with side-by-side thermal figures & telemetry |
| **Frontend UI** | React.js + Vite + Tailwind CSS | React 18 / Vite 5 | SPA with Fairy-Pink theme, charts, file drag-and-drop, and split views |

---

## 3. Project Directory Structure

```text
thermal-fault-detection/
│
├── frontend/                                # React.js + Vite Web Application
│   ├── src/
│   │   ├── components/                     # Reusable UI elements (Navbar, StatCard, Chart, Badges)
│   │   ├── pages/                          # Dashboard, Upload, Preprocessing, Results, History, ModelInfo
│   │   ├── services/                       # API communication client (fetch, multipart upload)
│   │   ├── styles/                         # Tailwind CSS and Fairy Pink variables
│   │   ├── App.jsx                         # Main application router and state management
│   │   └── main.jsx                        # React root entry point
│   ├── capture_screenshots.cjs             # Automated headless Chrome screenshot generator
│   ├── package.json                        # Frontend dependencies
│   ├── tailwind.config.js                  # Fairy pink color scheme definitions
│   └── vite.config.js                      # Dev server and backend reverse proxy configuration
│
├── backend/                                 # 100% Java & Spring Boot Application
│   ├── src/main/java/com/thermalfaultdetection/
│   │   ├── config/                         # WebConfig (CORS/Static), ModelConfig, StorageProperties, MongoConfig
│   │   ├── controller/                     # REST API Endpoints (/api/analyze, /api/preprocess, /api/health)
│   │   ├── dto/                            # API Data Transfer Objects (Requests, Responses, Stats, Errors)
│   │   ├── exception/                      # Global exception handler & domain exception definitions
│   │   ├── imageprocessing/                # OpenCV ImageProcessingService (Mat, CLAHE, Gaussian blur, ROI)
│   │   ├── ml/                             # ONNX ModelLoader, InferenceService, ModelService
│   │   ├── model/                          # MongoDB Document entities & Domain enums (AnalysisStatus, FaultSeverity)
│   │   ├── repository/                     # Repository interfaces, Spring Data Mongo, In-Memory fallback
│   │   ├── service/                        # AnalysisService, FileStorageService, ReportService (OpenPDF)
│   │   └── ThermalFaultDetectionApplication.java  # Spring Boot Main Application entry
│   ├── src/main/resources/
│   │   ├── application.properties          # Environment and model configurations
│   │   ├── models/                         # Serialized ONNX model weights (thermal_resnet18.onnx)
│   │   └── static/                         # Production build of the React frontend
│   ├── src/test/java/                      # JUnit 5 test suite (ImageProcessingTest, InferenceTest)
│   ├── uploads/                            # Stored raw and processed thermal imagery
│   ├── reports/                            # Generated PDF diagnostic reports
│   └── pom.xml                             # Maven build and dependency definition
│
├── sample_data/                            # Real thermal infrared sample PNG images for all 5 classes
├── screenshots/                            # Actual screenshots captured from the running application
├── reports/                                # Sample generated PDF engineering diagnostic reports
└── README.md                               # Comprehensive documentation
```

---

## 4. REST API Specification

| HTTP Method | Endpoint | Description | Request Payload | Response Body |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Backend & model health check | None | `{ "status": "UP", "opencv_loaded": true, "model_configured": true, ... }` |
| `POST` | `/api/analyze` | Full thermal diagnosis workflow | `multipart/form-data` (`file`) | `AnalysisResponse` (Fault, Confidence, Hotspot coords, Bbox) |
| `POST` | `/api/preprocess` | OpenCV preprocessing comparison | `multipart/form-data` (`file`) | `PreprocessingResponse` (Original & Processed dims, pipeline steps) |
| `GET` | `/api/analyses` | Historical inspection records | Query params (`limit`, `skip`) | `List<AnalysisResponse>` |
| `GET` | `/api/analyses/{id}` | Single analysis telemetry | Path param (`id`) | `AnalysisResponse` |
| `DELETE` | `/api/analyses/{id}` | Delete analysis record and assets | Path param (`id`) | `{ "success": true, "message": "..." }` |
| `GET` | `/api/dashboard/stats` | Aggregate dashboard statistics | None | `DashboardStatsResponse` (Totals, Fault rate, Distribution) |
| `GET` | `/api/model/info` | ONNX model intelligence & specs | None | `ModelInfoResponse` (Backbone, Framework, Classes, Metrics) |
| `GET` | `/api/analyses/{id}/report` | Download diagnostic PDF report | Path param (`id`) | PDF file stream (`application/pdf`) |

---

## 5. Step-by-Step Execution Guide

### Prerequisites
- **Java 21 LTS** (e.g., Eclipse Adoptium Temurin 21)
- **Apache Maven 3.9+**
- **Node.js 18+ and npm**
- **MongoDB** (Optional: the system gracefully falls back to persistent in-memory caching if MongoDB is offline)

### Step 1: Verify Environment Versions
```bash
# Check Java Version (Must be 21)
export JAVA_HOME=/Library/Java/JavaVirtualMachines/temurin-21.jdk/Contents/Home
export PATH="$JAVA_HOME/bin:$PATH"
java -version
javac -version

# Check Maven Version
mvn -version

# Check Node & npm
node -v
npm -v
```

### Step 2: Build the Spring Boot Backend
```bash
cd backend
mvn clean compile
mvn test
mvn package -DskipTests
```

### Step 3: Run the Java Backend
```bash
cd backend
# Run via packaged Spring Boot FAT jar on port 8000
java -jar target/thermal-fault-detection-backend-1.0.0.jar

# Or run via Maven Spring Boot plugin
mvn spring-boot:run
```
*The Spring Boot server will bind to `http://localhost:8000` and automatically load the packaged React frontend as well.*

### Step 4: Install & Run React Frontend (Development Mode)
```bash
cd frontend
npm install
npm run dev
```
*Frontend dev server runs at `http://localhost:5173` with instant hot-reloading proxying API calls to port `8000`.*

### Step 5: Test REST API Endpoints via cURL
```bash
# 1. Health check
curl -s http://localhost:8000/api/health

# 2. Model Specifications
curl -s http://localhost:8000/api/model/info

# 3. OpenCV Preprocessing API
curl -s -X POST -F "file=@../sample_data/sample_overheating_1.png" http://localhost:8000/api/preprocess

# 4. Full Deep Learning Analysis Workflow
curl -s -X POST -F "file=@../sample_data/sample_overheating_1.png" http://localhost:8000/api/analyze

# 5. Dashboard Statistics
curl -s http://localhost:8000/api/dashboard/stats

# 6. Error Handling Verification (Invalid File Format)
curl -s -X POST -F "file=@../README.md" http://localhost:8000/api/analyze
```

---

## 6. Screenshots of Running Application (Task–4 University Submission)

The following screenshots are real visual captures generated from the live React application connected directly to the Java Spring Boot backend:

| Screen # | Milestone Screen | File Location | Key Validated Features |
| :---: | :--- | :--- | :--- |
| **1** | **Studio Dashboard** | `screenshots/01_dashboard.png` | Aggregate metrics cards, normal vs fault count, fault distribution bar chart, recent analyses audit table. |
| **2** | **Thermal Image Upload & Preview** | `screenshots/02_thermal_image_upload_preview.png` | File drop zone, browse button, image preview card, file size/metadata badges, clear button. |
| **3** | **OpenCV Preprocessing (Original vs. Processed)** | `screenshots/03_original_vs_processed.png` | Real-time OpenCV CLAHE gradient equalization, original dimensions ($320 \times 320$) vs. processed ($224 \times 224$), step-by-step pipeline log. |
| **4** | **Core Analysis Workflow** | `screenshots/04_core_analysis_workflow.png` | Dynamic animated progress state showing noise filtering, ROI segmentation, and ONNX Runtime inference execution. |
| **5** | **Diagnostic Analysis Result** | `screenshots/05_analysis_result.png` | Class condition banner, ResNet-18 confidence score (99.9%), hotspot $[x, y, w, h]$ telemetry, severity badge, and PDF download button. |
| **6** | **Upload Error Handling** | `screenshots/06_error_handling_invalid_upload.png` | Graceful client/server validation alert rejecting invalid non-image files with structured HTTP 400 responses. |

---

## 7. Automated PDF Report Generation (OpenPDF)

Every executed analysis automatically produces a university engineering diagnostic report saved under `reports/` and downloadable on-demand via the web UI or `/api/analyses/{id}/report`.

### Report Sections:
1. **Header**: "DEEP LEARNING-BASED THERMAL FAULT DETECTION — Task–4 Inspection Report".
2. **Metadata Table**: Analysis ID, Timestamp, Filename, Model Architecture (`ResNet-18 Transfer Learning`), Classified Condition, Confidence, and Assessed Severity.
3. **Imagery Comparison**: Side-by-side inclusion of the raw acquisition image and the OpenCV-enhanced image annotated with the detected hotspot bounding box.
4. **Hotspot Coordinate Telemetry**: Table of detected anomalous regions ($X, Y, \text{Width}, \text{Height}$), peak sensor intensity, and pixel area.
5. **Academic Disclaimer**: Notes clarifying that 8-bit colorized infrared imagery requires physical thermographer validation before maintenance intervention.

---

## 8. Authors & Academic Integrity

- **Project**: Deep Learning-Based Thermal Fault Detection
- **Milestone**: Project Task–4: Core Implementation of the Module (30% Progress Checkpoint)
- **Primary Languages**: Java 21, JavaScript (React.js)
- **Frameworks**: Spring Boot 3.3.4, OpenCV Java 4.9.0, ONNX Runtime Java 1.18.0, OpenPDF 1.3.40
