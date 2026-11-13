from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image as RLImage,
    KeepTogether,
    HRFlowable,
)

def generate_pdf_report(
    analysis_data: Dict[str, Any],
    raw_image_path: Path,
    annotated_image_path: Optional[Path],
    output_pdf_path: Path
) -> Path:
    """
    Generate professional downloadable PDF inspection report.
    """
    output_pdf_path.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(
        str(output_pdf_path),
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0f172a'),
        alignment=0,
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        textColor=colors.HexColor('#64748b'),
        spaceAfter=15
    )

    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#1e293b'),
        spaceBefore=12,
        spaceAfter=6
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#334155')
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#0f172a')
    )

    story = []

    # 1. Header Banner
    story.append(Paragraph("THERMAL FAULT DIAGNOSTIC REPORT", title_style))
    story.append(Paragraph(
        "Automated Infrared Thermographic Analysis & Deep Learning Evaluation",
        subtitle_style
    ))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#f97316'), spaceAfter=15))

    # 2. Metadata Grid Table
    analysis_id = str(analysis_data.get("_id") or analysis_data.get("id") or "N/A")
    date_str = analysis_data.get("createdAt") or datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    model_ver = f"{analysis_data.get('modelName', 'ResNet18')} ({analysis_data.get('modelVersion', 'v1.2.0')})"
    condition = analysis_data.get("predictedCondition", "Unknown")
    fault = analysis_data.get("faultType", "N/A")
    conf = f"{round(analysis_data.get('confidence', 0.0) * 100, 1)}%"
    sev = analysis_data.get("severity") or "None"

    status_color = colors.HexColor('#16a34a') if condition == "Normal" else colors.HexColor('#dc2626')

    meta_table_data = [
        [
            Paragraph("<b>Analysis ID:</b>", body_style),
            Paragraph(analysis_id, body_style),
            Paragraph("<b>Timestamp:</b>", body_style),
            Paragraph(date_str[:19], body_style),
        ],
        [
            Paragraph("<b>Image Filename:</b>", body_style),
            Paragraph(analysis_data.get("imageFilename", "image.png"), body_style),
            Paragraph("<b>Model Version:</b>", body_style),
            Paragraph(model_ver, body_style),
        ],
        [
            Paragraph("<b>Condition:</b>", body_style),
            Paragraph(f"<font color='{status_color.hexval()}'><b>{condition}</b></font>", body_style),
            Paragraph("<b>Fault Class:</b>", body_style),
            Paragraph(f"<b>{fault}</b>", body_style),
        ],
        [
            Paragraph("<b>Confidence Score:</b>", body_style),
            Paragraph(conf, body_style),
            Paragraph("<b>Severity Level:</b>", body_style),
            Paragraph(f"<b>{sev}</b>", body_style),
        ]
    ]

    t_meta = Table(meta_table_data, colWidths=[105, 160, 105, 170])
    t_meta.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_meta)
    story.append(Spacer(1, 14))

    # 3. Thermographic Visual Imagery (Side-by-Side)
    story.append(Paragraph("Thermographic Inspection Imagery", section_heading))
    
    img_row = []
    if raw_image_path and raw_image_path.exists():
        img_row.append([
            RLImage(str(raw_image_path), width=250, height=200),
            Paragraph("<b>Figure 1: Original Thermal Image</b>", body_style)
        ])
    
    annotated_path = annotated_image_path if (annotated_image_path and annotated_image_path.exists()) else raw_image_path
    if annotated_path and annotated_path.exists():
        img_row.append([
            RLImage(str(annotated_path), width=250, height=200),
            Paragraph("<b>Figure 2: AI Diagnostic Overlay (ROI & Hotspot)</b>", body_style)
        ])

    if len(img_row) == 2:
        image_table_data = [
            [img_row[0][0], img_row[1][0]],
            [img_row[0][1], img_row[1][1]],
        ]
        t_images = Table(image_table_data, colWidths=[265, 265])
        t_images.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(t_images)
    elif len(img_row) == 1:
        story.append(img_row[0][0])
        story.append(img_row[0][1])

    story.append(Spacer(1, 12))

    # 4. Hotspot Localization & Geometric Metrics
    hotspot = analysis_data.get("hotspot")
    if hotspot:
        story.append(Paragraph("Hotspot Localization & Quantitative Metrics", section_heading))
        bb = hotspot.get("bounding_box", {})
        cx, cy = hotspot.get("centroid", [0, 0])
        px, py = hotspot.get("peak_pixel", [0, 0])
        
        hotspot_table_data = [
            [
                Paragraph("<b>Hotspot Bounding Box:</b>", body_style),
                Paragraph(f"X: {bb.get('x_min', 0)}..{bb.get('x_max', 0)}, Y: {bb.get('y_min', 0)}..{bb.get('y_max', 0)} (Width: {bb.get('width', 0)}px, Height: {bb.get('height', 0)}px)", body_style),
            ],
            [
                Paragraph("<b>Centroid Coordinates:</b>", body_style),
                Paragraph(f"[{cx}, {cy}] px", body_style),
            ],
            [
                Paragraph("<b>Peak Thermal Intensity Pixel:</b>", body_style),
                Paragraph(f"[{px}, {py}] px (Max Intensity: {hotspot.get('peak_intensity', 'N/A')})", body_style),
            ],
            [
                Paragraph("<b>Relative Contrast / Area:</b>", body_style),
                Paragraph(f"Contrast Ratio: +{round(hotspot.get('relative_contrast', 0.0) * 100, 1)}% | Area Ratio: {hotspot.get('area_ratio_percent', 0.0)}%", body_style),
            ]
        ]
        t_hotspot = Table(hotspot_table_data, colWidths=[180, 360])
        t_hotspot.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f1f5f9')),
            ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('INNERGRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(t_hotspot)
        story.append(Spacer(1, 10))

    # 5. Diagnostic Interpretation & Recommendations
    story.append(Paragraph("Engineering Interpretation & Recommendations", section_heading))
    explanation = analysis_data.get("explanation", "Standard automated evaluation complete.")
    story.append(Paragraph(f"<b>Summary:</b> {explanation}", body_style))
    story.append(Spacer(1, 6))

    recommendation = (
        "<b>Next Actions:</b> Conduct periodic baseline monitoring during routine thermographic patrols."
        if condition == "Normal" else
        "<b>Next Actions:</b> Schedule immediate physical inspection of identified terminal contacts. "
        "Verify torque on bolted electrical connections, inspect dielectric insulation, and measure phase current balance."
    )
    story.append(Paragraph(recommendation, body_style))
    story.append(Spacer(1, 12))

    # 6. Technical Limitations & Disclaimer
    disclaimer_data = [
        [
            Paragraph(
                "<b>LIMITATIONS & DISCLAIMER:</b><br/>"
                "• Severity levels are derived from thermal gradient contrast and geometry. Uncalibrated digital image formats (PNG/JPG) do not provide calibrated radiometric sensor data in degrees Celsius.<br/>"
                "• Solar reflection, airflow, and surface emissivity affect infrared measurements.<br/>"
                "• <b>Automated analysis supports inspection and should not replace qualified maintenance assessment.</b>",
                callout_style
            )
        ]
    ]
    t_disclaimer = Table(disclaimer_data, colWidths=[540])
    t_disclaimer.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#fff7ed')),
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#fdba74')),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    story.append(t_disclaimer)

    # Build PDF
    doc.build(story)
    return output_pdf_path
