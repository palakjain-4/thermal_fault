package com.thermalfaultdetection;

import com.thermalfaultdetection.config.ModelConfig;
import com.thermalfaultdetection.ml.InferenceResult;
import com.thermalfaultdetection.ml.InferenceService;
import com.thermalfaultdetection.ml.ModelLoader;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

public class InferenceServiceTest {

    private ModelConfig modelConfig;
    private ModelLoader modelLoader;
    private InferenceService inferenceService;

    @BeforeEach
    public void setup() {
        modelConfig = new ModelConfig();
        modelLoader = new ModelLoader(modelConfig);
        modelLoader.initialize();
        inferenceService = new InferenceService(modelLoader, modelConfig);
    }

    @AfterEach
    public void cleanup() {
        if (modelLoader != null) {
            modelLoader.cleanup();
        }
    }

    @Test
    public void testInferenceExecution() {
        assertTrue(modelLoader.isModelLoaded(), "ONNX model should be loaded successfully from resources");

        // Prepare dummy input tensor [1, 3, 224, 224]
        float[][][][] tensor = new float[1][3][224][224];
        for (int c = 0; c < 3; c++) {
            for (int h = 0; h < 224; h++) {
                for (int w = 0; w < 224; w++) {
                    tensor[0][c][h][w] = 0.5f;
                }
            }
        }

        InferenceResult result = inferenceService.runInference(tensor);
        assertNotNull(result);
        assertTrue(result.isModelConfigured());
        assertNotNull(result.getFaultType());
        assertTrue(result.getConfidence() > 0.0);
        assertNotNull(result.getClassProbabilities());
        assertEquals(5, result.getClassProbabilities().size());
        System.out.println("Predicted Fault: " + result.getFaultType() + ", Confidence: " + result.getConfidence());
    }
}
