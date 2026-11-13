package com.thermalfaultdetection.dto;

import com.thermalfaultdetection.model.AnalysisDocument;
import com.thermalfaultdetection.model.AnalysisStatus;
import com.thermalfaultdetection.model.HotspotData;

import java.time.Instant;
import java.util.List;
import java.util.Map;

public class AnalysisResponse {
    private String id;
    private String analysisId;
    private String filename;
    private String imageFilename;
    private String originalImageUrl;
    private String processedImageUrl;
    private String rawImageUrl;
    private String annotatedImageUrl;
    private Instant createdAt;
    private String condition;
    private String predictedCondition;
    private String faultCategory;
    private String faultType;
    private Double confidence;
    private String severity;
    private HotspotData hotspot;
    private List<HotspotData> allHotspots;
    private String modelVersion;
    private AnalysisStatus status;
    private String originalDimensions;
    private String processedDimensions;
    private Map<String, Double> classProbabilities;
    private String reportUrl;
    private String notes;
    private double inferenceTimeMs = 12.0;

    public AnalysisResponse() {
    }

    public static AnalysisResponse fromDocument(AnalysisDocument doc) {
        AnalysisResponse resp = new AnalysisResponse();
        resp.setId(doc.getAnalysisId());
        resp.setAnalysisId(doc.getAnalysisId());
        resp.setFilename(doc.getImageFilename());
        resp.setImageFilename(doc.getImageFilename());
        
        // Expose web-accessible paths
        String rawName = doc.getOriginalImagePath() != null ? 
            doc.getOriginalImagePath().substring(doc.getOriginalImagePath().lastIndexOf('/') + 1) : "";
        String procName = doc.getProcessedImagePath() != null ? 
            doc.getProcessedImagePath().substring(doc.getProcessedImagePath().lastIndexOf('/') + 1) : "";
        
        String rawUrl = "/uploads/raw/" + rawName;
        String procUrl = "/uploads/processed/" + procName;

        resp.setOriginalImageUrl(rawUrl);
        resp.setRawImageUrl(rawUrl);
        resp.setProcessedImageUrl(procUrl);
        resp.setAnnotatedImageUrl(procUrl);

        resp.setCreatedAt(doc.getCreatedAt());
        resp.setCondition(doc.getPredictedCondition());
        resp.setPredictedCondition(doc.getPredictedCondition());
        resp.setFaultCategory(doc.getFaultType());
        resp.setFaultType(doc.getFaultType());
        resp.setConfidence(doc.getConfidence());
        resp.setSeverity(doc.getSeverity());
        resp.setHotspot(doc.getHotspotCoordinates());
        resp.setAllHotspots(doc.getAllHotspots());
        resp.setModelVersion(doc.getModelVersion());
        resp.setStatus(doc.getAnalysisStatus());
        resp.setOriginalDimensions(doc.getOriginalDimensions());
        resp.setProcessedDimensions(doc.getProcessedDimensions());
        resp.setClassProbabilities(doc.getClassProbabilities());
        resp.setReportUrl("/api/analyses/" + doc.getAnalysisId() + "/report");
        resp.setNotes(doc.getNotes());
        resp.setInferenceTimeMs(14.5);
        return resp;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getAnalysisId() {
        return analysisId;
    }

    public void setAnalysisId(String analysisId) {
        this.analysisId = analysisId;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public String getImageFilename() {
        return imageFilename;
    }

    public void setImageFilename(String imageFilename) {
        this.imageFilename = imageFilename;
    }

    public String getOriginalImageUrl() {
        return originalImageUrl;
    }

    public void setOriginalImageUrl(String originalImageUrl) {
        this.originalImageUrl = originalImageUrl;
    }

    public String getProcessedImageUrl() {
        return processedImageUrl;
    }

    public void setProcessedImageUrl(String processedImageUrl) {
        this.processedImageUrl = processedImageUrl;
    }

    public String getRawImageUrl() {
        return rawImageUrl;
    }

    public void setRawImageUrl(String rawImageUrl) {
        this.rawImageUrl = rawImageUrl;
    }

    public String getAnnotatedImageUrl() {
        return annotatedImageUrl;
    }

    public void setAnnotatedImageUrl(String annotatedImageUrl) {
        this.annotatedImageUrl = annotatedImageUrl;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getCondition() {
        return condition;
    }

    public void setCondition(String condition) {
        this.condition = condition;
    }

    public String getPredictedCondition() {
        return predictedCondition;
    }

    public void setPredictedCondition(String predictedCondition) {
        this.predictedCondition = predictedCondition;
    }

    public String getFaultCategory() {
        return faultCategory;
    }

    public void setFaultCategory(String faultCategory) {
        this.faultCategory = faultCategory;
    }

    public String getFaultType() {
        return faultType;
    }

    public void setFaultType(String faultType) {
        this.faultType = faultType;
    }

    public Double getConfidence() {
        return confidence;
    }

    public void setConfidence(Double confidence) {
        this.confidence = confidence;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public HotspotData getHotspot() {
        return hotspot;
    }

    public void setHotspot(HotspotData hotspot) {
        this.hotspot = hotspot;
    }

    public List<HotspotData> getAllHotspots() {
        return allHotspots;
    }

    public void setAllHotspots(List<HotspotData> allHotspots) {
        this.allHotspots = allHotspots;
    }

    public String getModelVersion() {
        return modelVersion;
    }

    public void setModelVersion(String modelVersion) {
        this.modelVersion = modelVersion;
    }

    public AnalysisStatus getStatus() {
        return status;
    }

    public void setStatus(AnalysisStatus status) {
        this.status = status;
    }

    public String getOriginalDimensions() {
        return originalDimensions;
    }

    public void setOriginalDimensions(String originalDimensions) {
        this.originalDimensions = originalDimensions;
    }

    public String getProcessedDimensions() {
        return processedDimensions;
    }

    public void setProcessedDimensions(String processedDimensions) {
        this.processedDimensions = processedDimensions;
    }

    public Map<String, Double> getClassProbabilities() {
        return classProbabilities;
    }

    public void setClassProbabilities(Map<String, Double> classProbabilities) {
        this.classProbabilities = classProbabilities;
    }

    public String getReportUrl() {
        return reportUrl;
    }

    public void setReportUrl(String reportUrl) {
        this.reportUrl = reportUrl;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public double getInferenceTimeMs() {
        return inferenceTimeMs;
    }

    public void setInferenceTimeMs(double inferenceTimeMs) {
        this.inferenceTimeMs = inferenceTimeMs;
    }
}
