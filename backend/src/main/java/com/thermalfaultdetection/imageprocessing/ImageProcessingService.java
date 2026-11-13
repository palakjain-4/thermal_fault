package com.thermalfaultdetection.imageprocessing;

import com.thermalfaultdetection.config.ModelConfig;
import com.thermalfaultdetection.config.StorageProperties;
import com.thermalfaultdetection.exception.InvalidImageException;
import com.thermalfaultdetection.model.FaultSeverity;
import com.thermalfaultdetection.model.HotspotData;
import jakarta.annotation.PostConstruct;
import org.opencv.core.*;
import org.opencv.imgcodecs.Imgcodecs;
import org.opencv.imgproc.CLAHE;
import org.opencv.imgproc.Imgproc;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class ImageProcessingService {

    private static final Logger log = LoggerFactory.getLogger(ImageProcessingService.class);
    private static volatile boolean openCvLoaded = false;

    private final ModelConfig modelConfig;
    private final StorageProperties storageProperties;

    public ImageProcessingService(ModelConfig modelConfig, StorageProperties storageProperties) {
        this.modelConfig = modelConfig;
        this.storageProperties = storageProperties;
    }

    @PostConstruct
    public synchronized void initOpenCV() {
        if (!openCvLoaded) {
            try {
                nu.pattern.OpenCV.loadLocally();
                openCvLoaded = true;
                log.info("✅ OpenCV Java initialized successfully via nu.pattern.OpenCV (version: {})", Core.VERSION);
            } catch (Throwable t) {
                try {
                    System.loadLibrary(Core.NATIVE_LIBRARY_NAME);
                    openCvLoaded = true;
                    log.info("✅ OpenCV loaded from system library path (version: {})", Core.VERSION);
                } catch (Throwable fallbackErr) {
                    log.error("❌ Failed to initialize OpenCV Java bindings: {}", t.getMessage());
                }
            }
        }
    }

    public boolean isOpenCvLoaded() {
        return openCvLoaded;
    }

    /**
     * Validates that the uploaded file is non-empty, has a valid image extension,
     * and is a readable image file.
     */
    public boolean validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidImageException("Uploaded file is null or empty.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new InvalidImageException("Uploaded file has no filename.");
        }

        String lower = originalFilename.toLowerCase();
        if (!lower.endsWith(".jpg") && !lower.endsWith(".jpeg") && !lower.endsWith(".png") && !lower.endsWith(".bmp")) {
            throw new InvalidImageException("Unsupported image format: '" + originalFilename + "'. Supported formats: PNG, JPG, JPEG, BMP.");
        }

        // Verify minimum content size (at least 32 bytes to contain basic headers)
        if (file.getSize() < 32) {
            throw new InvalidImageException("File size is too small to be a valid thermal image (" + file.getSize() + " bytes).");
        }

        return true;
    }

    /**
     * Loads image from disk as an OpenCV Mat.
     */
    public Mat loadImage(Path path) {
        if (!Files.exists(path)) {
            throw new InvalidImageException("File does not exist at path: " + path);
        }
        Mat img = Imgcodecs.imread(path.toString(), Imgcodecs.IMREAD_COLOR);
        if (img == null || img.empty()) {
            throw new InvalidImageException("Failed to decode image using OpenCV: " + path.getFileName());
        }
        return img;
    }

    /**
     * Resizes the image to the specified width and height using bilinear interpolation.
     */
    public Mat resizeImage(Mat src, int targetWidth, int targetHeight) {
        Mat resized = new Mat();
        Imgproc.resize(src, resized, new Size(targetWidth, targetHeight), 0, 0, Imgproc.INTER_LINEAR);
        return resized;
    }

    /**
     * Noise reduction via Gaussian Blur with kernel size (5, 5).
     */
    public Mat removeNoise(Mat src) {
        Mat smoothed = new Mat();
        Imgproc.GaussianBlur(src, smoothed, new Size(5, 5), 1.2);
        return smoothed;
    }

    /**
     * Enhances local contrast using Contrast Limited Adaptive Histogram Equalization (CLAHE).
     * Works in LAB color space to preserve hue and thermal color palettes.
     */
    public Mat enhanceContrast(Mat src) {
        Mat lab = new Mat();
        Imgproc.cvtColor(src, lab, Imgproc.COLOR_BGR2Lab);

        List<Mat> channels = new ArrayList<>(3);
        Core.split(lab, channels);

        // Apply CLAHE on the L (luminance) channel
        CLAHE clahe = Imgproc.createCLAHE(2.5, new Size(8, 8));
        Mat claheL = new Mat();
        clahe.apply(channels.get(0), claheL);
        channels.set(0, claheL);

        Mat enhancedLab = new Mat();
        Core.merge(channels, enhancedLab);

        Mat enhancedBgr = new Mat();
        Imgproc.cvtColor(enhancedLab, enhancedBgr, Imgproc.COLOR_Lab2BGR);

        // Cleanup
        lab.release();
        for (Mat ch : channels) ch.release();
        claheL.release();
        enhancedLab.release();

        return enhancedBgr;
    }

    /**
     * Converts BGR OpenCV Mat to normalized NCHW float tensor for Deep Learning inference.
     * Shape: [1, 3, height, width]
     */
    public float[][][][] normalizeImage(Mat src, float[] mean, float[] std) {
        int height = src.rows();
        int width = src.cols();
        float[][][][] tensor = new float[1][3][height][width];

        // OpenCV Mat stores BGR by default, convert to RGB for standard CNN inference
        Mat rgb = new Mat();
        Imgproc.cvtColor(src, rgb, Imgproc.COLOR_BGR2RGB);

        byte[] byteData = new byte[height * width * 3];
        rgb.get(0, 0, byteData);
        rgb.release();

        int pixelIdx = 0;
        for (int h = 0; h < height; h++) {
            for (int w = 0; w < width; w++) {
                int r = byteData[pixelIdx] & 0xFF;
                int g = byteData[pixelIdx + 1] & 0xFF;
                int b = byteData[pixelIdx + 2] & 0xFF;
                pixelIdx += 3;

                // Channel 0: Red
                tensor[0][0][h][w] = ((r / 255.0f) - mean[0]) / std[0];
                // Channel 1: Green
                tensor[0][1][h][w] = ((g / 255.0f) - mean[1]) / std[1];
                // Channel 2: Blue
                tensor[0][2][h][w] = ((b / 255.0f) - mean[2]) / std[2];
            }
        }

        return tensor;
    }

    /**
     * Executes the full OpenCV thermal preprocessing pipeline:
     * 1. Load image & decode verification
     * 2. Extract original resolution
     * 3. Noise reduction (Gaussian Filter)
     * 4. Contrast enhancement (CLAHE on Luminance)
     * 5. Equipment ROI and Hotspot localization
     * 6. Resize to CNN input dimensions (224x224)
     * 7. Tensor normalization
     * 8. Output annotated / preprocessed image saving
     */
    public ImageProcessingResult preprocessImage(Path inputPath, Path outputPath) {
        long startTime = System.currentTimeMillis();
        List<String> pipelineSteps = new ArrayList<>();

        if (!openCvLoaded) {
            initOpenCV();
        }

        // Step 1: Load Image
        Mat original = loadImage(inputPath);
        int origW = original.cols();
        int origH = original.rows();
        pipelineSteps.add("Image Loading & OpenCV Decode (" + origW + "x" + origH + ")");

        // Step 2: Noise Reduction
        Mat denoised = removeNoise(original);
        pipelineSteps.add("Gaussian Filtering (Kernel 5x5, sigma=1.2) for Thermal Sensor Noise");

        // Step 3: Contrast Enhancement (CLAHE)
        Mat contrastEnhanced = enhanceContrast(denoised);
        pipelineSteps.add("CLAHE Contrast Enhancement (ClipLimit=2.5, TileGrid=8x8) in LAB Space");

        // Step 4: Hotspot & Thermal Anomaly Localization
        List<HotspotData> detectedHotspots = locateHotspots(contrastEnhanced, origW, origH);
        HotspotData primaryHotspot = detectedHotspots.isEmpty() ? null : detectedHotspots.get(0);
        pipelineSteps.add("Thermal Anomaly & Hotspot Contour Localization");

        // Step 5: Annotation on the visual output image
        Mat annotatedOutput = contrastEnhanced.clone();
        annotateHotspots(annotatedOutput, detectedHotspots);

        // Step 6: Save Processed & Annotated Image
        try {
            Files.createDirectories(outputPath.getParent());
            Imgcodecs.imwrite(outputPath.toString(), annotatedOutput);
            pipelineSteps.add("Processed Image Rendered to " + outputPath.getFileName());
        } catch (IOException e) {
            log.error("Failed to ensure output directory: {}", e.getMessage());
        }

        // Step 7: Resize for CNN Model Input (224 x 224)
        Mat modelInputMat = resizeImage(denoised, modelConfig.getInputWidth(), modelConfig.getInputHeight());
        pipelineSteps.add("Bilinear Downsampling to Model Input Dimension (" + modelConfig.getInputWidth() + "x" + modelConfig.getInputHeight() + ")");

        // Step 8: ImageNet Normalization
        float[][][][] tensor = normalizeImage(modelInputMat, modelConfig.getNormMean(), modelConfig.getNormStd());
        pipelineSteps.add("Tensor Normalization (ImageNet Mean/Std, NCHW Format)");

        // Release temporary Mats
        original.release();
        denoised.release();
        contrastEnhanced.release();
        annotatedOutput.release();
        modelInputMat.release();

        long elapsed = System.currentTimeMillis() - startTime;

        ImageProcessingResult result = new ImageProcessingResult();
        result.setOriginalPath(inputPath);
        result.setProcessedPath(outputPath);
        result.setOriginalWidth(origW);
        result.setOriginalHeight(origH);
        result.setOriginalDimensions(origW + " x " + origH + " px");
        result.setProcessedWidth(modelConfig.getInputWidth());
        result.setProcessedHeight(modelConfig.getInputHeight());
        result.setProcessedDimensions(modelConfig.getInputWidth() + " x " + modelConfig.getInputHeight() + " px");
        result.setPrimaryHotspot(primaryHotspot);
        result.setDetectedHotspots(detectedHotspots);
        result.setNormalizedTensor(tensor);
        result.setPipelineSteps(pipelineSteps);
        result.setProcessingTimeMs(elapsed);

        return result;
    }

    /**
     * Thermal hotspot localization using intensity thresholding and contour detection.
     */
    public List<HotspotData> locateHotspots(Mat bgrImage, int imageWidth, int imageHeight) {
        List<HotspotData> hotspots = new ArrayList<>();

        Mat gray = new Mat();
        Imgproc.cvtColor(bgrImage, gray, Imgproc.COLOR_BGR2GRAY);

        // Compute min and max intensity
        Core.MinMaxLocResult minMax = Core.minMaxLoc(gray);
        double maxVal = minMax.maxVal;

        // In thermal palettes (ironbow/jet/turbo), anomalies concentrate in the upper 15% range
        double thresholdVal = Math.max(160.0, maxVal * 0.85);

        Mat thresh = new Mat();
        Imgproc.threshold(gray, thresh, thresholdVal, 255, Imgproc.THRESH_BINARY);

        // Morphological closing to consolidate hotspot clusters
        Mat kernel = Imgproc.getStructuringElement(Imgproc.MORPH_ELLIPSE, new Size(5, 5));
        Mat morphed = new Mat();
        Imgproc.morphologyEx(thresh, morphed, Imgproc.MORPH_CLOSE, kernel);

        List<MatOfPoint> contours = new ArrayList<>();
        Mat hierarchy = new Mat();
        Imgproc.findContours(morphed, contours, hierarchy, Imgproc.RETR_EXTERNAL, Imgproc.CHAIN_APPROX_SIMPLE);

        double totalImageArea = (double) imageWidth * imageHeight;

        for (MatOfPoint c : contours) {
            double area = Imgproc.contourArea(c);
            if (area < 25) { // filter out minor sensor noise specks
                continue;
            }

            Rect rect = Imgproc.boundingRect(c);
            double areaRatio = area / totalImageArea;

            // Compute local intensity in ROI
            Mat roi = gray.submat(rect);
            Core.MinMaxLocResult roiMinMax = Core.minMaxLoc(roi);
            Scalar meanScalar = Core.mean(roi);
            roi.release();

            String severity = determineHotspotSeverity(roiMinMax.maxVal, areaRatio);

            HotspotData data = new HotspotData(
                    rect.x,
                    rect.y,
                    rect.width,
                    rect.height,
                    Math.round(roiMinMax.maxVal * 10.0) / 10.0,
                    Math.round(meanScalar.val[0] * 10.0) / 10.0,
                    Math.round(area * 10.0) / 10.0,
                    Math.round(areaRatio * 1000.0) / 1000.0,
                    severity
            );
            hotspots.add(data);
        }

        // Sort descending by maximum intensity and area
        hotspots.sort((a, b) -> Double.compare(b.getMaxIntensity() * b.getAreaPixels(), a.getMaxIntensity() * a.getAreaPixels()));

        // Release Mats
        gray.release();
        thresh.release();
        kernel.release();
        morphed.release();
        hierarchy.release();
        for (MatOfPoint c : contours) c.release();

        return hotspots;
    }

    private String determineHotspotSeverity(double maxIntensity, double areaRatio) {
        if (maxIntensity >= 240 && areaRatio >= 0.04) {
            return FaultSeverity.CRITICAL.getDisplayName();
        } else if (maxIntensity >= 220 || areaRatio >= 0.02) {
            return FaultSeverity.HIGH.getDisplayName();
        } else if (maxIntensity >= 190) {
            return FaultSeverity.MEDIUM.getDisplayName();
        } else if (maxIntensity >= 160) {
            return FaultSeverity.LOW.getDisplayName();
        }
        return FaultSeverity.NORMAL.getDisplayName();
    }

    private void annotateHotspots(Mat canvas, List<HotspotData> hotspots) {
        if (hotspots == null || hotspots.isEmpty()) {
            return;
        }

        // Soft pink / bubblegum bounding box style with clear indicators
        Scalar primaryBoxColor = new Scalar(172, 140, 251); // Bubblegum tint BGR
        Scalar criticalColor = new Scalar(80, 50, 240);    // High alert crimson/pink

        int count = 0;
        for (HotspotData h : hotspots) {
            if (count >= 3) break; // Annotate top 3 hotspots

            Point p1 = new Point(h.getX(), h.getY());
            Point p2 = new Point(h.getX() + h.getWidth(), h.getY() + h.getHeight());

            Scalar color = "Critical".equalsIgnoreCase(h.getSeverityLevel()) ? criticalColor : primaryBoxColor;
            Imgproc.rectangle(canvas, p1, p2, color, 2);

            String label = String.format("ROI #%d: %s (Int: %.0f)", count + 1, h.getSeverityLevel(), h.getMaxIntensity());
            Point textPoint = new Point(h.getX(), Math.max(15, h.getY() - 6));
            Imgproc.putText(canvas, label, textPoint, Imgproc.FONT_HERSHEY_SIMPLEX, 0.45, color, 1);

            count++;
        }
    }
}
