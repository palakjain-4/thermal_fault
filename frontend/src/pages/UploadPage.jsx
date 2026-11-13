import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  Sparkles, 
  RefreshCw, 
  X, 
  Zap, 
  AlertCircle,
  FileImage,
  CheckCircle2
} from 'lucide-react';
import { analyzeImage } from '../services/api';

export default function UploadPage({ onAnalysisComplete }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState('');
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);

  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/bmp'];
  const maxSizeBytes = 15 * 1024 * 1024; // 15MB

  const validateAndSetFile = (file) => {
    setError(null);
    if (!file) return;

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(png|jpe?g|tiff?|bmp)$/i)) {
      setError(`Unsupported format. Please upload a PNG, JPG, JPEG, TIFF, or BMP thermogram.`);
      return;
    }

    if (file.size > maxSizeBytes) {
      setError(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum studio limit of 15MB.`);
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;

    try {
      setLoading(true);
      setError(null);

      setProgressStep('Validating thermographic image format...');
      await new Promise(r => setTimeout(r, 200));

      setProgressStep('Denoising & enhancing thermal gradients (CLAHE)...');
      await new Promise(r => setTimeout(r, 250));

      setProgressStep('Segmenting electrical equipment ROI & running ResNet-18...');
      
      const result = await analyzeImage(selectedFile);

      setProgressStep('Generating diagnostic report & bounding overlays...');
      await new Promise(r => setTimeout(r, 200));

      onAnalysisComplete(result);
    } catch (err) {
      console.error('Analysis error:', err);
      let msg = err.message || 'Image analysis failed.';
      if (err.data?.detail?.diagnostic) {
        msg += ` (${err.data.detail.diagnostic})`;
      }
      setError(msg);
    } finally {
      setLoading(false);
      setProgressStep('');
    }
  };

  // Helper for quick sample testing using canvas-generated synthetic thermal scans
  const handleQuickSample = async (categoryName) => {
    try {
      setLoading(true);
      setProgressStep(`Synthesizing ${categoryName} sample scan...`);
      
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 320;
      const ctx = canvas.getContext('2d');

      // Base background gradient
      ctx.fillStyle = '#1e1b2e';
      ctx.fillRect(0, 0, 320, 320);

      // Equipment silhouette
      const grad = ctx.createLinearGradient(40, 40, 280, 280);
      grad.addColorStop(0, '#2d2744');
      grad.addColorStop(0.5, '#42375a');
      grad.addColorStop(1, '#251e38');
      ctx.fillStyle = grad;
      ctx.fillRect(40, 50, 240, 220);

      // Fault thermal signatures
      if (categoryName === 'Normal') {
        const rad = ctx.createRadialGradient(160, 160, 10, 160, 160, 90);
        rad.addColorStop(0, '#f97316');
        rad.addColorStop(0.5, '#7c2d12');
        rad.addColorStop(1, '#251e38');
        ctx.fillStyle = rad;
        ctx.beginPath();
        ctx.arc(160, 160, 90, 0, Math.PI * 2);
        ctx.fill();
      } else if (categoryName === 'Overheating') {
        const rad = ctx.createRadialGradient(160, 160, 10, 160, 160, 120);
        rad.addColorStop(0, '#ffffff');
        rad.addColorStop(0.3, '#ef4444');
        rad.addColorStop(0.7, '#ea580c');
        rad.addColorStop(1, '#251e38');
        ctx.fillStyle = rad;
        ctx.fillRect(50, 60, 220, 200);
      } else if (categoryName === 'Electrical Fault') {
        const rad = ctx.createRadialGradient(90, 90, 5, 90, 90, 45);
        rad.addColorStop(0, '#ffffff');
        rad.addColorStop(0.2, '#fde047');
        rad.addColorStop(0.6, '#ef4444');
        rad.addColorStop(1, 'transparent');
        ctx.fillStyle = rad;
        ctx.beginPath();
        ctx.arc(90, 90, 45, 0, Math.PI * 2);
        ctx.fill();
      } else if (categoryName === 'Insulation Fault') {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(50, 180, 220, 35);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(50, 175, 220, 10);
      } else { // Abnormal Hotspot
        const rad = ctx.createRadialGradient(210, 190, 4, 210, 190, 40);
        rad.addColorStop(0, '#ffffff');
        rad.addColorStop(0.25, '#fde047');
        rad.addColorStop(0.6, '#dc2626');
        rad.addColorStop(1, 'transparent');
        ctx.fillStyle = rad;
        ctx.beginPath();
        ctx.arc(210, 190, 40, 0, Math.PI * 2);
        ctx.fill();
      }

      canvas.toBlob((blob) => {
        if (!blob) {
          setError('Failed to generate sample');
          setLoading(false);
          return;
        }
        const file = new File([blob], `sample_${categoryName.toLowerCase().replace(' ', '_')}.png`, { type: 'image/png' });
        validateAndSetFile(file);
        setLoading(false);
        setProgressStep('');
      }, 'image/png');

    } catch (err) {
      setError(`Sample creation error: ${err.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      
      {/* Title */}
      <div className="text-center max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-[#8F3F56] border border-[#FDC3D1] text-xs font-semibold tracking-wider uppercase mb-3 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#FB8CAC]" />
          <span>Image Intake Studio</span>
        </div>
        <h1 className="font-editorial text-4xl sm:text-5xl font-bold text-[#44101D] tracking-tight">
          Thermal Scan Upload
        </h1>
        <p className="text-sm text-[#8F3F56] mt-2 font-medium">
          Upload an infrared thermogram of switchgear, transformers, busbars, or terminals for AI inspection.
        </p>
      </div>

      {/* Quick Benchmark Scans Bar (Pill buttons in approved pinks) */}
      <div className="bg-white border border-[#FDC3D1] rounded-[28px] p-5 shadow-[0_10px_30px_rgba(253,168,191,0.18)]">
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#44101D]">
            <Zap className="w-4 h-4 text-[#FB8CAC]" />
            <span>Studio Benchmark Scans</span>
          </div>
          <span className="text-[11px] text-[#8F3F56] font-serif italic">1-Click Test Scenarios</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { name: 'Normal', label: 'Normal State' },
            { name: 'Overheating', label: 'Overheating' },
            { name: 'Electrical Fault', label: 'Contact Arc' },
            { name: 'Insulation Fault', label: 'Dielectric Leak' },
            { name: 'Abnormal Hotspot', label: 'Point Anomaly' },
          ].map((sample) => (
            <button
              key={sample.name}
              type="button"
              onClick={() => handleQuickSample(sample.name)}
              disabled={loading}
              className="px-3.5 py-2.5 rounded-full bg-[#FFF0F3] hover:bg-[#FFDBDB] text-[#5E1D2D] hover:text-[#44101D] border border-[#FDC3D1] text-xs font-semibold transition-all duration-200 hover:scale-[1.03] active:scale-95 text-center shadow-xs"
            >
              <span className="block truncate">{sample.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Large Rounded Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-[36px] p-8 sm:p-14 text-center transition-all duration-300 ${
          dragActive
            ? 'border-[#FB8CAC] bg-[#FFEAEF]'
            : 'border-[#FDA8BF]/70 hover:border-[#FB8CAC] bg-[#FFF0F3]/70 hover:bg-[#FFEAEF]/80'
        } shadow-[0_12px_36px_rgba(253,168,191,0.18)]`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/tiff,image/bmp"
          onChange={handleFileChange}
          className="hidden"
          id="fairy-thermal-file-input"
        />

        {previewUrl ? (
          <div className="space-y-6">
            <div className="relative inline-block max-w-sm mx-auto">
              <img
                src={previewUrl}
                alt="Upload preview"
                className="max-h-72 w-auto mx-auto rounded-[24px] shadow-md border-2 border-white object-contain bg-white"
              />
              <button
                onClick={handleClear}
                disabled={loading}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white hover:bg-[#FFDBDB] text-[#5E1D2D] border border-[#FDC3D1] shadow-md flex items-center justify-center transition-transform hover:scale-110"
                title="Remove image"
              >
                <X className="w-4 h-4 text-[#FB8CAC]" />
              </button>
            </div>

            <div className="text-xs text-[#8F3F56] flex flex-wrap items-center justify-center gap-3">
              <span className="font-semibold text-[#44101D] bg-white px-3 py-1 rounded-full border border-[#FDC3D1]">
                {selectedFile?.name}
              </span>
              <span>•</span>
              <span className="font-mono text-[#5E1D2D]">{(selectedFile?.size / 1024).toFixed(1)} KB</span>
              <span>•</span>
              <span className="text-[#FB8CAC] font-semibold">Ready for Analysis ✧</span>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="w-16 h-16 rounded-full bg-white text-[#FB8CAC] border border-[#FDC3D1] flex items-center justify-center mx-auto shadow-sm">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-editorial text-2xl sm:text-3xl font-bold text-[#44101D]">
                Drag and drop your thermal scan
              </h3>
              <p className="text-xs text-[#8F3F56] mt-1.5 font-medium">
                Accepts PNG, JPG, JPEG, TIFF, or BMP infrared imagery (up to 15MB)
              </p>
            </div>

            <div>
              <label
                htmlFor="fairy-thermal-file-input"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-[#FFDBDB] text-xs font-bold text-[#5E1D2D] border border-[#FDC3D1] cursor-pointer shadow-sm transition-all hover:scale-105 active:scale-95"
              >
                <FileImage className="w-3.5 h-3.5 text-[#FB8CAC]" />
                <span>Browse Local Files</span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Error Message Box */}
      {error && (
        <div className="bg-[#FFDBDB] border border-[#FDA8BF] rounded-[24px] p-4 flex items-start gap-3 text-xs text-[#44101D] shadow-sm">
          <AlertCircle className="w-5 h-5 text-[#FB8CAC] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-sm text-[#44101D]">Upload Notice</p>
            <p className="mt-0.5 text-[#5E1D2D]">{error}</p>
          </div>
          <button 
            onClick={() => setError(null)}
            className="text-[#8F3F56] hover:text-[#44101D]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Action / Analyse Button */}
      {selectedFile && (
        <div className="flex flex-col items-center justify-center pt-2 space-y-4">
          <button
            type="button"
            onClick={handleUploadAndAnalyze}
            disabled={loading}
            className={`flex items-center gap-3 px-10 py-4 rounded-full font-bold text-sm shadow-[0_8px_30px_rgba(251,140,172,0.45)] transition-all ${
              loading
                ? 'bg-[#FDC3D1] text-[#8F3F56] cursor-not-allowed'
                : 'bg-gradient-to-r from-[#FDA8BF] to-[#FB8CAC] hover:from-[#FB8CAC] hover:to-[#FDA8BF] text-white hover:scale-105 active:scale-95'
            }`}
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Analysing Thermogram...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white" />
                <span>Execute Thermal Fault Analysis</span>
              </>
            )}
          </button>

          {loading && progressStep && (
            <p className="text-xs text-[#8F3F56] font-medium animate-pulse font-serif italic">
              {progressStep}
            </p>
          )}
        </div>
      )}

    </div>
  );
}
