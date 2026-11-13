# Database Schema Documentation: MongoDB

## Database Overview

- **Database Name:** `thermal_fault_db`
- **Default Collection:** `analyses`
- **Storage Strategy:** File paths and structured numerical/vector metadata are stored in MongoDB. Raw images, annotated diagnostic overlays, and compiled PDF reports are stored in local filesystem volumes (`uploads/raw/`, `uploads/annotated/`, `reports/`) to maintain optimal BSON performance.

---

## Document Schema Definition

Each record inserted into `analyses` conforms to the following BSON document specification:

| Field Name | BSON Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `_id` | `ObjectId` or `String` | Yes | Unique analysis record identifier (UUID string or MongoDB ObjectId) |
| `imageFilename` | `String` | Yes | Sanitized original filename of uploaded scan |
| `rawImagePath` | `String` | Yes | Filesystem path to the stored original image |
| `rawImageUrl` | `String` | Yes | Public HTTP endpoint URL to view original image |
| `annotatedImagePath` | `String` | No | Filesystem path to generated diagnostic overlay |
| `annotatedImageUrl` | `String` | No | Public HTTP endpoint URL to view overlay |
| `reportPath` | `String` | No | Filesystem path to generated PDF inspection report |
| `reportUrl` | `String` | No | Public HTTP endpoint URL to download PDF report |
| `predictedCondition`| `String` | Yes | Evaluated condition: `"Normal"` or `"Fault Detected"` |
| `faultType` | `String` | Yes | Classification category: `"Normal"`, `"Overheating"`, `"Electrical Fault"`, `"Insulation Fault"`, `"Abnormal Hotspot"` |
| `confidence` | `Double` | Yes | Model softmax prediction probability ($0.0 \le c \le 1.0$) |
| `allProbabilities` | `Object` | No | Key-value dictionary of softmax probabilities for all supported classes |
| `severity` | `String` | No | Severity level: `"Low"`, `"Medium"`, `"High"`, or `null` for Normal |
| `hotspot` | `Object` | No | Hotspot localization geometry and intensity data (omitted if Normal) |
| `hotspot.bounding_box` | `Object` | No | Bounding coordinates: `x_min`, `y_min`, `x_max`, `y_max`, `width`, `height` |
| `hotspot.centroid` | `Array[Int]` | No | $[c_x, c_y]$ coordinates of hotspot area center |
| `hotspot.peak_pixel` | `Array[Int]` | No | $[p_x, p_y]$ coordinates of maximum thermal intensity point |
| `hotspot.peak_intensity` | `Double` | No | Maximum pixel value in hotspot region ($0..255$) |
| `hotspot.relative_contrast` | `Double` | No | Ratio of peak intensity elevation above ambient equipment baseline |
| `hotspot.area_pixels` | `Int` | No | Total pixels occupied by the segmented hotspot |
| `hotspot.area_ratio_percent`| `Double` | No | Percentage of equipment ROI occupied by the hotspot |
| `equipmentRoi` | `Object` | No | Segmented electrical equipment boundary |
| `equipmentRoi.bounding_box`| `Object` | No | Equipment boundary coordinates |
| `equipmentRoi.area_pixels` | `Int` | No | Area of segmented equipment |
| `equipmentRoi.coverage_ratio`| `Double` | No | Fraction of camera frame occupied by equipment |
| `explanation` | `String` | Yes | Plain-text technical engineering interpretation |
| `modelName` | `String` | Yes | Identifier of the inference model (e.g. `"ResNet18-ThermalTransfer"`) |
| `modelVersion` | `String` | Yes | Semantic version string of model checkpoint (e.g. `"v1.2.0-trained"`) |
| `inferenceTimeMs` | `Double` | Yes | Total execution time of the inference pipeline in milliseconds |
| `isDemoMode` | `Boolean` | Yes | Flag indicating whether weights were trained (`false`) or demo/untrained (`true`) |
| `createdAt` | `String` / `Date` | Yes | ISO 8601 UTC timestamp of analysis completion |

---

## Recommended MongoDB Indexes

For high-throughput inspection archives, configure the following indexes:

```javascript
// 1. Fast sorting for dashboard and pagination
db.analyses.createIndex({ "createdAt": -1 });

// 2. Querying by condition and severity
db.analyses.createIndex({ "predictedCondition": 1, "severity": 1 });

// 3. Filtering by fault classification
db.analyses.createIndex({ "faultType": 1 });

// 4. Case-insensitive search on filenames
db.analyses.createIndex({ "imageFilename": "text" });
```
