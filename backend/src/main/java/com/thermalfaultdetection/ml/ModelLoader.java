package com.thermalfaultdetection.ml;

import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtException;
import ai.onnxruntime.OrtSession;
import com.thermalfaultdetection.config.ModelConfig;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Optional;

@Component
public class ModelLoader {

    private static final Logger log = LoggerFactory.getLogger(ModelLoader.class);

    private final ModelConfig modelConfig;
    private OrtEnvironment environment;
    private OrtSession session;
    private boolean modelLoaded = false;
    private String inputName;
    private String outputName;
    private String loadedPathDescription;

    public ModelLoader(ModelConfig modelConfig) {
        this.modelConfig = modelConfig;
    }

    @PostConstruct
    public synchronized void initialize() {
        if (!modelConfig.isEnabled()) {
            log.info("ℹ️ ONNX deep learning model inference is disabled by configuration.");
            return;
        }

        try {
            this.environment = OrtEnvironment.getEnvironment("ThermalFaultDetection");
            log.info("Initialized ONNX Runtime Environment (Thread: {})", Thread.currentThread().getName());

            Optional<Path> resolvedModelPath = locateModelFile();
            if (resolvedModelPath.isPresent()) {
                Path modelPath = resolvedModelPath.get();
                OrtSession.SessionOptions opts = new OrtSession.SessionOptions();
                opts.setOptimizationLevel(OrtSession.SessionOptions.OptLevel.BASIC_OPT);

                this.session = environment.createSession(modelPath.toString(), opts);
                this.inputName = session.getInputNames().iterator().next();
                this.outputName = session.getOutputNames().iterator().next();
                this.modelLoaded = true;
                this.loadedPathDescription = modelPath.toString();

                log.info("✅ ONNX Deep Learning Model successfully loaded: '{}' (Input: '{}', Output: '{}')",
                        modelPath.getFileName(), inputName, outputName);
            } else {
                this.modelLoaded = false;
                this.loadedPathDescription = "NOT CONFIGURED";
                log.warn("⚠️ ONNX Model file not found at configured paths. Application started in 'MODEL NOT CONFIGURED' mode. " +
                        "Upload and preprocessing remain fully functional. " +
                        "Place 'thermal_resnet18.onnx' in 'backend/src/main/resources/models/' to enable DL inference.");
            }
        } catch (Throwable e) {
            this.modelLoaded = false;
            this.loadedPathDescription = "LOAD_ERROR: " + e.getMessage();
            log.warn("⚠️ ONNX Runtime could not load model weights: {}. Operating in unconfigured mode.", e.getMessage());
        }
    }

    private Optional<Path> locateModelFile() {
        // 1. Check relative path configured in properties
        Path directPath = Paths.get(modelConfig.getPath()).toAbsolutePath().normalize();
        if (Files.exists(directPath) && Files.isRegularFile(directPath)) {
            return Optional.of(directPath);
        }

        // 2. Check project root models directory
        Path projectModelsDir = Paths.get("models", "thermal_resnet18.onnx").toAbsolutePath().normalize();
        if (Files.exists(projectModelsDir) && Files.isRegularFile(projectModelsDir)) {
            return Optional.of(projectModelsDir);
        }

        // 3. Check inside backend/src/main/resources/models/
        Path backendResourcePath = Paths.get("src", "main", "resources", "models", "thermal_resnet18.onnx").toAbsolutePath().normalize();
        if (Files.exists(backendResourcePath) && Files.isRegularFile(backendResourcePath)) {
            return Optional.of(backendResourcePath);
        }

        // 4. Check classpath resource
        try {
            ClassPathResource cpr = new ClassPathResource("models/thermal_resnet18.onnx");
            if (cpr.exists()) {
                Path tempModel = Files.createTempFile("thermal_model_", ".onnx");
                tempModel.toFile().deleteOnExit();
                try (InputStream is = cpr.getInputStream()) {
                    Files.copy(is, tempModel, StandardCopyOption.REPLACE_EXISTING);
                }
                return Optional.of(tempModel);
            }
        } catch (Exception ignored) {
        }

        return Optional.empty();
    }

    public boolean isModelLoaded() {
        return modelLoaded;
    }

    public OrtEnvironment getEnvironment() {
        return environment;
    }

    public OrtSession getSession() {
        return session;
    }

    public String getInputName() {
        return inputName;
    }

    public String getOutputName() {
        return outputName;
    }

    public String getLoadedPathDescription() {
        return loadedPathDescription;
    }

    @PreDestroy
    public void cleanup() {
        try {
            if (session != null) {
                session.close();
            }
            if (environment != null) {
                environment.close();
            }
        } catch (OrtException e) {
            log.warn("Error closing ONNX Runtime session: {}", e.getMessage());
        }
    }
}
