import React from 'react';

export default function StatCard({ title, value, icon: Icon, variant = 'blush', subtitle }) {
  // Variations using approved palette: Soft Blush (#FFDBDB), Pastel Pink (#FDC3D1), Baby Pink (#FDA8BF), Bubblegum (#FB8CAC), White (#FFFFFF)
  const variants = {
    blush: {
      cardBg: 'bg-white',
      border: 'border-[#FDC3D1]',
      iconBg: 'bg-[#FFDBDB]',
      iconColor: 'text-[#FB8CAC]',
      tagBg: 'bg-[#FFF0F3]',
      tagText: 'text-[#8F3F56]',
    },
    pastel: {
      cardBg: 'bg-white',
      border: 'border-[#FDA8BF]',
      iconBg: 'bg-[#FDC3D1]',
      iconColor: 'text-[#5E1D2D]',
      tagBg: 'bg-[#FFDBDB]',
      tagText: 'text-[#5E1D2D]',
    },
    baby: {
      cardBg: 'bg-white',
      border: 'border-[#FDA8BF]',
      iconBg: 'bg-[#FDA8BF]',
      iconColor: 'text-[#44101D]',
      tagBg: 'bg-[#FFEAEF]',
      tagText: 'text-[#5E1D2D]',
    },
    bubblegum: {
      cardBg: 'bg-white',
      border: 'border-[#FB8CAC]',
      iconBg: 'bg-[#FB8CAC]',
      iconColor: 'text-white',
      tagBg: 'bg-[#FDC3D1]',
      tagText: 'text-[#44101D]',
    },
  };

  const v = variants[variant] || variants.blush;

  return (
    <div className={`${v.cardBg} border ${v.border} rounded-[28px] p-6 shadow-[0_10px_32px_rgba(253,168,191,0.20)] hover:shadow-[0_16px_38px_rgba(251,140,172,0.32)] hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden group`}>
      
      {/* Decorative ambient subtle circle in corner */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-[#FFDBDB]/40 pointer-events-none transition-transform group-hover:scale-125 duration-500" />

      <div className="flex items-center justify-between mb-4 relative z-10">
        <span className="text-[11px] font-semibold tracking-widest uppercase text-[#8F3F56]">
          {title}
        </span>
        <div className={`w-10 h-10 rounded-2xl ${v.iconBg} ${v.iconColor} flex items-center justify-center shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="font-editorial text-4xl sm:text-5xl font-bold text-[#44101D] tracking-tight relative z-10">
        {value}
      </div>

      {subtitle && (
        <div className="mt-3 pt-3 border-t border-[#FFDBDB] flex items-center gap-1.5 relative z-10">
          <span className="text-xs text-[#8F3F56] font-medium">
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
}
