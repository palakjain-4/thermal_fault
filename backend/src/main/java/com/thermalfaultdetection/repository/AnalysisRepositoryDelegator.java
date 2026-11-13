package com.thermalfaultdetection.repository;

import com.thermalfaultdetection.model.AnalysisDocument;
import com.thermalfaultdetection.repository.mongo.SpringDataMongoAnalysisRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Primary;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@Primary
public class AnalysisRepositoryDelegator implements AnalysisRepository {

    private static final Logger log = LoggerFactory.getLogger(AnalysisRepositoryDelegator.class);

    private final SpringDataMongoAnalysisRepository mongoRepo;
    private final InMemoryAnalysisRepository fallbackRepo;
    private volatile boolean mongoAvailable = true;

    public AnalysisRepositoryDelegator(SpringDataMongoAnalysisRepository mongoRepo,
                                      InMemoryAnalysisRepository fallbackRepo) {
        this.mongoRepo = mongoRepo;
        this.fallbackRepo = fallbackRepo;
    }

    @Override
    public AnalysisDocument save(AnalysisDocument document) {
        if (mongoAvailable) {
            try {
                AnalysisDocument saved = mongoRepo.save(document);
                // Also update local fallback cache for instant consistency
                fallbackRepo.save(saved);
                return saved;
            } catch (Exception e) {
                log.warn("⚠️ MongoDB unavailable during save ({}). Using configured in-memory fallback.", e.getMessage());
                mongoAvailable = false;
            }
        }
        return fallbackRepo.save(document);
    }

    @Override
    public Optional<AnalysisDocument> findByAnalysisId(String analysisId) {
        if (mongoAvailable) {
            try {
                Optional<AnalysisDocument> doc = mongoRepo.findByAnalysisId(analysisId);
                if (doc.isPresent()) {
                    return doc;
                }
            } catch (Exception e) {
                log.warn("⚠️ MongoDB query error. Falling back to in-memory store: {}", e.getMessage());
                mongoAvailable = false;
            }
        }
        return fallbackRepo.findByAnalysisId(analysisId);
    }

    @Override
    public List<AnalysisDocument> findAll() {
        if (mongoAvailable) {
            try {
                return mongoRepo.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
            } catch (Exception e) {
                log.warn("⚠️ MongoDB list error. Falling back to in-memory store: {}", e.getMessage());
                mongoAvailable = false;
            }
        }
        return fallbackRepo.findAll();
    }

    @Override
    public List<AnalysisDocument> findAllPaged(int limit, int skip) {
        if (mongoAvailable) {
            try {
                int page = limit > 0 ? skip / limit : 0;
                return mongoRepo.findAll(PageRequest.of(page, Math.max(1, limit), Sort.by(Sort.Direction.DESC, "createdAt"))).getContent();
            } catch (Exception e) {
                log.warn("⚠️ MongoDB paged query error. Falling back to in-memory store: {}", e.getMessage());
                mongoAvailable = false;
            }
        }
        return fallbackRepo.findAllPaged(limit, skip);
    }

    @Override
    public boolean deleteByAnalysisId(String analysisId) {
        boolean deleted = false;
        if (mongoAvailable) {
            try {
                mongoRepo.deleteByAnalysisId(analysisId);
                deleted = true;
            } catch (Exception e) {
                log.warn("⚠️ MongoDB delete error: {}", e.getMessage());
                mongoAvailable = false;
            }
        }
        boolean fallbackDeleted = fallbackRepo.deleteByAnalysisId(analysisId);
        return deleted || fallbackDeleted;
    }

    @Override
    public long count() {
        if (mongoAvailable) {
            try {
                return mongoRepo.count();
            } catch (Exception e) {
                mongoAvailable = false;
            }
        }
        return fallbackRepo.count();
    }

    @Override
    public long countByPredictedCondition(String condition) {
        if (mongoAvailable) {
            try {
                return mongoRepo.countByPredictedCondition(condition);
            } catch (Exception e) {
                mongoAvailable = false;
            }
        }
        return fallbackRepo.countByPredictedCondition(condition);
    }

    @Override
    public long countByFaultType(String faultType) {
        if (mongoAvailable) {
            try {
                return mongoRepo.countByFaultType(faultType);
            } catch (Exception e) {
                mongoAvailable = false;
            }
        }
        return fallbackRepo.countByFaultType(faultType);
    }

    @Override
    public boolean isMongoConnected() {
        return mongoAvailable;
    }
}
