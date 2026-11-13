package com.thermalfaultdetection.service;

import com.thermalfaultdetection.dto.AnalysisResponse;
import com.thermalfaultdetection.dto.DashboardStatsResponse;
import com.thermalfaultdetection.dto.PreprocessingResponse;
import com.thermalfaultdetection.exception.AnalysisNotFoundException;
import com.thermalfaultdetection.imageprocessing.ImageProcessingResult;
import com.thermalfaultdetection.imageprocessing.ImageProcessingService;
import com.thermalfaultdetection.ml.InferenceResult;
import com.thermalfaultdetection.ml.ModelService;
import com.thermalfaultdetection.model.AnalysisDocument;
import com.thermalfaultdetection.model.AnalysisStatus;
import com.thermalfaultdetection.model.FaultSeverity;
import com.thermalfaultdetection.repository.AnalysisRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalysisService {

    private static final Logger log = LoggerFactory.getLogger(AnalysisService.class);

    private final ImageProcessingService imageProcessingService;
    private final ModelService modelService;
    private final FileStorageService fileStorageService;
    private final AnalysisRepository analysisRepository;
    private final ReportService reportService;

    public AnalysisService(ImageProcessingService imageProcessingService,
                           ModelService modelService,
                           FileStorageService fileStorageService,
                           AnalysisRepository analysisRepository,
                           ReportService reportService) {
        this.imageProcessingService = imageProcessingService;
        this.modelService = modelService;
        this.fileStorageService = fileStorageService;
        this.analysisRepository = analysisRepository;
        this.reportService = reportService;
    }

    /**
     * Executes the complete thermal fault analysis workflow:
     * 1. Validate Upload
     * 2. Store Raw Image
     * 3. OpenCV Java Preprocessing & Hotspot Localization
     * 4. ONNX Runtime Java Deep Learning Inference
     * 5. Document Persistence (MongoDB / Fallback)
     * 6. OpenPDF Report Generation
     */
    public AnalysisResponse analyzeThermalImage(MultipartFile file) {
        // Step 1: Validation
        imageProcessingService.validateImage(file);

        String uniqueId = UUID.randomUUID().toString().substring(0, 8);
        String originalFilename = file.getOriginalFilename();

        // Step 2: Store Raw Image
        Path rawPath = fileStorageService.storeRawFile(file, uniqueId);
        Path procPath = fileStorageService.getProcessedDestination(uniqueId, originalFilename);

        // Step 3: OpenCV Preprocessing
        ImageProcessingResult procResult = imageProcessingService.preprocessImage(rawPath, procPath);

        // Step 4: Deep Learning Inference
        InferenceResult infResult = modelService.infer(procResult.getNormalizedTensor());

        // Step 5: Construct Analysis Document
        AnalysisDocument doc = new AnalysisDocument();
        doc.setAnalysisId(uniqueId);
        doc.setImageFilename(originalFilename);
        doc.setOriginalImagePath(rawPath.toString());
        doc.setProcessedImagePath(procPath.toString());
        doc.setCreatedAt(Instant.now());
        doc.setOriginalDimensions(procResult.getOriginalDimensions());
        doc.setProcessedDimensions(procResult.getProcessedDimensions());
        doc.setHotspotCoordinates(procResult.getPrimaryHotspot());
        doc.setAllHotspots(procResult.getDetectedHotspots());
        doc.setModelVersion(infResult.getModelVersion());

        if (infResult.isModelConfigured()) {
            doc.setAnalysisStatus(AnalysisStatus.SUCCESS);
            doc.setPredictedCondition(infResult.getPredictedCondition());
            doc.setFaultType(infResult.getFaultType());
            doc.setConfidence(infResult.getConfidence());
            doc.setSeverity(infResult.getSeverity());
            doc.setClassProbabilities(infResult.getClassProbabilities());
            doc.setNotes("Classified using ONNX deep learning runtime.");
        } else {
            doc.setAnalysisStatus(AnalysisStatus.MODEL_NOT_CONFIGURED);
            doc.setPredictedCondition("Diagnostic Unclassified");
            doc.setFaultType("MODEL NOT CONFIGURED");
            doc.setConfidence(null);
            doc.setSeverity(procResult.getPrimaryHotspot() != null ? procResult.getPrimaryHotspot().getSeverityLevel() : "Normal");
            doc.setNotes("Deep learning weights not configured. Hotspot localized via OpenCV.");
        }

        // Step 6: Generate PDF Report
        try {
            Path reportPath = fileStorageService.getReportDestination(uniqueId, originalFilename);
            reportService.generatePdfReport(doc, reportPath);
            doc.setReportPath(reportPath.toString());
        } catch (Exception e) {
            log.warn("Failed to generate PDF report immediately: {}", e.getMessage());
        }

        // Step 7: Persist Document
        AnalysisDocument saved = analysisRepository.save(doc);
        return AnalysisResponse.fromDocument(saved);
    }

    /**
     * Executes only the OpenCV preprocessing stage and returns original vs processed comparison.
     */
    public PreprocessingResponse preprocessOnly(MultipartFile file) {
        imageProcessingService.validateImage(file);

        String uniqueId = "pre_" + UUID.randomUUID().toString().substring(0, 8);
        String originalFilename = file.getOriginalFilename();

        Path rawPath = fileStorageService.storeRawFile(file, uniqueId);
        Path procPath = fileStorageService.getProcessedDestination(uniqueId, originalFilename);

        ImageProcessingResult procResult = imageProcessingService.preprocessImage(rawPath, procPath);

        String rawName = rawPath.getFileName().toString();
        String procName = procPath.getFileName().toString();

        return new PreprocessingResponse(
                originalFilename,
                "/uploads/raw/" + rawName,
                "/uploads/processed/" + procName,
                procResult.getOriginalDimensions(),
                procResult.getProcessedDimensions(),
                "OpenCV Preprocessing Pipeline Completed Successfully",
                procResult.getPipelineSteps(),
                procResult.getProcessingTimeMs()
        );
    }

    public List<AnalysisResponse> getAllAnalyses(int limit, int skip) {
        List<AnalysisDocument> docs = analysisRepository.findAllPaged(limit, skip);
        return docs.stream()
                .map(AnalysisResponse::fromDocument)
                .collect(Collectors.toList());
    }

    public AnalysisResponse getAnalysisById(String analysisId) {
        AnalysisDocument doc = analysisRepository.findByAnalysisId(analysisId)
                .orElseThrow(() -> new AnalysisNotFoundException("Analysis record not found for ID: " + analysisId));
        return AnalysisResponse.fromDocument(doc);
    }

    public boolean deleteAnalysis(String analysisId) {
        Optional<AnalysisDocument> docOpt = analysisRepository.findByAnalysisId(analysisId);
        if (docOpt.isPresent()) {
            AnalysisDocument doc = docOpt.get();
            if (doc.getOriginalImagePath() != null) {
                fileStorageService.deleteFileIfExists(Paths.get(doc.getOriginalImagePath()));
            }
            if (doc.getProcessedImagePath() != null) {
                fileStorageService.deleteFileIfExists(Paths.get(doc.getProcessedImagePath()));
            }
            if (doc.getReportPath() != null) {
                fileStorageService.deleteFileIfExists(Paths.get(doc.getReportPath()));
            }
            return analysisRepository.deleteByAnalysisId(analysisId);
        }
        throw new AnalysisNotFoundException("Cannot delete: Analysis record not found for ID: " + analysisId);
    }

    public DashboardStatsResponse getDashboardStats() {
        List<AnalysisDocument> all = analysisRepository.findAll();
        long total = all.size();
        long normal = all.stream().filter(d -> "Normal Condition".equalsIgnoreCase(d.getPredictedCondition()) || "Normal".equalsIgnoreCase(d.getFaultType())).count();
        long faults = total - normal;

        double rate = total > 0 ? Math.round(((double) faults / total) * 1000.0) / 10.0 : 0.0;

        Map<String, Long> distribution = new LinkedHashMap<>();
        distribution.put("Normal", 0L);
        distribution.put("Overheating", 0L);
        distribution.put("Electrical Fault", 0L);
        distribution.put("Insulation Fault", 0L);
        distribution.put("Abnormal Hotspot", 0L);

        for (AnalysisDocument d : all) {
            String type = d.getFaultType();
            if (type != null && distribution.containsKey(type)) {
                distribution.put(type, distribution.get(type) + 1);
            }
        }

        List<AnalysisResponse> recent = all.stream()
                .limit(5)
                .map(AnalysisResponse::fromDocument)
                .collect(Collectors.toList());

        return new DashboardStatsResponse(total, normal, faults, rate, distribution, recent);
    }

    public Path getOrGenerateReport(String analysisId) {
        AnalysisDocument doc = analysisRepository.findByAnalysisId(analysisId)
                .orElseThrow(() -> new AnalysisNotFoundException("Analysis ID not found: " + analysisId));

        if (doc.getReportPath() != null && Files.exists(Paths.get(doc.getReportPath()))) {
            return Paths.get(doc.getReportPath());
        }

        Path destination = fileStorageService.getReportDestination(analysisId, doc.getImageFilename());
        reportService.generatePdfReport(doc, destination);
        doc.setReportPath(destination.toString());
        analysisRepository.save(doc);
        return destination;
    }
}
