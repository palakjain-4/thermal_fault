import React, { useState } from 'react';
import { 
  Download, 
  RefreshCw, 
  Layers, 
  Crosshair, 
  ArrowLeft,
  Sparkles,
  Info,
  ShieldCheck,
  Zap
} from 'lucide-react';
import SeverityBadge from '../components/SeverityBadge';
import { getReportDownloadUrl } from '../services/api';

export default function ResultsPage({ analysis, onNewAnalysis, onBackToHistory }) {
  const [activeView, setActiveView] = useState('annotated'); // 'annotated' | 'original' | 'split'

  if (!analysis) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-[#8F3F56] text-sm">No analysis record selected.</p>
        <button
          onClick={onNewAnalysis}
          className="px-6 py-3 bg-[#FB8CAC] text-white rounded-full text-xs font-semibold shadow-md hover:scale-105 transition-all"
        >
          Analyse a Thermal Scan
        </button>
      </div>
    );
  }

  const isNormal = analysis.predictedCondition === 'Normal';
  const confidencePct = Math.round(analysis.confidence * 100);
  const hotspot = analysis.hotspot;
  const roi = analysis.equipmentRoi;
  const analysisId = analysis._id || analysis.id;

  const handleDownloadPdf = () => {
    const url = getReportDownloadUrl(analysisId);
    window.open(url, '_blank');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Top Navigation & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={onBackToHistory}
            className="text-xs font-semibold text-[#8F3F56] hover:text-[#44101D] flex items-center gap-1.5 mb-2 transition-colors group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> 
            <span>Back to Studio Dashboard</span>
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#44101D] tracking-tight">
              Diagnostic Analysis Results
            </h1>
            <span className={`px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase border shadow-xs ${
              isNormal 
                ? 'bg-white text-[#5E1D2D] border-[#FDC3D1]' 
                : 'bg-[#FDA8BF] text-[#44101D] border-[#FB8CAC]'
            }`}>
              {analysis.predictedCondition}
            </span>
          </div>

          <p className="text-xs text-[#8F3F56] mt-1 font-medium">
            Scan ID: <span className="font-mono text-[#5E1D2D]">{analysisId?.slice(0, 12)}...</span> • 
            Evaluated on {new Date(analysis.createdAt || Date.now()).toLocaleString()}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-white hover:bg-[#FFEAEF] text-[#5E1D2D] border border-[#FDC3D1] text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-[#FB8CAC]" />
            <span>Download PDF Report</span>
          </button>

          <button
            onClick={onNewAnalysis}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-[#FDA8BF] to-[#FB8CAC] hover:from-[#FB8CAC] hover:to-[#FDA8BF] text-white text-xs font-semibold shadow-[0_6px_20px_rgba(251,140,172,0.4)] transition-all hover:scale-105 active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Analyse Another Scan</span>
          </button>
        </div>
      </div>

      {/* Main Analysis Display Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (7 cols): Thermal Image Viewer with Overlays */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white border border-[#FDC3D1] rounded-[32px] p-6 shadow-[0_12px_36px_rgba(253,168,191,0.20)]">
            
            {/* View Switcher Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#FFDBDB]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#44101D] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#FB8CAC]" />
                Thermographic Visualization
              </span>

              <div className="flex items-center gap-1 bg-[#FFF0F3] p-1 rounded-full border border-[#FDC3D1]/70 self-start sm:self-auto">
                <button
                  onClick={() => setActiveView('annotated')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    activeView === 'annotated'
                      ? 'bg-[#FB8CAC] text-white shadow-xs'
                      : 'text-[#8F3F56] hover:text-[#44101D]'
                  }`}
                >
                  AI Overlay
                </button>
                <button
                  onClick={() => setActiveView('original')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    activeView === 'original'
                      ? 'bg-[#FB8CAC] text-white shadow-xs'
                      : 'text-[#8F3F56] hover:text-[#44101D]'
                  }`}
                >
                  Raw Thermal
                </button>
                <button
                  onClick={() => setActiveView('split')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    activeView === 'split'
                      ? 'bg-[#FB8CAC] text-white shadow-xs'
                      : 'text-[#8F3F56] hover:text-[#44101D]'
                  }`}
                >
                  Side-by-Side
                </button>
              </div>
            </div>

            {/* Image Canvas Container */}
            {activeView === 'split' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-[#8F3F56] uppercase tracking-wider">Raw Input Scan</span>
                  <img
                    src={analysis.rawImageUrl}
                    alt="Raw Thermal"
                    className="w-full h-72 object-contain bg-[#FFF7F9] rounded-2xl border border-[#FDC3D1]"
                  />
                </div>
                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-[#FB8CAC] uppercase tracking-wider">AI Diagnostic Overlay</span>
                  <img
                    src={analysis.annotatedImageUrl || analysis.rawImageUrl}
                    alt="Annotated Diagnostic"
                    className="w-full h-72 object-contain bg-[#FFF7F9] rounded-2xl border border-[#FDA8BF]"
                  />
                </div>
              </div>
            ) : (
              <div className="relative rounded-[24px] overflow-hidden bg-[#FFF7F9] border border-[#FDC3D1] flex items-center justify-center min-h-[380px] p-2">
                <img
                  src={activeView === 'annotated' ? (analysis.annotatedImageUrl || analysis.rawImageUrl) : analysis.rawImageUrl}
                  alt="Thermal Inspection"
                  className="max-h-[460px] w-auto object-contain mx-auto rounded-2xl"
                />

                {/* Subtle Overlay Badge */}
                <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#FDC3D1] text-[10px] font-medium text-[#5E1D2D] shadow-sm">
                  {activeView === 'annotated' ? '✦ Displaying: ResNet-18 Hotspot Overlay' : '✧ Displaying: Unfiltered Radiometric Scan'}
                </div>
              </div>
            )}

            {/* Visual Legend */}
            <div className="mt-5 pt-4 border-t border-[#FFDBDB] flex flex-wrap items-center justify-between gap-3 text-xs text-[#8F3F56]">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border border-[#FDA8BF] bg-[#FFDBDB]" />
                  <span>Equipment ROI</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border border-[#FB8CAC] bg-[#FDA8BF]" />
                  <span>Hotspot Bounding Box</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#FB8CAC] text-xs">✛</span>
                  <span>Peak Intensity Point</span>
                </div>
              </div>

              <span className="text-[11px] font-mono text-[#8F3F56]">Inference: {analysis.inferenceTimeMs}ms</span>
            </div>

          </div>

          {/* Model Class Probability Distribution (Pill Bars) */}
          {analysis.allProbabilities && Object.keys(analysis.allProbabilities).length > 0 && (
            <div className="bg-white border border-[#FDC3D1] rounded-[28px] p-6 shadow-[0_10px_30px_rgba(253,168,191,0.18)] space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-[#FFDBDB]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#44101D]">
                  Model Classification Distribution
                </span>
                <span className="text-[10px] text-[#8F3F56] font-serif italic">Softmax Probability</span>
              </div>

              <div className="space-y-2.5">
                {Object.entries(analysis.allProbabilities).map(([cls, prob]) => {
                  const isSelected = cls === analysis.faultType;
                  const pct = Math.round(prob * 100);

                  return (
                    <div key={cls} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-medium ${isSelected ? 'text-[#44101D] font-bold' : 'text-[#8F3F56]'}`}>
                          {cls} {isSelected && '✧ Selected'}
                        </span>
                        <span className={`font-editorial font-bold ${isSelected ? 'text-[#44101D]' : 'text-[#8F3F56]'}`}>
                          {pct}%
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-[#FFF0F3] rounded-full overflow-hidden p-0.5 border border-[#FFDBDB]">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isSelected ? 'bg-[#FB8CAC]' : 'bg-[#FDA8BF]/60'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* Right Column (5 cols): Diagnostic Findings Card */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Primary Condition & Severity Card */}
          <div className="bg-white border border-[#FDC3D1] rounded-[32px] p-7 shadow-[0_12px_36px_rgba(253,168,191,0.20)] space-y-6">
            
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8F3F56]">
                Inspection Assessment
              </span>
              <SeverityBadge severity={analysis.severity} condition={analysis.predictedCondition} />
            </div>

            <div>
              <div className="text-xs text-[#8F3F56] font-medium">Diagnosed Condition</div>
              <div className="font-editorial text-3xl font-bold text-[#44101D] mt-0.5">
                {analysis.faultType}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1 bg-[#FFF0F3] h-3 rounded-full overflow-hidden p-0.5 border border-[#FFDBDB]">
                  <div
                    className="h-full rounded-full bg-[#FB8CAC]"
                    style={{ width: `${confidencePct}%` }}
                  />
                </div>
                <span className="text-xs font-editorial font-bold text-[#44101D]">
                  {confidencePct}% Confidence
                </span>
              </div>
            </div>

            {/* Explanation Quote Box */}
            <div className="bg-[#FFF0F3] border border-[#FDC3D1] rounded-[22px] p-4 text-xs text-[#5E1D2D] leading-relaxed">
              <span className="font-bold text-[#44101D] block mb-1">Engineering Assessment:</span>
              {analysis.explanation}
            </div>

            {/* Hotspot Geometric Data */}
            {hotspot ? (
              <div className="space-y-3 border-t border-[#FFDBDB] pt-5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#44101D]">
                  <Crosshair className="w-4 h-4 text-[#FB8CAC]" />
                  <span>Detected Hotspot Coordinates</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-[#FFF7F9] p-3 rounded-2xl border border-[#FDC3D1]">
                    <span className="text-[#8F3F56] block text-[10px] uppercase font-semibold">Peak Thermal Pixel</span>
                    <span className="font-mono font-bold text-[#44101D]">
                      [{hotspot.peak_pixel?.[0] ?? hotspot.x}, {hotspot.peak_pixel?.[1] ?? hotspot.y}] px
                    </span>
                  </div>

                  <div className="bg-[#FFF7F9] p-3 rounded-2xl border border-[#FDC3D1]">
                    <span className="text-[#8F3F56] block text-[10px] uppercase font-semibold">Centroid Center</span>
                    <span className="font-mono font-bold text-[#44101D]">
                      [{hotspot.centroid?.[0] ?? (hotspot.x + (hotspot.width || 0)/2)}, {hotspot.centroid?.[1] ?? (hotspot.y + (hotspot.height || 0)/2)}] px
                    </span>
                  </div>

                  <div className="bg-[#FFF7F9] p-3 rounded-2xl border border-[#FDC3D1]">
                    <span className="text-[#8F3F56] block text-[10px] uppercase font-semibold">Thermal Intensity</span>
                    <span className="font-editorial font-bold text-sm text-[#FB8CAC]">
                      {hotspot.maxIntensity ? `${hotspot.maxIntensity} / 255` : `+${Math.round((hotspot.relative_contrast || 0.25) * 100)}% vs ambient`}
                    </span>
                  </div>

                  <div className="bg-[#FFF7F9] p-3 rounded-2xl border border-[#FDC3D1]">
                    <span className="text-[#8F3F56] block text-[10px] uppercase font-semibold">Bounding Box (WxH)</span>
                    <span className="font-mono font-bold text-[#44101D]">
                      {hotspot.bounding_box?.width ?? hotspot.width} × {hotspot.bounding_box?.height ?? hotspot.height} px
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-t border-[#FFDBDB] pt-5 flex items-center gap-3 text-xs text-[#5E1D2D] bg-[#FFEAEF] p-4 rounded-2xl border border-[#FDC3D1]">
                <ShieldCheck className="w-5 h-5 text-[#FB8CAC] shrink-0" />
                <span>Operating within normal thermodynamic parameters. No abnormal hotspot concentration detected.</span>
              </div>
            )}

            {/* Equipment ROI Data */}
            {roi && (
              <div className="border-t border-[#FFDBDB] pt-4 text-xs space-y-1">
                <span className="text-[#8F3F56] font-medium">Segmented Equipment Boundary:</span>
                <p className="font-mono text-[#5E1D2D]">
                  {roi.bounding_box.width}×{roi.bounding_box.height}px ({Math.round(roi.coverage_ratio * 100)}% frame coverage)
                </p>
              </div>
            )}

            {/* Model & Version Details */}
            <div className="border-t border-[#FFDBDB] pt-4 flex items-center justify-between text-[11px] text-[#8F3F56]">
              <span>Model: <span className="text-[#44101D] font-semibold">{analysis.modelName}</span></span>
              <span>Version: <span className="text-[#44101D] font-semibold">{analysis.modelVersion}</span></span>
            </div>

          </div>

          {/* Temperature Notice Box */}
          <div className="bg-[#FFF0F3] border border-[#FDC3D1] rounded-[24px] p-5 text-xs text-[#5E1D2D] flex items-start gap-3 shadow-sm">
            <Info className="w-5 h-5 text-[#FB8CAC] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {analysis.temperatureNotice || 
                "Severity levels are determined using relative thermal gradients and geometry. Automated analysis supports inspection and should not replace qualified maintenance assessment."}
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
