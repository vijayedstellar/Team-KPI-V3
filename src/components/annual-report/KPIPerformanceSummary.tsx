import React from 'react';
import { Target } from 'lucide-react';

interface KPIData {
  name: string;
  actual: number;
  target: number;
  unit: string;
  achievement: number;
}

interface KPIPerformanceSummaryProps {
  kpiData: KPIData[];
}

const KPIPerformanceSummary: React.FC<KPIPerformanceSummaryProps> = ({ kpiData }) => {
  const getPerformanceColor = (achievement: number) => {
    if (achievement >= 120) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (achievement >= 84) return 'bg-green-100 text-green-800 border-green-200';
    if (achievement >= 67) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-blue-600" />
        KPI Performance Summary
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiData.map((kpi) => (
          <div key={kpi.name} className={`p-4 rounded-lg border-2 ${getPerformanceColor(kpi.achievement)}`}>
            <div className="font-semibold text-gray-900 text-sm mb-2">{kpi.name}</div>
            <div className="text-2xl font-bold mb-1">{kpi.actual.toLocaleString()}</div>
            <div className="text-xs text-gray-600 mb-2">Target: {kpi.target.toLocaleString()} {kpi.unit}</div>
            <div className="text-sm font-semibold">
              {kpi.achievement}% Achievement
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KPIPerformanceSummary;