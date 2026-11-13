# Data Flow Diagrams (DFD): Deep Learning-Based Thermal Fault Detection

## 1. DFD Level 0: Context Diagram

The Level 0 context diagram defines the boundary of the thermal inspection system, showing external entities and primary information exchanges.

```mermaid
flowchart LR
    Technician["Technician / Inspector"]
    System(["0.0\nThermal Fault Detection System"])
    MongoDB[("MongoDB Database")]
    FileSystem[("File Storage System\n(Uploads & Reports)")]

    Technician -->|Thermal Image Upload| System
    Technician -->|Inspection Query / Filter| System
    Technician -->|Report Download Request| System

    System -->|Visual Diagnostic Results & Overlays| Technician
    System -->|PDF Inspection Report| Technician
    System -->|Historical Inspection Logs| Technician
    System -->|Dashboard Analytics & Health Status| Technician

    System -->|Persist Analysis Metadata & Predictions| MongoDB
    MongoDB -->|Retrieve History & KPI Stats| System

    System -->|Store Raw & Annotated Scans, PDFs| FileSystem
    FileSystem -->|Serve Rendered Imagery & Documents| System
```

---

## 2. DFD Level 1: Data Flow Diagram

The Level 1 DFD decomposes the system into discrete sub-processes, identifying internal data stores and data transformations.

```mermaid
flowchart TD
    User["Technician / User"]

    subgraph Processes["System Sub-Processes"]
        P1["1.0 Validate & Store Image"]
        P2["2.0 Preprocess & Enhance Gradients"]
        P3["3.0 Segment Equipment ROI"]
        P4["4.0 Classify Fault with ResNet-18"]
        P5["5.0 Localize Hotspots & Estimate Severity"]
        P6["6.0 Generate Annotated Overlay & PDF"]
        P7["7.0 Persist & Aggregate Analytics"]
    end

    subgraph DataStores["Data Stores"]
        DS_Raw[("D1: Raw Images")]
        DS_Annotated[("D2: Annotated Overlays")]
        DS_Reports[("D3: PDF Reports")]
        DS_Weights[("D4: Model Checkpoints & Metadata")]
        DS_Mongo[("D5: MongoDB Analysis Collection")]
    end

    %% Process 1
    User -->|Thermal Image File| P1
    P1 -->|Store Raw Scan| DS_Raw
    P1 -->|Decoded Image Matrix| P2

    %% Process 2
    P2 -->|Denoised & CLAHE Enhanced Map| P3
    P2 -->|Normalized Tensor| P4

    %% Process 3
    P3 -->|Equipment ROI Mask & Bounds| P5

    %% Process 4
    DS_Weights -->|Model Weights & Config| P4
    P4 -->|Class Probabilities & Prediction| P5

    %% Process 5
    P5 -->|Hotspot Bounding Box & Severity| P6

    %% Process 6
    P6 -->|Save Overlay Image| DS_Annotated
    P6 -->|Save Compiled PDF| DS_Reports
    P6 -->|Rendered Result Package| P7

    %% Process 7
    P7 -->|Insert Record Document| DS_Mongo
    DS_Mongo -->|Query History & Stats| P7
    P7 -->|Present Analysis Cards & Reports| User
```
