import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Layers, 
  Database, 
  BarChart2, 
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Info
} from 'lucide-react';
import { getModelInfo } from '../services/api';

export default function ModelInfoPage() {
  const [modelInfo, setModelInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchModelData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getModelInfo();
      setModelInfo(data);
    } catch (err) {
      setError(err.message || 'Failed to retrieve model info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelData();
  }, []);

  const metrics = modelInfo?.evaluationMetrics;
  const hasEvaluatedMetrics = metrics && metrics.accuracy !== null && metrics.accuracy !== undefined;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-[#8F3F56] border border-[#FDC3D1] text-xs font-semibold tracking-wider uppercase mb-2 shadow-sm">
            <Cpu className="w-3.5 h-3.5 text-[#FB8CAC]" />
            <span>Neural Specifications</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#44101D] tracking-tight">
            Deep Learning Architecture &amp; Intelligence
          </h1>
          <p className="text-sm text-[#8F3F56] mt-1 font-medium">
            ResNet-18 transfer-learning architecture, dataset splits, and empirical evaluation metrics.
          </p>
        </div>

        <button
          onClick={fetchModelData}
          disabled={loading}
          className="p-3 rounded-full bg-white hover:bg-[#FFEAEF] text-[#8F3F56] border border-[#FDC3D1] shadow-sm self-start sm:self-auto transition-all hover:scale-105"
          title="Reload metadata"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="py-24 text-center text-[#8F3F56] text-xs">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#FDA8BF]" />
          Loading neural architecture specifications...
        </div>
      ) : error ? (
        <div className="bg-[#FFDBDB] border border-[#FDA8BF] rounded-[24px] p-5 text-xs text-[#44101D] shadow-sm">
          {error}
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Top Specifications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="bg-white border border-[#FDC3D1] rounded-[28px] p-6 shadow-[0_10px_30px_rgba(253,168,191,0.18)]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8F3F56] block mb-1">
                Model Backbone
              </span>
              <p className="font-editorial text-2xl font-bold text-[#44101D]">{modelInfo.modelName}</p>
              <span className="text-xs text-[#FB8CAC] font-semibold mt-1 block">PyTorch Transfer Learning</span>
            </div>

            <div className="bg-white border border-[#FDC3D1] rounded-[28px] p-6 shadow-[0_10px_30px_rgba(253,168,191,0.18)]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8F3F56] block mb-1">
                Model Checkpoint
              </span>
              <p className="font-editorial text-2xl font-bold text-[#44101D] font-mono">{modelInfo.version}</p>
              <span className="text-xs text-[#8F3F56] mt-1 block font-medium">
                {modelInfo.isTrainedWeightsAvailable ? 'Calibrated Weights' : 'Demo Initialized'}
              </span>
            </div>

            <div className="bg-white border border-[#FDC3D1] rounded-[28px] p-6 shadow-[0_10px_30px_rgba(253,168,191,0.18)]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8F3F56] block mb-1">
                Inference Target
              </span>
              <p className="font-editorial text-2xl font-bold text-[#44101D] uppercase font-mono">{modelInfo.device}</p>
              <span className="text-xs text-[#FB8CAC] mt-1 block font-semibold">Native Acceleration</span>
            </div>

            <div className="bg-white border border-[#FDC3D1] rounded-[28px] p-6 shadow-[0_10px_30px_rgba(253,168,191,0.18)]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8F3F56] block mb-1">
                Weight Calibration
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-2.5 h-2.5 rounded-full ${modelInfo.isTrainedWeightsAvailable ? 'bg-[#FB8CAC]' : 'bg-[#FDA8BF]'}`} />
                <p className="font-editorial text-xl font-bold text-[#44101D]">
                  {modelInfo.isTrainedWeightsAvailable ? 'Active & Calibrated' : 'Pretrained Head'}
                </p>
              </div>
              <span className="text-[11px] text-[#8F3F56] mt-1 block">
                {modelInfo.isTrainedWeightsAvailable ? 'Serialized in ml/weights/' : 'Honest Demo Mode'}
              </span>
            </div>
          </div>

          {/* Supported Fault Categories */}
          <div className="bg-white border border-[#FDC3D1] rounded-[32px] p-7 shadow-[0_12px_36px_rgba(253,168,191,0.20)] space-y-4">
            <h3 className="font-editorial text-2xl font-bold text-[#44101D] flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#FB8CAC]" />
              Supported Thermal Fault Classes
            </h3>
            <p className="text-xs text-[#8F3F56] font-medium">
              Classes modeled in the customized 5-way softmax classification head:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-1">
              {[
                { name: 'Normal', desc: 'Even thermodynamic heat dissipation across equipment body.' },
                { name: 'Overheating', desc: 'Widespread high-temperature saturation over a winding or phase.' },
                { name: 'Electrical Fault', desc: 'Severe point contact resistance arcing at terminal bolts.' },
                { name: 'Insulation Fault', desc: 'Dielectric breakdown leakage along insulator surface boundary.' },
                { name: 'Abnormal Hotspot', desc: 'Localized thermal concentration at bolted connector joint.' }
              ].map((cls) => (
                <div key={cls.name} className="bg-[#FFF7F9] p-4 rounded-[22px] border border-[#FDC3D1]/80 space-y-1.5 shadow-xs">
                  <div className="font-editorial font-bold text-base text-[#44101D]">{cls.name}</div>
                  <p className="text-[11px] text-[#8F3F56] leading-relaxed">{cls.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dataset & Evaluation Metrics Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Left: Dataset Information */}
            <div className="bg-white border border-[#FDC3D1] rounded-[32px] p-7 shadow-[0_12px_36px_rgba(253,168,191,0.20)] space-y-4">
              <h3 className="font-editorial text-2xl font-bold text-[#44101D] flex items-center gap-2">
                <Database className="w-5 h-5 text-[#FB8CAC]" />
                Dataset Architecture &amp; Splits
              </h3>

              <div className="space-y-3 text-xs">
                <div className="bg-[#FFF7F9] p-3.5 rounded-2xl border border-[#FDC3D1]">
                  <span className="text-[#8F3F56] block text-[10px] uppercase font-bold">Split Distribution</span>
                  <span className="font-semibold text-[#44101D]">
                    {modelInfo.datasetInfo?.splits || '70% Train / 15% Validation / 15% Test'}
                  </span>
                </div>

                <div className="bg-[#FFF7F9] p-3.5 rounded-2xl border border-[#FDC3D1]">
                  <span className="text-[#8F3F56] block text-[10px] uppercase font-bold">Data Augmentation</span>
                  <span className="text-[#5E1D2D] leading-relaxed">
                    {modelInfo.datasetInfo?.augmentation || 'RandomHorizontalFlip (p=0.5), RandomRotation (±10°), ColorJitter'}
                  </span>
                </div>

                <div className="bg-[#FFF7F9] p-3.5 rounded-2xl border border-[#FDC3D1]">
                  <span className="text-[#8F3F56] block text-[10px] uppercase font-bold">Input Dimensions &amp; Normalization</span>
                  <span className="font-mono text-[#5E1D2D]">
                    224×224 px • Mean [0.485, 0.456, 0.406] • Std [0.229, 0.224, 0.225]
                  </span>
                </div>

                <div className="bg-[#FFF7F9] p-3.5 rounded-2xl border border-[#FDC3D1]">
                  <span className="text-[#8F3F56] block text-[10px] uppercase font-bold">Retraining Pipeline</span>
                  <code className="text-[#44101D] font-mono font-bold block mt-1 bg-white p-2 rounded-xl border border-[#FDC3D1]">
                    python backend/ml/train.py
                  </code>
                </div>
              </div>
            </div>

            {/* Right: Evaluated Metrics */}
            <div className="bg-white border border-[#FDC3D1] rounded-[32px] p-7 shadow-[0_12px_36px_rgba(253,168,191,0.20)] space-y-4">
              <h3 className="font-editorial text-2xl font-bold text-[#44101D] flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-[#FB8CAC]" />
                Empirical Test Evaluation
              </h3>

              {hasEvaluatedMetrics ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="bg-[#FFF7F9] p-3.5 rounded-2xl border border-[#FDC3D1]">
                      <span className="text-[10px] text-[#8F3F56] uppercase font-bold block">Accuracy</span>
                      <span className="font-editorial text-2xl font-bold text-[#44101D]">
                        {(metrics.accuracy * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="bg-[#FFF7F9] p-3.5 rounded-2xl border border-[#FDC3D1]">
                      <span className="text-[10px] text-[#8F3F56] uppercase font-bold block">Macro F1</span>
                      <span className="font-editorial text-2xl font-bold text-[#FB8CAC]">
                        {(metrics.macro_f1 * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="bg-[#FFF7F9] p-3.5 rounded-2xl border border-[#FDC3D1]">
                      <span className="text-[10px] text-[#8F3F56] uppercase font-bold block">Precision</span>
                      <span className="font-editorial text-2xl font-bold text-[#44101D]">
                        {(metrics.macro_precision * 100).toFixed(1)}%
                      </span>
                    </div>

                    <div className="bg-[#FFF7F9] p-3.5 rounded-2xl border border-[#FDC3D1]">
                      <span className="text-[10px] text-[#8F3F56] uppercase font-bold block">Recall</span>
                      <span className="font-editorial text-2xl font-bold text-[#44101D]">
                        {(metrics.macro_recall * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Confusion Matrix Table in Soft Blush & White */}
                  {metrics.confusion_matrix && (
                    <div className="bg-[#FFF7F9] p-4 rounded-2xl border border-[#FDC3D1] text-xs">
                      <span className="font-editorial text-base font-bold text-[#44101D] block mb-2">
                        Confusion Matrix (Test Evaluation)
                      </span>
                      <div className="overflow-x-auto">
                        <table className="w-full text-center border-collapse">
                          <thead>
                            <tr className="border-b border-[#FDC3D1] text-[10px] text-[#8F3F56] uppercase">
                              <th className="text-left py-1 pr-2">Actual \ Pred</th>
                              {modelInfo.supportedClasses.map(c => (
                                <th key={c} className="py-1 px-1 font-semibold truncate max-w-[60px]">{c.slice(0, 4)}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {metrics.confusion_matrix.map((row, rIdx) => (
                              <tr key={rIdx} className="border-b border-[#FDC3D1]/50 text-xs font-mono">
                                <td className="text-left py-1 font-semibold text-[#8F3F56] pr-2">
                                  {modelInfo.supportedClasses[rIdx]?.slice(0, 8)}
                                </td>
                                {row.map((val, cIdx) => (
                                  <td 
                                    key={cIdx} 
                                    className={`py-1.5 px-1 rounded ${
                                      rIdx === cIdx 
                                        ? 'bg-[#FFDBDB] text-[#44101D] font-bold' 
                                        : 'text-[#8F3F56]'
                                    }`}
                                  >
                                    {val}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#FFF7F9] p-6 rounded-2xl border border-[#FDC3D1] text-center space-y-2">
                  <Info className="w-7 h-7 text-[#FB8CAC] mx-auto" />
                  <p className="text-xs font-semibold text-[#44101D]">
                    No custom trained weights evaluated yet.
                  </p>
                  <p className="text-[11px] text-[#8F3F56]">
                    Run <code className="text-[#FB8CAC] font-mono">python backend/ml/train.py</code> to calibrate empirical metrics.
                  </p>
                </div>
              )}
            </div>

          </div>

          {/* Operational Constraints & Disclaimers */}
          <div className="bg-white border border-[#FDC3D1] rounded-[32px] p-7 shadow-[0_12px_36px_rgba(253,168,191,0.20)] space-y-3">
            <h3 className="font-editorial text-2xl font-bold text-[#44101D] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FB8CAC]" />
              Engineering Constraints &amp; Safe Operation
            </h3>

            <ul className="space-y-2 text-xs text-[#5E1D2D] list-disc list-inside leading-relaxed">
              {modelInfo.limitations?.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>

            <div className="pt-3 text-[11px] text-[#8F3F56] border-t border-[#FFDBDB]">
              <b>Regulatory Disclaimer:</b> Automated deep learning predictions support routine inspection patrols and must not replace calibrated contact pyrometry, electrical disconnect procedures, or qualified technician judgment.
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
