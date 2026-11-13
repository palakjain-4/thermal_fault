import React, { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Trash2, 
  Eye, 
  Download, 
  RefreshCw, 
  Filter, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import SeverityBadge from '../components/SeverityBadge';
import { getAnalyses, deleteAnalysis, getReportDownloadUrl } from '../services/api';

export default function HistoryPage({ onViewAnalysis, onNewAnalysis }) {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCondition, setFilterCondition] = useState('All');

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAnalyses(100, 0);
      setAnalyses(data);
    } catch (err) {
      setError(err.message || 'Failed to load analysis history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleDelete = async (id, filename, e) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to remove analysis for "${filename}" from the archive?`)) return;
    try {
      await deleteAnalysis(id);
      setAnalyses(prev => prev.filter(item => (item._id || item.id) !== id));
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const filteredAnalyses = analyses.filter((item) => {
    const matchesSearch = 
      (item.imageFilename || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.faultType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item._id || item.id || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCondition = 
      filterCondition === 'All' || item.predictedCondition === filterCondition;

    return matchesSearch && matchesCondition;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-[#8F3F56] border border-[#FDC3D1] text-xs font-semibold tracking-wider uppercase mb-2 shadow-sm">
            <History className="w-3.5 h-3.5 text-[#FB8CAC]" />
            <span>Inspection Archive</span>
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-[#44101D] tracking-tight">
            Historical Thermographic Inspections
          </h1>
          <p className="text-sm text-[#8F3F56] mt-1 font-medium">
            Chronological audit log of all infrared evaluations stored in MongoDB.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchRecords}
            disabled={loading}
            className="p-3 rounded-full bg-white hover:bg-[#FFEAEF] text-[#8F3F56] border border-[#FDC3D1] shadow-sm transition-all hover:scale-105"
            title="Refresh history"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          <button
            onClick={onNewAnalysis}
            className="px-6 py-3 rounded-full bg-gradient-to-r from-[#FDA8BF] to-[#FB8CAC] hover:from-[#FB8CAC] hover:to-[#FDA8BF] text-white text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            New Analysis ✦
          </button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-[#FDC3D1] p-4 sm:p-5 rounded-[26px] shadow-[0_8px_25px_rgba(253,168,191,0.15)]">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#FDA8BF]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by filename or fault..."
            className="w-full bg-[#FFF0F3] border border-[#FDC3D1] rounded-full pl-10 pr-4 py-2.5 text-xs text-[#44101D] placeholder-[#A24E65] focus:outline-none focus:border-[#FB8CAC] focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-[#FB8CAC]" />
          <span className="text-xs text-[#8F3F56] font-medium mr-1">Condition:</span>
          {['All', 'Normal', 'Fault Detected'].map((cond) => (
            <button
              key={cond}
              onClick={() => setFilterCondition(cond)}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 ${
                filterCondition === cond
                  ? 'bg-[#FB8CAC] text-white shadow-xs'
                  : 'bg-[#FFF0F3] text-[#8F3F56] hover:bg-[#FFEAEF] hover:text-[#44101D] border border-[#FDC3D1]/60'
              }`}
            >
              {cond}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-[#FFDBDB] border border-[#FDA8BF] rounded-[24px] p-4 flex items-center gap-3 text-xs text-[#44101D] shadow-sm">
          <AlertCircle className="w-5 h-5 text-[#FB8CAC] shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Records Cards / Elegant List */}
      <div className="bg-white border border-[#FDC3D1] rounded-[32px] overflow-hidden shadow-[0_12px_36px_rgba(253,168,191,0.20)] p-6 sm:p-7">
        {loading ? (
          <div className="py-24 text-center text-[#8F3F56] text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#FDA8BF]" />
            Loading inspection archive...
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <div className="py-24 text-center text-[#8F3F56] text-xs space-y-2">
            <Sparkles className="w-10 h-10 text-[#FDA8BF] mx-auto stroke-1" />
            <p className="font-semibold text-sm text-[#44101D]">No inspection records found</p>
            <p className="text-[11px]">Adjust your filter keywords or upload a new thermogram</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredAnalyses.map((rec) => {
              const id = rec._id || rec.id;
              const isNormal = rec.predictedCondition === 'Normal';

              return (
                <div
                  key={id}
                  onClick={() => onViewAnalysis(rec)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[22px] bg-[#FFF7F9] hover:bg-[#FFEAEF] border border-[#FDC3D1]/60 transition-all duration-200 cursor-pointer group shadow-xs"
                >
                  {/* Left: Thumbnail & Filename */}
                  <div className="flex items-center gap-4 min-w-0">
                    <img
                      src={rec.annotatedImageUrl || rec.rawImageUrl}
                      alt="scan thumbnail"
                      className="w-14 h-14 rounded-2xl object-cover bg-white border border-[#FDC3D1] shrink-0 shadow-sm"
                    />
                    <div className="min-w-0">
                      <span className="font-editorial text-base font-bold text-[#44101D] group-hover:text-[#FB8CAC] transition-colors block truncate max-w-[200px] sm:max-w-xs">
                        {rec.imageFilename}
                      </span>
                      <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#8F3F56]">
                        <span>{rec.createdAt ? new Date(rec.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                        <span>•</span>
                        <span className="font-semibold text-[#5E1D2D]">{rec.faultType}</span>
                        <span>•</span>
                        <span className="font-mono text-[11px] text-[#A24E65]">ID: {id?.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Badge, Confidence, & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#FDC3D1]/40">
                    <SeverityBadge severity={rec.severity} condition={rec.predictedCondition} />

                    <span className="font-editorial text-base font-bold text-[#44101D] w-12 text-center">
                      {Math.round(rec.confidence * 100)}%
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewAnalysis(rec);
                        }}
                        className="p-2 rounded-full hover:bg-white text-[#8F3F56] hover:text-[#44101D] transition-colors shadow-xs"
                        title="View Diagnostic Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(getReportDownloadUrl(id), '_blank');
                        }}
                        className="p-2 rounded-full hover:bg-white text-[#8F3F56] hover:text-[#FB8CAC] transition-colors shadow-xs"
                        title="Download PDF Report"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={(e) => handleDelete(id, rec.imageFilename, e)}
                        className="p-2 rounded-full hover:bg-white text-[#8F3F56] hover:text-[#44101D] transition-colors shadow-xs"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
