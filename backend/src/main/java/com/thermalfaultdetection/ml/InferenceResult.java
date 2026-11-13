package com.thermalfaultdetection.ml;

import java.util.Map;

public class InferenceResult {
    private String predictedCondition;
    private String faultType;
    private double confidence;
    private String severity;
    private Map<String, Double> classProbabilities;
    private boolean modelConfigured;
    private String modelVersion;

    public InferenceResult() {
    }

    public InferenceResult(String predictedCondition, String faultType, double confidence, String severity, Map<String, Double> classProbabilities, boolean modelConfigured, String modelVersion) {
        this.predictedCondition = predictedCondition;
        this.faultType = faultType;
        this.confidence = confidence;
        this.severity = severity;
        this.classProbabilities = classProbabilities;
        this.modelConfigured = modelConfigured;
        this.modelVersion = modelVersion;
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

    public double getConfidence() {
        return confidence;
    }

    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public Map<String, Double> getClassProbabilities() {
        return classProbabilities;
    }

    public void setClassProbabilities(Map<String, Double> classProbabilities) {
        this.classProbabilities = classProbabilities;
    }

    public boolean isModelConfigured() {
        return modelConfigured;
    }

    public void setModelConfigured(boolean modelConfigured) {
        this.modelConfigured = modelConfigured;
    }

    public String getModelVersion() {
        return modelVersion;
    }

    public void setModelVersion(String modelVersion) {
        this.modelVersion = modelVersion;
    }
}
