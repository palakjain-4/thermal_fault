package com.thermalfaultdetection.imageprocessing;

import com.thermalfaultdetection.model.HotspotData;

import java.nio.file.Path;
import java.util.List;

public class ImageProcessingResult {
    private Path originalPath;
    private Path processedPath;
    private String originalDimensions;
    private String processedDimensions;
    private int originalWidth;
    private int originalHeight;
    private int processedWidth;
    private int processedHeight;
    private HotspotData primaryHotspot;
    private List<HotspotData> detectedHotspots;
    private float[][][][] normalizedTensor; // [1][3][height][width] for ONNX inference
    private List<String> pipelineSteps;
    private double processingTimeMs;

    public ImageProcessingResult() {
    }

    public Path getOriginalPath() {
        return originalPath;
    }

    public void setOriginalPath(Path originalPath) {
        this.originalPath = originalPath;
    }

    public Path getProcessedPath() {
        return processedPath;
    }

    public void setProcessedPath(Path processedPath) {
        this.processedPath = processedPath;
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

    public int getOriginalWidth() {
        return originalWidth;
    }

    public void setOriginalWidth(int originalWidth) {
        this.originalWidth = originalWidth;
    }

    public int getOriginalHeight() {
        return originalHeight;
    }

    public void setOriginalHeight(int originalHeight) {
        this.originalHeight = originalHeight;
    }

    public int getProcessedWidth() {
        return processedWidth;
    }

    public void setProcessedWidth(int processedWidth) {
        this.processedWidth = processedWidth;
    }

    public int getProcessedHeight() {
        return processedHeight;
    }

    public void setProcessedHeight(int processedHeight) {
        this.processedHeight = processedHeight;
    }

    public HotspotData getPrimaryHotspot() {
        return primaryHotspot;
    }

    public void setPrimaryHotspot(HotspotData primaryHotspot) {
        this.primaryHotspot = primaryHotspot;
    }

    public List<HotspotData> getDetectedHotspots() {
        return detectedHotspots;
    }

    public void setDetectedHotspots(List<HotspotData> detectedHotspots) {
        this.detectedHotspots = detectedHotspots;
    }

    public float[][][][] getNormalizedTensor() {
        return normalizedTensor;
    }

    public void setNormalizedTensor(float[][][][] normalizedTensor) {
        this.normalizedTensor = normalizedTensor;
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
