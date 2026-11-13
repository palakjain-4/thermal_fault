package com.thermalfaultdetection.ml;

import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;
import com.thermalfaultdetection.config.ModelConfig;
import com.thermalfaultdetection.model.FaultSeverity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class InferenceService {

    private static final Logger log = LoggerFactory.getLogger(InferenceService.class);

    private final ModelLoader modelLoader;
    private final ModelConfig modelConfig;

    public InferenceService(ModelLoader modelLoader, ModelConfig modelConfig) {
        this.modelLoader = modelLoader;
        this.modelConfig = modelConfig;
    }

    /**
     * Executes deep learning model inference using ONNX Runtime Java.
     *
     * @param tensor 4D normalized float array with shape [1][3][height][width]
     * @return InferenceResult containing classification, confidence, and class probabilities
     */
    public InferenceResult runInference(float[][][][] tensor) {
        if (!modelLoader.isModelLoaded()) {
            log.info("Model weights not loaded on disk. Returning structured NOT CONFIGURED response.");
            return new InferenceResult(
                    "MODEL NOT CONFIGURED",
                    "Unconfigured",
                    0.0,
                    FaultSeverity.NORMAL.getDisplayName(),
                    Collections.emptyMap(),
                    false,
                    modelConfig.getVersion()
            );
        }

        try {
            OnnxTensor inputTensor = OnnxTensor.createTensor(modelLoader.getEnvironment(), tensor);
            Map<String, OnnxTensor> inputs = Collections.singletonMap(modelLoader.getInputName(), inputTensor);

            OrtSession.Result results = modelLoader.getSession().run(inputs);
            float[][] outputLogits = (float[][]) results.get(0).getValue();

            // Cleanup tensor
            inputTensor.close();
            results.close();

            if (outputLogits == null || outputLogits.length == 0 || outputLogits[0].length == 0) {
                throw new IllegalStateException("Empty output tensor received from ONNX Runtime.");
            }

            float[] logits = outputLogits[0];
            float[] probabilities = computeSoftmax(logits);

            List<String> classes = modelConfig.getClasses();
            int bestIdx = 0;
            float maxProb = probabilities[0];

            Map<String, Double> classProbMap = new LinkedHashMap<>();
            for (int i = 0; i < logits.length && i < classes.size(); i++) {
                double roundedProb = Math.round(probabilities[i] * 10000.0) / 10000.0;
                classProbMap.put(classes.get(i), roundedProb);
                if (probabilities[i] > maxProb) {
                    maxProb = probabilities[i];
                    bestIdx = i;
                }
            }

            String bestClass = classes.get(bestIdx);
            double confidence = Math.round(maxProb * 1000.0) / 1000.0;

            String condition = "Normal".equalsIgnoreCase(bestClass) ? "Normal Condition" : "Fault Detected";
            String severity = determineSeverity(bestClass, confidence);

            return new InferenceResult(
                    condition,
                    bestClass,
                    confidence,
                    severity,
                    classProbMap,
                    true,
                    modelConfig.getVersion()
            );

        } catch (OrtException e) {
            log.error("ONNX Runtime execution error: {}", e.getMessage(), e);
            throw new RuntimeException("ONNX Runtime execution failed: " + e.getMessage(), e);
        }
    }

    private float[] computeSoftmax(float[] logits) {
        float max = Float.NEGATIVE_INFINITY;
        for (float l : logits) {
            if (l > max) max = l;
        }

        float sum = 0.0f;
        float[] exp = new float[logits.length];
        for (int i = 0; i < logits.length; i++) {
            exp[i] = (float) Math.exp(logits[i] - max);
            sum += exp[i];
        }

        float[] probs = new float[logits.length];
        for (int i = 0; i < logits.length; i++) {
            probs[i] = sum > 0.0f ? exp[i] / sum : 0.0f;
        }
        return probs;
    }

    private String determineSeverity(String faultType, double confidence) {
        if ("Normal".equalsIgnoreCase(faultType)) {
            return FaultSeverity.NORMAL.getDisplayName();
        }
        if ("Electrical Fault".equalsIgnoreCase(faultType)) {
            return confidence >= 0.75 ? FaultSeverity.CRITICAL.getDisplayName() : FaultSeverity.HIGH.getDisplayName();
        }
        if ("Overheating".equalsIgnoreCase(faultType)) {
            return confidence >= 0.80 ? FaultSeverity.HIGH.getDisplayName() : FaultSeverity.MEDIUM.getDisplayName();
        }
        if ("Insulation Fault".equalsIgnoreCase(faultType)) {
            return confidence >= 0.70 ? FaultSeverity.MEDIUM.getDisplayName() : FaultSeverity.LOW.getDisplayName();
        }
        if ("Abnormal Hotspot".equalsIgnoreCase(faultType)) {
            return confidence >= 0.85 ? FaultSeverity.CRITICAL.getDisplayName() : FaultSeverity.HIGH.getDisplayName();
        }
        return FaultSeverity.MEDIUM.getDisplayName();
    }
}
