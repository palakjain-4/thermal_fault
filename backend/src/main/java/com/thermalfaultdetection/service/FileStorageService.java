package com.thermalfaultdetection.service;

import com.thermalfaultdetection.config.StorageProperties;
import com.thermalfaultdetection.exception.InvalidImageException;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);

    private final StorageProperties storageProperties;

    public FileStorageService(StorageProperties storageProperties) {
        this.storageProperties = storageProperties;
    }

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(storageProperties.getRawPath());
            Files.createDirectories(storageProperties.getProcessedPath());
            Files.createDirectories(storageProperties.getReportsPath());
            log.info("Storage directories initialized: Raw='{}', Processed='{}', Reports='{}'",
                    storageProperties.getRawPath(),
                    storageProperties.getProcessedPath(),
                    storageProperties.getReportsPath());
        } catch (IOException e) {
            log.error("Failed to initialize storage directories: {}", e.getMessage(), e);
            throw new RuntimeException("Could not initialize storage directory structure", e);
        }
    }

    public Path storeRawFile(MultipartFile file, String uniqueId) {
        if (file.isEmpty()) {
            throw new InvalidImageException("Failed to store empty file.");
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null || originalName.contains("..")) {
            throw new InvalidImageException("Cannot store file with relative path outside current directory.");
        }

        // Clean filename: remove special characters
        String safeName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");
        String finalFilename = uniqueId + "_" + safeName;
        Path destination = storageProperties.getRawPath().resolve(finalFilename).normalize();

        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, destination, StandardCopyOption.REPLACE_EXISTING);
            return destination;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store uploaded thermal image file: " + e.getMessage(), e);
        }
    }

    public Path getProcessedDestination(String uniqueId, String originalFilename) {
        String baseName = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        int dotIdx = baseName.lastIndexOf('.');
        if (dotIdx > 0) {
            baseName = baseName.substring(0, dotIdx);
        }
        String procFilename = "proc_" + uniqueId + "_" + baseName + ".png";
        return storageProperties.getProcessedPath().resolve(procFilename).normalize();
    }

    public Path getReportDestination(String uniqueId, String originalFilename) {
        String baseName = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        int dotIdx = baseName.lastIndexOf('.');
        if (dotIdx > 0) {
            baseName = baseName.substring(0, dotIdx);
        }
        String reportFilename = "report_" + uniqueId + "_" + baseName + ".pdf";
        return storageProperties.getReportsPath().resolve(reportFilename).normalize();
    }

    public void deleteFileIfExists(Path path) {
        if (path != null) {
            try {
                Files.deleteIfExists(path);
            } catch (IOException e) {
                log.warn("Failed to delete file {}: {}", path, e.getMessage());
            }
        }
    }
}
