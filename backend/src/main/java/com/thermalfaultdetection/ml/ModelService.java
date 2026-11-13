package com.thermalfaultdetection.ml;

import com.thermalfaultdetection.config.ModelConfig;
import com.thermalfaultdetection.dto.ModelInfoResponse;
import org.springframework.stereotype.Service;

@Service
public class ModelService {

    private final ModelLoader modelLoader;
    private final ModelConfig modelConfig;
    private final InferenceService inferenceService;

    public ModelService(ModelLoader modelLoader, ModelConfig modelConfig, InferenceService inferenceService) {
        this.modelLoader = modelLoader;
        this.modelConfig = modelConfig;
        this.inferenceService = inferenceService;
    }

    public ModelInfoResponse getModelInfo() {
        ModelInfoResponse response = new ModelInfoResponse();
        response.setName(modelConfig.getName());
        response.setVersion(modelConfig.getVersion());
        response.setArchitecture("ResNet-18 Transfer Learning CNN (Thermal Head)");
        response.setFramework("PyTorch 2.x -> ONNX Standard Opset 14");
        response.setRuntimeEngine("ONNX Runtime Java Native (CPU/CoreML)");
        response.setInputWidth(modelConfig.getInputWidth());
        response.setInputHeight(modelConfig.getInputHeight());
        response.setInputChannels(modelConfig.getInputChannels());
        response.setConfidenceThreshold(modelConfig.getConfidenceThreshold());
        response.setClasses(modelConfig.getClasses());

        if (modelLoader.isModelLoaded()) {
            response.setStatus("READY");
            response.setConfigured(true);
            response.setModelPath(modelLoader.getLoadedPathDescription());
            response.setNotes("Trained thermal fault detection weights actively loaded and ready for high-throughput inference.");
        } else {
            response.setStatus("MODEL NOT CONFIGURED");
            response.setConfigured(false);
            response.setModelPath(modelConfig.getPath());
            response.setNotes("ONNX model weights file not located in backend/src/main/resources/models/. Image preprocessing and visual hotspot analysis remain active.");
        }

        return response;
    }

    public InferenceResult infer(float[][][][] tensor) {
        return inferenceService.runInference(tensor);
    }

    public boolean isConfigured() {
        return modelLoader.isModelLoaded();
    }
}
