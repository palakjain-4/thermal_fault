package com.thermalfaultdetection.repository.mongo;

import com.thermalfaultdetection.model.AnalysisDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SpringDataMongoAnalysisRepository extends MongoRepository<AnalysisDocument, String> {
    Optional<AnalysisDocument> findByAnalysisId(String analysisId);
    void deleteByAnalysisId(String analysisId);
    long countByPredictedCondition(String predictedCondition);
    long countByFaultType(String faultType);
}
