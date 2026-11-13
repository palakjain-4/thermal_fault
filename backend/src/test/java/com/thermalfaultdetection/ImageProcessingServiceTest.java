package com.thermalfaultdetection;

import com.thermalfaultdetection.config.ModelConfig;
import com.thermalfaultdetection.config.StorageProperties;
import com.thermalfaultdetection.imageprocessing.ImageProcessingResult;
import com.thermalfaultdetection.imageprocessing.ImageProcessingService;
import com.thermalfaultdetection.ml.InferenceResult;
import com.thermalfaultdetection.ml.InferenceService;
import com.thermalfaultdetection.ml.ModelLoader;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import static org.junit.jupiter.api.Assertions.*;

public class ImageProcessingServiceTest {

    private ImageProcessingService imageProcessingService;
    private ModelConfig modelConfig;
    private StorageProperties storageProperties;

    @BeforeEach
    public void setup() {
        modelConfig = new ModelConfig();
        storageProperties = new StorageProperties();
        imageProcessingService = new ImageProcessingService(modelConfig, storageProperties);
        imageProcessingService.initOpenCV();
    }

    @Test
    public void testValidateImageValid() {
        MockMultipartFile file = new MockMultipartFile("file", "thermal_test.png", "image/png", new byte[1024]);
        assertTrue(imageProcessingService.validateImage(file));
    }

    @Test
    public void testValidateImageInvalidExtension() {
        MockMultipartFile file = new MockMultipartFile("file", "document.pdf", "application/pdf", new byte[1024]);
        assertThrows(RuntimeException.class, () -> imageProcessingService.validateImage(file));
    }

    @Test
    public void testPreprocessSampleImageIfAvailable() throws IOException {
        Path sample = Paths.get("sample_data", "sample_overheating_1.png");
        if (Files.exists(sample)) {
            Path output = Files.createTempFile("test_proc_", ".png");
            output.toFile().deleteOnExit();

            ImageProcessingResult result = imageProcessingService.preprocessImage(sample, output);
            assertNotNull(result);
            assertTrue(Files.exists(output));
            assertTrue(Files.size(output) > 0);
            assertNotNull(result.getNormalizedTensor());
            assertEquals(1, result.getNormalizedTensor().length);
            assertEquals(3, result.getNormalizedTensor()[0].length);
            assertEquals(224, result.getNormalizedTensor()[0][0].length);
            assertEquals(224, result.getNormalizedTensor()[0][0][0].length);
        }
    }
}
