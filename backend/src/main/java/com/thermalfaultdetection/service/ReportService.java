package com.thermalfaultdetection.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Image;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.thermalfaultdetection.model.AnalysisDocument;
import com.thermalfaultdetection.model.HotspotData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
public class ReportService {

    private static final Logger log = LoggerFactory.getLogger(ReportService.class);

    private static final Color PINK_HEADER = new Color(251, 140, 172); // Bubblegum Tint #FB8CAC
    private static final Color SOFT_BLUSH = new Color(255, 235, 238);
    private static final Color DARK_TEXT = new Color(68, 16, 29);
    private static final Color BORDER_COLOR = new Color(253, 195, 209);

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter
            .ofPattern("yyyy-MM-dd HH:mm:ss z")
            .withZone(ZoneId.systemDefault());

    /**
     * Generates a comprehensive University Engineering Project PDF report using OpenPDF.
     */
    public Path generatePdfReport(AnalysisDocument doc, Path destinationPath) {
        try {
            Files.createDirectories(destinationPath.getParent());

            Document document = new Document(PageSize.A4, 36, 36, 40, 40);
            PdfWriter.getInstance(document, new FileOutputStream(destinationPath.toFile()));
            document.open();

            // Font Definitions
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, DARK_TEXT);
            Font subtitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, new Color(143, 63, 86));
            Font sectionFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, DARK_TEXT);
            Font labelFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, DARK_TEXT);
            Font valueFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.DARK_GRAY);
            Font disclaimerFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, Color.GRAY);

            // 1. Header Banner
            PdfPTable headerTable = new PdfPTable(1);
            headerTable.setWidthPercentage(100);
            PdfPCell bannerCell = new PdfPCell();
            bannerCell.setBackgroundColor(PINK_HEADER);
            bannerCell.setPadding(12);
            bannerCell.setBorder(Rectangle.NO_BORDER);

            Paragraph title = new Paragraph("DEEP LEARNING-BASED THERMAL FAULT DETECTION", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            bannerCell.addElement(title);

            Paragraph subtitle = new Paragraph("University Engineering Checkpoint • Task–4 Diagnostic Inspection Report", subtitleFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            bannerCell.addElement(subtitle);

            headerTable.addCell(bannerCell);
            document.add(headerTable);

            document.add(new Paragraph(" "));

            // 2. Metadata Summary Table
            PdfPTable metaTable = new PdfPTable(4);
            metaTable.setWidthPercentage(100);
            metaTable.setWidths(new float[]{22, 28, 22, 28});

            addTableCell(metaTable, "Analysis ID:", labelFont, SOFT_BLUSH);
            addTableCell(metaTable, doc.getAnalysisId() != null ? doc.getAnalysisId() : "N/A", valueFont, Color.WHITE);

            addTableCell(metaTable, "Inspection Date:", labelFont, SOFT_BLUSH);
            addTableCell(metaTable, doc.getCreatedAt() != null ? DATE_FORMATTER.format(doc.getCreatedAt()) : "N/A", valueFont, Color.WHITE);

            addTableCell(metaTable, "Target Filename:", labelFont, SOFT_BLUSH);
            addTableCell(metaTable, doc.getImageFilename() != null ? doc.getImageFilename() : "N/A", valueFont, Color.WHITE);

            addTableCell(metaTable, "Model Architecture:", labelFont, SOFT_BLUSH);
            addTableCell(metaTable, doc.getModelVersion() != null ? doc.getModelVersion() : "ResNet18-ONNX", valueFont, Color.WHITE);

            addTableCell(metaTable, "Analysis Status:", labelFont, SOFT_BLUSH);
            addTableCell(metaTable, doc.getAnalysisStatus() != null ? doc.getAnalysisStatus().name() : "SUCCESS", valueFont, Color.WHITE);

            addTableCell(metaTable, "Diagnostic Condition:", labelFont, SOFT_BLUSH);
            addTableCell(metaTable, doc.getPredictedCondition() != null ? doc.getPredictedCondition() : "N/A", valueFont, Color.WHITE);

            addTableCell(metaTable, "Classified Fault:", labelFont, SOFT_BLUSH);
            addTableCell(metaTable, doc.getFaultType() != null ? doc.getFaultType() : "N/A", valueFont, Color.WHITE);

            addTableCell(metaTable, "Model Confidence:", labelFont, SOFT_BLUSH);
            String confStr = doc.getConfidence() != null ? String.format("%.2f%%", doc.getConfidence() * 100) : "N/A";
            addTableCell(metaTable, confStr, valueFont, Color.WHITE);

            addTableCell(metaTable, "Assessed Severity:", labelFont, SOFT_BLUSH);
            addTableCell(metaTable, doc.getSeverity() != null ? doc.getSeverity() : "N/A", valueFont, Color.WHITE);

            addTableCell(metaTable, "Resolution (Orig/Proc):", labelFont, SOFT_BLUSH);
            String dims = (doc.getOriginalDimensions() != null ? doc.getOriginalDimensions() : "-") + " / " +
                          (doc.getProcessedDimensions() != null ? doc.getProcessedDimensions() : "-");
            addTableCell(metaTable, dims, valueFont, Color.WHITE);

            document.add(metaTable);
            document.add(new Paragraph(" "));

            // 3. Thermal Imagery Comparison (Original vs Processed with Hotspot Bounding Box)
            Paragraph imgSectionTitle = new Paragraph("THERMAL SENSOR IMAGERY & ROI LOCALIZATION", sectionFont);
            imgSectionTitle.setSpacingAfter(8);
            document.add(imgSectionTitle);

            PdfPTable imageTable = new PdfPTable(2);
            imageTable.setWidthPercentage(100);
            imageTable.setWidths(new float[]{50, 50});

            PdfPCell rawCell = createAnnotatedImageCell(doc.getOriginalImagePath(), "Original Thermal Acquisition", labelFont);
            PdfPCell procCell = createAnnotatedImageCell(doc.getProcessedImagePath(), "OpenCV Processed & Hotspot ROI", labelFont);

            imageTable.addCell(rawCell);
            imageTable.addCell(procCell);
            document.add(imageTable);

            document.add(new Paragraph(" "));

            // 4. Hotspot Localization Details Table
            Paragraph hotspotTitle = new Paragraph("ANOMALOUS THERMAL HOTSPOT COORDINATES", sectionFont);
            hotspotTitle.setSpacingAfter(6);
            document.add(hotspotTitle);

            PdfPTable hotspotTable = new PdfPTable(5);
            hotspotTable.setWidthPercentage(100);
            hotspotTable.setWidths(new float[]{20, 20, 20, 20, 20});

            addTableHeader(hotspotTable, "Region", labelFont, PINK_HEADER);
            addTableHeader(hotspotTable, "Bounding Box (X,Y,W,H)", labelFont, PINK_HEADER);
            addTableHeader(hotspotTable, "Peak Intensity", labelFont, PINK_HEADER);
            addTableHeader(hotspotTable, "Area (Pixels)", labelFont, PINK_HEADER);
            addTableHeader(hotspotTable, "Local Severity", labelFont, PINK_HEADER);

            if (doc.getHotspotCoordinates() != null) {
                HotspotData h = doc.getHotspotCoordinates();
                String bbox = String.format("[%d, %d, %d, %d]", h.getX(), h.getY(), h.getWidth(), h.getHeight());
                addTableCell(hotspotTable, "Primary Hotspot", valueFont, Color.WHITE);
                addTableCell(hotspotTable, bbox, valueFont, Color.WHITE);
                addTableCell(hotspotTable, String.format("%.1f", h.getMaxIntensity()), valueFont, Color.WHITE);
                addTableCell(hotspotTable, String.format("%.0f px", h.getAreaPixels()), valueFont, Color.WHITE);
                addTableCell(hotspotTable, h.getSeverityLevel() != null ? h.getSeverityLevel() : "N/A", valueFont, Color.WHITE);
            } else {
                PdfPCell emptyCell = new PdfPCell(new Phrase("No abnormal localized thermal hotspots detected within equipment boundary.", valueFont));
                emptyCell.setColspan(5);
                emptyCell.setPadding(8);
                emptyCell.setHorizontalAlignment(Element.ALIGN_CENTER);
                hotspotTable.addCell(emptyCell);
            }
            document.add(hotspotTable);

            document.add(new Paragraph(" "));

            // 5. Engineering Limitations and University Disclaimer
            PdfPTable disclaimerTable = new PdfPTable(1);
            disclaimerTable.setWidthPercentage(100);
            PdfPCell discCell = new PdfPCell();
            discCell.setBackgroundColor(new Color(254, 245, 247));
            discCell.setBorderColor(BORDER_COLOR);
            discCell.setPadding(8);

            Paragraph discHeader = new Paragraph("LIMITATIONS & ACADEMIC PROJECT DISCLAIMER", labelFont);
            Paragraph discBody = new Paragraph(
                    "This report is generated automatically by the Deep Learning-Based Thermal Fault Detection system (University Project Checkpoint Task–4). " +
                    "Thermal analysis is performed through computer vision (OpenCV Java) and deep neural network classification (ONNX Runtime Java). " +
                    "Standard 8-bit RGB colorized infrared imagery does not represent certified absolute thermometric calibration. " +
                    "Results should be validated by certified thermographers before physical maintenance interventions.",
                    disclaimerFont
            );
            discCell.addElement(discHeader);
            discCell.addElement(discBody);
            disclaimerTable.addCell(discCell);
            document.add(disclaimerTable);

            document.close();
            log.info("✅ OpenPDF Report generated successfully at: {}", destinationPath);
            return destinationPath;

        } catch (Exception e) {
            log.error("Failed to generate PDF report: {}", e.getMessage(), e);
            throw new RuntimeException("PDF report generation failed: " + e.getMessage(), e);
        }
    }

    private void addTableHeader(PdfPTable table, String text, Font font, Color bgColor) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bgColor);
        cell.setPadding(6);
        cell.setBorderColor(BORDER_COLOR);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private void addTableCell(PdfPTable table, String text, Font font, Color bgColor) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(bgColor);
        cell.setPadding(5);
        cell.setBorderColor(BORDER_COLOR);
        table.addCell(cell);
    }

    private PdfPCell createAnnotatedImageCell(String imagePath, String caption, Font captionFont) {
        PdfPCell cell = new PdfPCell();
        cell.setBorderColor(BORDER_COLOR);
        cell.setPadding(6);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);

        try {
            if (imagePath != null && Files.exists(Paths.get(imagePath))) {
                Image img = Image.getInstance(imagePath);
                img.scaleToFit(220, 165);
                img.setAlignment(Element.ALIGN_CENTER);
                cell.addElement(img);
            } else {
                cell.addElement(new Paragraph("[Image File Unavailable]", captionFont));
            }
        } catch (Exception e) {
            cell.addElement(new Paragraph("[Image Rendering Error: " + e.getMessage() + "]", captionFont));
        }

        Paragraph pCaption = new Paragraph(caption, captionFont);
        pCaption.setAlignment(Element.ALIGN_CENTER);
        pCaption.setSpacingBefore(4);
        cell.addElement(pCaption);

        return cell;
    }
}
