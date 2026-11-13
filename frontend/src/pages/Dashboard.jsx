import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  UploadCloud, 
  Flame, 
  RefreshCw, 
  Clock, 
  Eye,
  Trash2,
  Database,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import StatCard from '../components/StatCard';
import SeverityBadge from '../components/SeverityBadge';
import FaultDistributionChart from '../components/FaultDistributionChart';
import { getDashboardStats, deleteAnalysis } from '../services/api';

export default function Dashboard({ onStartAnalysis, onViewAnalysis, systemStatus }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this analysis record from your studio?')) return;
    try {
      await deleteAnalysis(id);
      fetchStats();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const isDbOnline = systemStatus?.database?.connected;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Database Warning Banner if MongoDB is offline */}
      {!isDbOnline && (
        <div className="bg-[#FFDBDB] border border-[#FDA8BF] rounded-[24px] p-5 flex items-start gap-3.5 shadow-sm">
          <Database className="w-5 h-5 text-[#FB8CAC] mt-0.5 shrink-0" />
          <div className="flex-1 text-xs">
            <h4 className="font-editorial text-base font-bold text-[#44101D]">MongoDB Connection Offline</h4>
            <p className="text-[#5E1D2D] mt-1 leading-relaxed">
              The studio backend cannot reach MongoDB at <code className="bg-white/70 px-1.5 py-0.5 rounded text-[#44101D] font-mono">mongodb://localhost:27017</code>. 
              The application will run in local inspection mode; database persistence will resume when MongoDB is running.
            </p>
            <p className="text-[#8F3F56] mt-1">
              Terminal command: <code className="text-[#44101D] font-semibold">brew services start mongodb-community</code> or <code className="text-[#44101D] font-semibold">mongod --dbpath &lt;data_dir&gt;</code>.
            </p>
          </div>
          <button 
            onClick={fetchStats}
            className="px-4 py-2 rounded-full bg-white hover:bg-[#FFEAEF] text-[#5E1D2D] text-xs font-semibold border border-[#FDC3D1] shadow-sm shrink-0 transition-colors"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Welcoming Studio Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-white via-[#FFF0F3] to-[#FFDBDB]/70 border border-[#FDC3D1] rounded-[36px] p-8 sm:p-12 shadow-[0_16px_40px_rgba(253,168,191,0.25)]">
        {/* Subtle decorative sparkles in background */}
        <div className="absolute top-4 right-8 text-[#FDA8BF]/40 text-4xl select-none pointer-events-none font-serif">✧</div>
        <div className="absolute bottom-6 right-28 text-[#FB8CAC]/30 text-2xl select-none pointer-events-none font-serif">✦</div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-[#8F3F56] border border-[#FDC3D1] text-xs font-semibold tracking-wider uppercase mb-3 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#FB8CAC]" />
              <span>Diagnostic Studio Environment</span>
            </div>
            
            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-bold text-[#44101D] tracking-tight leading-[1.1]">
              Your Thermal Analysis Studio
            </h1>
            
            <p className="text-sm sm:text-base text-[#8F3F56] mt-3 leading-relaxed font-normal">
              A fairy-soft, high-precision thermographic platform combining OpenCV thermal gradient 
              segmentation with ResNet-18 transfer learning to isolate electrical faults and hotspots.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={fetchStats}
              disabled={loading}
              className="p-3.5 rounded-full bg-white hover:bg-[#FFEAEF] text-[#8F3F56] border border-[#FDC3D1] shadow-sm transition-all hover:scale-105"
              title="Refresh studio statistics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={onStartAnalysis}
              className="flex items-center gap-2.5 px-7 py-4 rounded-full bg-gradient-to-r from-[#FDA8BF] to-[#FB8CAC] hover:from-[#FB8CAC] hover:to-[#FDA8BF] text-white font-semibold text-sm shadow-[0_8px_25px_rgba(251,140,172,0.45)] transition-all hover:scale-105 active:scale-95"
            >
              <UploadCloud className="w-4 h-4 text-white" />
              <span>Analyse New Thermal Scan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Varied KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Scans Analyzed"
          value={stats ? stats.totalAnalyzed : (loading ? '—' : 0)}
          icon={Sparkles}
          variant="blush"
          subtitle="Processed thermograms"
        />
        <StatCard
          title="Normal Condition"
          value={stats ? stats.normalCount : (loading ? '—' : 0)}
          icon={ShieldCheck}
          variant="pastel"
          subtitle={stats?.totalAnalyzed ? `${Math.round((stats.normalCount / stats.totalAnalyzed) * 100)}% equipment healthy` : "No faults detected"}
        />
        <StatCard
          title="Thermal Faults"
          value={stats ? stats.faultCount : (loading ? '—' : 0)}
          icon={AlertTriangle}
          variant="baby"
          subtitle={stats?.totalAnalyzed ? `${Math.round((stats.faultCount / stats.totalAnalyzed) * 100)}% anomalous heat` : "Zero faults flagged"}
        />
        <StatCard
          title="Severe Hotspots"
          value={stats?.severityBreakdown?.High || 0}
          icon={Flame}
          variant="bubblegum"
          subtitle="Critical priority locations"
        />
      </div>

      {/* Charts & Recent Inspections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (5 cols): Fault Distribution */}
        <div className="lg:col-span-5">
          <FaultDistributionChart 
            faultTypeBreakdown={stats?.faultTypeBreakdown || {}} 
            total={stats?.totalAnalyzed || 0}
          />
        </div>

        {/* Right Column (7 cols): Recent Analysis History */}
        <div className="lg:col-span-7 bg-white border border-[#FDC3D1] rounded-[28px] p-6 sm:p-7 shadow-[0_10px_32px_rgba(253,168,191,0.20)]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#FFDBDB]">
            <div>
              <h3 className="font-editorial text-2xl font-bold text-[#44101D] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#FB8CAC]" />
                Recent Studio Analyses
              </h3>
              <p className="text-xs text-[#8F3F56] mt-0.5 font-medium">
                Latest evaluations logged in system history
              </p>
            </div>

            {stats?.recentAnalyses?.length > 0 && (
              <button
                onClick={() => onViewAnalysis('all')}
                className="text-xs font-semibold text-[#FB8CAC] hover:text-[#5E1D2D] flex items-center gap-1 transition-colors"
              >
                View full history <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {loading ? (
            <div className="py-16 text-center text-[#8F3F56] text-xs">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#FDA8BF]" />
              Loading studio inspection records...
            </div>
          ) : (!stats?.recentAnalyses || stats.recentAnalyses.length === 0) ? (
            <div className="py-16 text-center text-[#8F3F56] text-xs flex flex-col items-center">
              <UploadCloud className="w-10 h-10 text-[#FDA8BF] mb-2 stroke-1" />
              <p className="font-semibold text-sm text-[#44101D]">No Analyses Recorded Yet</p>
              <button
                onClick={onStartAnalysis}
                className="mt-3 px-5 py-2.5 rounded-full bg-[#FFEAEF] hover:bg-[#FFDBDB] text-xs font-semibold text-[#5E1D2D] border border-[#FDC3D1] transition-colors"
              >
                Analyse your first thermal scan ✦
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentAnalyses.map((rec) => (
                <div 
                  key={rec._id || rec.id}
                  onClick={() => onViewAnalysis(rec)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FFF7F9] hover:bg-[#FFEAEF] border border-[#FDC3D1]/60 transition-all duration-200 cursor-pointer group"
                >
                  {/* Left: Thumbnail & Filename */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img 
                      src={rec.annotatedImageUrl || rec.rawImageUrl} 
                      alt="scan thumbnail" 
                      className="w-12 h-12 rounded-2xl object-cover bg-white border border-[#FDC3D1] shrink-0 shadow-sm"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-xs text-[#44101D] group-hover:text-[#FB8CAC] transition-colors truncate max-w-[160px] sm:max-w-[220px]">
                        {rec.imageFilename}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-[#8F3F56]">
                          {rec.createdAt ? new Date(rec.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                        </span>
                        <span className="text-[10px] text-[#8F3F56]">•</span>
                        <span className="text-[10px] font-semibold text-[#5E1D2D]">{rec.faultType}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Badge & Actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <SeverityBadge severity={rec.severity} condition={rec.predictedCondition} />

                    <span className="font-editorial text-sm font-bold text-[#5E1D2D] hidden sm:block">
                      {Math.round(rec.confidence * 100)}%
                    </span>

                    <button
                      onClick={(e) => handleDelete(rec._id || rec.id, e)}
                      className="p-1.5 rounded-full hover:bg-white text-[#8F3F56] hover:text-[#44101D] transition-colors"
                      title="Remove record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
