package com.thermalfaultdetection.repository;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.thermalfaultdetection.model.AnalysisDocument;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Component
public class InMemoryAnalysisRepository implements AnalysisRepository {

    private static final Logger log = LoggerFactory.getLogger(InMemoryAnalysisRepository.class);
    private final Map<String, AnalysisDocument> storage = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;
    private final Path cacheFilePath = Paths.get("data", "in_memory_analyses.json");

    public InMemoryAnalysisRepository() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
        loadFromCache();
    }

    private void loadFromCache() {
        try {
            if (Files.exists(cacheFilePath)) {
                List<AnalysisDocument> docs = objectMapper.readValue(
                        cacheFilePath.toFile(),
                        new TypeReference<List<AnalysisDocument>>() {}
                );
                for (AnalysisDocument doc : docs) {
                    if (doc.getAnalysisId() != null) {
                        storage.put(doc.getAnalysisId(), doc);
                    }
                }
                log.info("Loaded {} analysis records from fallback storage file {}", storage.size(), cacheFilePath);
            }
        } catch (Exception e) {
            log.warn("Failed to load records from fallback file: {}", e.getMessage());
        }
    }

    private synchronized void persistToCache() {
        try {
            Files.createDirectories(cacheFilePath.getParent());
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(cacheFilePath.toFile(), new ArrayList<>(storage.values()));
        } catch (IOException e) {
            log.warn("Failed to write to fallback file: {}", e.getMessage());
        }
    }

    @Override
    public AnalysisDocument save(AnalysisDocument document) {
        if (document.getAnalysisId() == null) {
            document.setAnalysisId(UUID.randomUUID().toString().substring(0, 8));
        }
        storage.put(document.getAnalysisId(), document);
        persistToCache();
        return document;
    }

    @Override
    public Optional<AnalysisDocument> findByAnalysisId(String analysisId) {
        return Optional.ofNullable(storage.get(analysisId));
    }

    @Override
    public List<AnalysisDocument> findAll() {
        return storage.values().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .collect(Collectors.toList());
    }

    @Override
    public List<AnalysisDocument> findAllPaged(int limit, int skip) {
        return storage.values().stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .skip(skip)
                .limit(limit)
                .collect(Collectors.toList());
    }

    @Override
    public boolean deleteByAnalysisId(String analysisId) {
        AnalysisDocument removed = storage.remove(analysisId);
        if (removed != null) {
            persistToCache();
            return true;
        }
        return false;
    }

    @Override
    public long count() {
        return storage.size();
    }

    @Override
    public long countByPredictedCondition(String condition) {
        return storage.values().stream()
                .filter(d -> condition != null && condition.equalsIgnoreCase(d.getPredictedCondition()))
                .count();
    }

    @Override
    public long countByFaultType(String faultType) {
        return storage.values().stream()
                .filter(d -> faultType != null && faultType.equalsIgnoreCase(d.getFaultType()))
                .count();
    }

    @Override
    public boolean isMongoConnected() {
        return false;
    }
}
