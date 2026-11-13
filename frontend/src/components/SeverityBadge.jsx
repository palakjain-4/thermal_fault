import React from 'react';

export default function SeverityBadge({ severity, condition }) {
  if (condition === 'Normal' || !severity || severity === 'None') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white text-[#5E1D2D] border border-[#FDC3D1] shadow-sm">
        <span className="w-1.5 h-1.5 rounded-full bg-[#FDA8BF]" />
        Normal Condition
      </span>
    );
  }

  const configs = {
    High: {
      bg: 'bg-[#FDA8BF]',
      text: 'text-[#44101D]',
      border: 'border-[#FB8CAC]',
      dot: 'bg-[#FB8CAC] animate-pulse',
      label: 'High Severity Anomaly',
    },
    Medium: {
      bg: 'bg-[#FDC3D1]',
      text: 'text-[#44101D]',
      border: 'border-[#FDA8BF]',
      dot: 'bg-[#FB8CAC]',
      label: 'Medium Severity Anomaly',
    },
    Low: {
      bg: 'bg-[#FFDBDB]',
      text: 'text-[#5E1D2D]',
      border: 'border-[#FDC3D1]',
      dot: 'bg-[#FDA8BF]',
      label: 'Low Severity Anomaly',
    },
  };

  const c = configs[severity] || configs.Medium;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text} border ${c.border} shadow-sm`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
