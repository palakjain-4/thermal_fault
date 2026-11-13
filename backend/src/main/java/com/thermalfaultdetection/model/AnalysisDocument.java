package com.thermalfaultdetection.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;
import java.util.Map;

@Document(collection = "analyses")
public class AnalysisDocument {

    @Id
    private String id;

    private String analysisId;
    private String imageFilename;
    private String originalImagePath;
    private String processedImagePath;
    private Instant createdAt;
    private String predictedCondition;
    private String faultType;
    private Double confidence;
    private String severity;
    private HotspotData hotspotCoordinates;
    private List<HotspotData> allHotspots;
    private String modelVersion;
    private AnalysisStatus analysisStatus;
    private String originalDimensions;
    private String processedDimensions;
    private Map<String, Double> classProbabilities;
    private String reportPath;
    private String notes;

    public AnalysisDocument() {
        this.createdAt = Instant.now();
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

    public String getImageFilename() {
        return imageFilename;
    }

    public void setImageFilename(String imageFilename) {
        this.imageFilename = imageFilename;
    }

    public String getOriginalImagePath() {
        return originalImagePath;
    }

    public void setOriginalImagePath(String originalImagePath) {
        this.originalImagePath = originalImagePath;
    }

    public String getProcessedImagePath() {
        return processedImagePath;
    }

    public void setProcessedImagePath(String processedImagePath) {
        this.processedImagePath = processedImagePath;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public String getPredictedCondition() {
        return predictedCondition;
    }

    public void setPredictedCondition(String predictedCondition) {
        this.predictedCondition = predictedCondition;
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

    public HotspotData getHotspotCoordinates() {
        return hotspotCoordinates;
    }

    public void setHotspotCoordinates(HotspotData hotspotCoordinates) {
        this.hotspotCoordinates = hotspotCoordinates;
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

    public AnalysisStatus getAnalysisStatus() {
        return analysisStatus;
    }

    public void setAnalysisStatus(AnalysisStatus analysisStatus) {
        this.analysisStatus = analysisStatus;
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

    public String getReportPath() {
        return reportPath;
    }

    public void setReportPath(String reportPath) {
        this.reportPath = reportPath;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
