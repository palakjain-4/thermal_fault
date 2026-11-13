package com.thermalfaultdetection.repository;

import com.thermalfaultdetection.model.AnalysisDocument;

import java.util.List;
import java.util.Optional;

public interface AnalysisRepository {
    AnalysisDocument save(AnalysisDocument document);
    Optional<AnalysisDocument> findByAnalysisId(String analysisId);
    List<AnalysisDocument> findAll();
    List<AnalysisDocument> findAllPaged(int limit, int skip);
    boolean deleteByAnalysisId(String analysisId);
    long count();
    long countByPredictedCondition(String condition);
    long countByFaultType(String faultType);
    boolean isMongoConnected();
}
