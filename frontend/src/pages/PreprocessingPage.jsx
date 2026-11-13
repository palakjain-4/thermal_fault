import React, { useState, useRef } from 'react';
import { 
  Sliders, 
  Layers, 
  Sparkles, 
  UploadCloud, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Maximize2, 
  Activity,
  Zap,
  Info
} from 'lucide-react';
import { preprocessImage } from '../services/api';

export default function PreprocessingPage({ onProceedToAnalysis }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const sampleImages = [
    { name: 'Overheating Motor', path: '/uploads/raw/sample_overheating_1.png', filename: 'sample_overheating_1.png' },
    { name: 'Electrical Busbar', path: '/uploads/raw/sample_electrical_fault_1.png', filename: 'sample_electrical_fault_1.png' },
    { name: 'Insulation Degradation', path: '/uploads/raw/sample_insulation_fault_1.png', filename: 'sample_insulation_fault_1.png' },
    { name: 'Normal Transformer', path: '/uploads/raw/sample_normal_1.png', filename: 'sample_normal_1.png' }
  ];

  const handleFileSelect = async (file) => {
    setError(null);
    if (!file) return;

    if (!file.name.match(/\.(png|jpe?g|bmp)$/i)) {
      setError('Please select a PNG, JPG, or BMP thermal image.');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    try {
      setLoading(true);
      const data = await preprocessImage(file);
      setResult(data);
    } catch (err) {
      setError(err.message || 'OpenCV preprocessing failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-[#FFF0F3] to-[#FFDBDB]/60 border border-[#FDC3D1] rounded-[36px] p-8 sm:p-12 shadow-[0_16px_40px_rgba(253,168,191,0.25)]">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-[#8F3F56] border border-[#FDC3D1] text-xs font-semibold tracking-wider uppercase mb-3 shadow-sm">
            <Sliders className="w-3.5 h-3.5 text-[#FB8CAC]" />
            <span>OpenCV Java Image Processing Pipeline</span>
          </div>
          
          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-bold text-[#44101D] tracking-tight">
            Thermal Image Preprocessing &amp; Contrast Enhancement
          </h1>
          
          <p className="text-sm text-[#8F3F56] mt-3 leading-relaxed">
            Real-time inspection of OpenCV Java 4.9.0 native filtering algorithms. Validates decoding, 
            applies Gaussian noise smoothing, executes Luminance-channel CLAHE contrast expansion, 
            and prepares normalized NCHW tensors for Deep Learning inference.
          </p>
        </div>
      </div>

      {/* Upload & Quick Selection Area */}
      <div className="bg-white border border-[#FDC3D1] rounded-[32px] p-6 sm:p-8 shadow-[0_12px_36px_rgba(253,168,191,0.20)] space-y-6">
        <h2 className="font-editorial text-2xl font-bold text-[#44101D]">
          Upload Thermogram for Real Preprocessing
        </h2>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#FDA8BF] hover:border-[#FB8CAC] bg-[#FFF7F9] hover:bg-[#FFEAEF] rounded-[28px] p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 group shadow-xs"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/bmp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
          />
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white border border-[#FDC3D1] flex items-center justify-center text-[#FB8CAC] group-hover:scale-110 shadow-sm transition-transform">
            <UploadCloud className="w-7 h-7" />
          </div>
          <p className="font-semibold text-sm text-[#44101D]">
            Click to browse or drag &amp; drop thermogram
          </p>
          <p className="text-xs text-[#8F3F56] mt-1">
            Supports radiometric PNG, JPG, JPEG, and BMP captures (up to 20MB)
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-[#FFDBDB] border border-[#FDA8BF] text-xs text-[#5E1D2D] font-medium flex items-center gap-2">
            <Info className="w-4 h-4 text-[#FB8CAC] shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Preprocessing Comparison View */}
      {loading && (
        <div className="bg-white border border-[#FDC3D1] rounded-[32px] p-12 text-center space-y-3 shadow-fairy">
          <Activity className="w-8 h-8 text-[#FB8CAC] animate-spin mx-auto" />
          <h3 className="font-editorial text-xl font-bold text-[#44101D]">
            Executing OpenCV Java Preprocessing Pipeline...
          </h3>
          <p className="text-xs text-[#8F3F56]">
            Decoding native Mat, applying Gaussian bilateral filtering and CLAHE contrast enhancement...
          </p>
        </div>
      )}

      {result && !loading && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Side-by-Side Comparison Container */}
          <div className="bg-white border border-[#FDC3D1] rounded-[32px] p-6 sm:p-8 shadow-[0_16px_40px_rgba(253,168,191,0.22)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#FFDBDB]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#FB8CAC] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                  <span>{result.status}</span>
                </span>
                <h3 className="font-editorial text-2xl font-bold text-[#44101D] mt-1">
                  Original vs. OpenCV Enhanced Thermogram
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs px-3 py-1.5 rounded-full bg-[#FFF0F3] border border-[#FDC3D1] text-[#8F3F56] font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#FB8CAC]" />
                  <span>Compute Time: {result.processingTimeMs} ms</span>
                </span>
                {onProceedToAnalysis && selectedFile && (
                  <button
                    onClick={() => onProceedToAnalysis(selectedFile)}
                    className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FDA8BF] to-[#FB8CAC] hover:from-[#FB8CAC] hover:to-[#FDA8BF] text-white text-xs font-semibold shadow-fairy-sm transition-all hover:scale-105 active:scale-95"
                  >
                    <span>Run Full Fault Inference</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-6">
              
              {/* Left: Original Image */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#44101D] uppercase tracking-wider">
                    Original Thermal Capture
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#FFF0F3] border border-[#FDC3D1] text-[#8F3F56] font-mono">
                    {result.originalDimensions}
                  </span>
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-[#FDC3D1] bg-[#FFF7F9] aspect-square flex items-center justify-center p-3 shadow-inner">
                  <img
                    src={result.originalImageUrl}
                    alt="Original Thermogram"
                    className="max-h-full max-w-full object-contain rounded-xl shadow-sm"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-[#FDC3D1] text-[10px] font-semibold text-[#5E1D2D]">
                    Unprocessed
                  </div>
                </div>
              </div>

              {/* Right: Processed Image */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#FB8CAC] uppercase tracking-wider">
                    OpenCV Processed &amp; Contrast Equalized
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#FFEAEF] border border-[#FDA8BF] text-[#5E1D2D] font-mono font-semibold">
                    {result.processedDimensions}
                  </span>
                </div>
                <div className="relative rounded-2xl overflow-hidden border-2 border-[#FDA8BF] bg-[#FFF7F9] aspect-square flex items-center justify-center p-3 shadow-inner">
                  <img
                    src={result.processedImageUrl}
                    alt="Processed Thermogram"
                    className="max-h-full max-w-full object-contain rounded-xl shadow-sm"
                  />
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#FDA8BF] text-[#44101D] border border-[#FB8CAC] text-[10px] font-bold tracking-wider">
                    ✦ CLAHE + Hotspot BBox
                  </div>
                </div>
              </div>

            </div>

            {/* Pipeline Step-by-Step Breakdown */}
            <div className="mt-8 pt-6 border-t border-[#FFDBDB]">
              <h4 className="font-editorial text-lg font-bold text-[#44101D] mb-4">
                Executed OpenCV Java Pipeline Steps:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {result.pipelineSteps?.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl bg-[#FFF7F9] border border-[#FDC3D1]/70 flex items-start gap-2.5 text-xs text-[#5E1D2D]"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#FDA8BF] text-[#44101D] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="leading-snug">{step}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
