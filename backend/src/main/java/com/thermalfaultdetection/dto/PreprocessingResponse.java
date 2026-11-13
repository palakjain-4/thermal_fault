package com.thermalfaultdetection.dto;

import java.util.List;

public class PreprocessingResponse {
    private String filename;
    private String originalImageUrl;
    private String processedImageUrl;
    private String originalDimensions;
    private String processedDimensions;
    private String status;
    private List<String> pipelineSteps;
    private double processingTimeMs;

    public PreprocessingResponse() {
    }

    public PreprocessingResponse(String filename, String originalImageUrl, String processedImageUrl, String originalDimensions, String processedDimensions, String status, List<String> pipelineSteps, double processingTimeMs) {
        this.filename = filename;
        this.originalImageUrl = originalImageUrl;
        this.processedImageUrl = processedImageUrl;
        this.originalDimensions = originalDimensions;
        this.processedDimensions = processedDimensions;
        this.status = status;
        this.pipelineSteps = pipelineSteps;
        this.processingTimeMs = processingTimeMs;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
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

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<String> getPipelineSteps() {
        return pipelineSteps;
    }

    public void setPipelineSteps(List<String> pipelineSteps) {
        this.pipelineSteps = pipelineSteps;
    }

    public double getProcessingTimeMs() {
        return processingTimeMs;
    }

    public void setProcessingTimeMs(double processingTimeMs) {
        this.processingTimeMs = processingTimeMs;
    }
}
