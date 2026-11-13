package com.thermalfaultdetection.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
@ConfigurationProperties(prefix = "thermal.storage")
public class StorageProperties {
    private String rawDir = "uploads/raw";
    private String processedDir = "uploads/processed";
    private String reportsDir = "reports";

    public String getRawDir() {
        return rawDir;
    }

    public void setRawDir(String rawDir) {
        this.rawDir = rawDir;
    }

    public String getProcessedDir() {
        return processedDir;
    }

    public void setProcessedDir(String processedDir) {
        this.processedDir = processedDir;
    }

    public String getReportsDir() {
        return reportsDir;
    }

    public void setReportsDir(String reportsDir) {
        this.reportsDir = reportsDir;
    }

    public Path getRawPath() {
        return Paths.get(rawDir).toAbsolutePath().normalize();
    }

    public Path getProcessedPath() {
        return Paths.get(processedDir).toAbsolutePath().normalize();
    }

    public Path getReportsPath() {
        return Paths.get(reportsDir).toAbsolutePath().normalize();
    }
}
