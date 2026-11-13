import React from 'react';
import { Sparkles, PieChart } from 'lucide-react';

export default function FaultDistributionChart({ faultTypeBreakdown = {}, total = 0 }) {
  // Color palette restricted strictly to approved tones:
  // Bubblegum Tint (#FB8CAC), Baby Pink (#FDA8BF), Pastel Pink (#FDC3D1), Soft Blush (#FFDBDB), White (#FFFFFF)
  const categories = [
    { name: 'Normal', color: '#FDA8BF', tagColor: 'bg-[#FFDBDB]', label: 'Normal Dissipation' },
    { name: 'Overheating', color: '#FB8CAC', tagColor: 'bg-[#FB8CAC]', label: 'Thermal Saturation' },
    { name: 'Electrical Fault', color: '#FDA8BF', tagColor: 'bg-[#FDA8BF]', label: 'Contact Resistance Arc' },
    { name: 'Insulation Fault', color: '#FDC3D1', tagColor: 'bg-[#FDC3D1]', label: 'Dielectric Gradient Leak' },
    { name: 'Abnormal Hotspot', color: '#5E1D2D', tagColor: 'bg-[#FFDBDB]', label: 'Point Anomaly' },
  ];

  const totalCount = total > 0 ? total : Object.values(faultTypeBreakdown).reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white border border-[#FDC3D1] rounded-[28px] p-6 sm:p-7 shadow-[0_10px_32px_rgba(253,168,191,0.20)]">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#FFDBDB]">
        <div>
          <h3 className="font-editorial text-2xl font-bold text-[#44101D] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#FB8CAC]" />
            Fault Distribution
          </h3>
          <p className="text-xs text-[#8F3F56] mt-0.5 font-medium">
            Proportional frequency across analyzed thermograms
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#FFEAEF] text-[#5E1D2D] border border-[#FDC3D1]">
          {totalCount} Total Scans
        </span>
      </div>

      {totalCount === 0 ? (
        <div className="h-52 flex flex-col items-center justify-center text-[#8F3F56] text-xs">
          <PieChart className="w-10 h-10 mb-2 stroke-1 text-[#FDA8BF]" />
          <span className="font-semibold text-sm text-[#5E1D2D]">No Scans Analyzed Yet</span>
          <span className="text-[11px] text-[#8F3F56] mt-0.5">Upload a thermal scan to illuminate distribution metrics</span>
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((cat) => {
            const count = faultTypeBreakdown[cat.name] || 0;
            const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;

            return (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="w-3 h-3 rounded-full border border-white shadow-sm shrink-0" 
                      style={{ backgroundColor: cat.color }} 
                    />
                    <span className="font-semibold text-[#44101D]">{cat.name}</span>
                    <span className="text-[10px] text-[#8F3F56] hidden sm:inline font-serif italic">({cat.label})</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[#8F3F56] font-medium">{count} scans</span>
                    <span className="font-bold text-[#44101D] w-10 text-right font-editorial text-sm">{pct}%</span>
                  </div>
                </div>

                {/* Delicate Pill Progress Track */}
                <div className="w-full h-3 bg-[#FFF0F3] rounded-full overflow-hidden p-0.5 border border-[#FFDBDB]">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out shadow-sm"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: cat.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
