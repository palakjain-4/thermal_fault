package com.thermalfaultdetection.controller;

import com.thermalfaultdetection.dto.AnalysisResponse;
import com.thermalfaultdetection.dto.DashboardStatsResponse;
import com.thermalfaultdetection.dto.ModelInfoResponse;
import com.thermalfaultdetection.dto.PreprocessingResponse;
import com.thermalfaultdetection.imageprocessing.ImageProcessingService;
import com.thermalfaultdetection.ml.ModelService;
import com.thermalfaultdetection.repository.AnalysisRepository;
import com.thermalfaultdetection.service.AnalysisService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.time.Instant;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class AnalysisController {

    private final AnalysisService analysisService;
    private final ModelService modelService;
    private final ImageProcessingService imageProcessingService;
    private final AnalysisRepository analysisRepository;

    public AnalysisController(AnalysisService analysisService,
                              ModelService modelService,
                              ImageProcessingService imageProcessingService,
                              AnalysisRepository analysisRepository) {
        this.analysisService = analysisService;
        this.modelService = modelService;
        this.imageProcessingService = imageProcessingService;
        this.analysisRepository = analysisRepository;
    }

    /**
     * Health check endpoint returning backend module status.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("status", "UP");
        status.put("service", "Deep Learning-Based Thermal Fault Detection");
        status.put("version", "1.0.0");
        status.put("timestamp", Instant.now().toString());
        status.put("opencv_loaded", imageProcessingService.isOpenCvLoaded());
        status.put("model_configured", modelService.isConfigured());
        status.put("mongodb_connected", analysisRepository.isMongoConnected());
        return ResponseEntity.ok(status);
    }

    /**
     * Complete image analysis workflow: Upload -> OpenCV Preprocess -> Hotspot ROI -> DL ONNX Inference -> MongoDB.
     */
    @PostMapping(value = "/analyze", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AnalysisResponse> analyze(@RequestParam("file") MultipartFile file) {
        AnalysisResponse response = analysisService.analyzeThermalImage(file);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Standalone OpenCV preprocessing comparison endpoint (Original vs Processed).
     */
    @PostMapping(value = "/preprocess", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PreprocessingResponse> preprocess(@RequestParam("file") MultipartFile file) {
        PreprocessingResponse response = analysisService.preprocessOnly(file);
        return ResponseEntity.ok(response);
    }

    /**
     * Historical analysis records list.
     */
    @GetMapping("/analyses")
    public ResponseEntity<List<AnalysisResponse>> getAnalyses(
            @RequestParam(value = "limit", defaultValue = "100") int limit,
            @RequestParam(value = "skip", defaultValue = "0") int skip) {
        List<AnalysisResponse> list = analysisService.getAllAnalyses(limit, skip);
        return ResponseEntity.ok(list);
    }

    /**
     * Retrieve analysis details by analysisId.
     */
    @GetMapping("/analyses/{id}")
    public ResponseEntity<AnalysisResponse> getAnalysisById(@PathVariable("id") String id) {
        AnalysisResponse response = analysisService.getAnalysisById(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Delete an analysis record and associated assets.
     */
    @DeleteMapping("/analyses/{id}")
    public ResponseEntity<Map<String, Object>> deleteAnalysis(@PathVariable("id") String id) {
        boolean deleted = analysisService.deleteAnalysis(id);
        Map<String, Object> resp = new LinkedHashMap<>();
        resp.put("success", deleted);
        resp.put("analysisId", id);
        resp.put("message", "Analysis record and related assets successfully deleted.");
        return ResponseEntity.ok(resp);
    }

    /**
     * Dashboard statistics aggregation.
     */
    @GetMapping("/dashboard/stats")
    public ResponseEntity<DashboardStatsResponse> getDashboardStats() {
        DashboardStatsResponse stats = analysisService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * Deep Learning ONNX Model metadata and operational state.
     */
    @GetMapping("/model/info")
    public ResponseEntity<ModelInfoResponse> getModelInfo() {
        ModelInfoResponse info = modelService.getModelInfo();
        return ResponseEntity.ok(info);
    }

    /**
     * University engineering PDF diagnostic report download.
     */
    @GetMapping("/analyses/{id}/report")
    public ResponseEntity<Resource> downloadReport(@PathVariable("id") String id) {
        Path reportFile = analysisService.getOrGenerateReport(id);
        Resource resource = new FileSystemResource(reportFile.toFile());

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + reportFile.getFileName().toString() + "\"")
                .body(resource);
    }
}
