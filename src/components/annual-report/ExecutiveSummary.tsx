import React from 'react';
import { Award } from 'lucide-react';

interface ExecutiveSummaryProps {
  overallPerformance: number;
  performanceGrade: string;
  monthsTracked: number;
  hasGoalsData: boolean;
  goalsCompletionRate: number;
}

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({
  overallPerformance,
  performanceGrade,
  monthsTracked,
  hasGoalsData,
  goalsCompletionRate
}) => {
  const getGradeColor = (grade: string) => {
    switch (grade.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'bad':
        return 'bg-amber-100 text-amber-800';
      case 'target':
        return 'bg-emerald-100 text-emerald-800';
      case 'good':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Award className="w-5 h-5 text-yellow-600" />
        Executive Summary
      </h3>
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">{overallPerformance}%</div>
            <div className="text-sm text-gray-600 font-medium">Overall Performance</div>
            <div className="text-xs text-gray-500 mt-1">KPI Achievement Rate</div>
          </div>
          <div className="text-center">
            <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getGradeColor(performanceGrade)}`}>
              {performanceGrade.toUpperCase()}
            </div>
            <div className="text-sm text-gray-600 font-medium mt-1">Performance Grade</div>
            <div className="text-xs text-gray-500">Based on KPI Targets</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-indigo-600">{monthsTracked}</div>
            <div className="text-sm text-gray-600 font-medium">Months Tracked</div>
            <div className="text-xs text-gray-500 mt-1">Performance Period</div>
          </div>
          {hasGoalsData && (
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">{goalsCompletionRate}%</div>
              <div className="text-sm text-gray-600 font-medium">Goals Completed</div>
              <div className="text-xs text-gray-500 mt-1">Achievement Rate</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutiveSummary;