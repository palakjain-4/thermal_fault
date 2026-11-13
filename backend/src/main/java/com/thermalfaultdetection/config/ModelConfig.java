package com.thermalfaultdetection.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.Arrays;
import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "thermal.model")
public class ModelConfig {
    private String path = "models/thermal_resnet18.onnx";
    private String name = "ResNet18-Thermal-CNN";
    private String version = "v1.0-ONNX";
    private int inputWidth = 224;
    private int inputHeight = 224;
    private int inputChannels = 3;
    private double confidenceThreshold = 0.55;
    private boolean enabled = true;

    private static final List<String> CLASSES = Arrays.asList(
            "Normal",
            "Overheating",
            "Electrical Fault",
            "Insulation Fault",
            "Abnormal Hotspot"
    );

    // Standard ImageNet normalization coefficients used during CNN training
    private static final float[] NORM_MEAN = {0.485f, 0.456f, 0.406f};
    private static final float[] NORM_STD = {0.229f, 0.224f, 0.225f};

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    public int getInputWidth() {
        return inputWidth;
    }

    public void setInputWidth(int inputWidth) {
        this.inputWidth = inputWidth;
    }

    public int getInputHeight() {
        return inputHeight;
    }

    public void setInputHeight(int inputHeight) {
        this.inputHeight = inputHeight;
    }

    public int getInputChannels() {
        return inputChannels;
    }

    public void setInputChannels(int inputChannels) {
        this.inputChannels = inputChannels;
    }

    public double getConfidenceThreshold() {
        return confidenceThreshold;
    }

    public void setConfidenceThreshold(double confidenceThreshold) {
        this.confidenceThreshold = confidenceThreshold;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
    }

    public List<String> getClasses() {
        return CLASSES;
    }

    public float[] getNormMean() {
        return NORM_MEAN;
    }

    public float[] getNormStd() {
        return NORM_STD;
    }
}
