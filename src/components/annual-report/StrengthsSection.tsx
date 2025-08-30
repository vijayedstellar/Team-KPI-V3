import React from 'react';
import { TrendingUp } from 'lucide-react';

interface KPIData {
  name: string;
  actual: number;
  target: number;
  unit: string;
  achievement: number;
}

interface GoalData {
  id: string;
  goal_name: string;
  priority: string;
  status: string;
  assigned_date: string;
  deadline: string;
  completed_date?: string;
  notes?: string;
}

interface StrengthsSectionProps {
  kpiData: KPIData[];
  goals: GoalData[];
}

const StrengthsSection: React.FC<StrengthsSectionProps> = ({ kpiData, goals }) => {
  const getTopPerformingKPIs = () => {
    return kpiData
      .filter(kpi => kpi.achievement >= 120)
      .sort((a, b) => b.achievement - a.achievement)
      .slice(0, 5);
  };

  const getGoalStrengths = () => {
    const completedGoals = goals.filter(goal => goal.status === 'completed');
    const totalGoals = goals.length;
    const completionRate = totalGoals > 0 ? (completedGoals.length / totalGoals) * 100 : 0;
    
    const onTimeGoals = completedGoals.filter(goal => {
      if (!goal.completed_date) return false;
      return new Date(goal.completed_date) <= new Date(goal.deadline);
    });
    
    const onTimeRate = completedGoals.length > 0 ? (onTimeGoals.length / completedGoals.length) * 100 : 0;
    
    return { completionRate, onTimeRate, completedGoals: completedGoals.length };
  };

  const topKPIs = getTopPerformingKPIs();
  const goalStrengths = getGoalStrengths();
  const hasGoalStrengths = goals.length > 0 && (goalStrengths.completionRate >= 80 || goalStrengths.onTimeRate >= 80);

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-600" />
        Key Strengths & Achievements
      </h3>
      <div className="bg-green-50 p-6 rounded-lg border border-green-200">
        <ul className="space-y-3">
          {topKPIs.map((kpi, index) => (
            <li key={kpi.name} className="flex items-start gap-3">
              <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>
                <strong>{kpi.name}:</strong> Achieved {kpi.achievement}% of target ({kpi.actual.toLocaleString()}/{kpi.target.toLocaleString()}), 
                demonstrating {kpi.achievement >= 150 ? 'exceptional' : kpi.achievement >= 130 ? 'outstanding' : 'strong'} performance
              </span>
            </li>
          ))}
          
          {hasGoalStrengths && (
            <>
              {goalStrengths.completionRate >= 80 && (
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>
                    <strong>Excellent Goal Achievement:</strong> Completed {goalStrengths.completedGoals} goals with {Math.round(goalStrengths.completionRate)}% completion rate, 
                    showing strong commitment to professional development
                  </span>
                </li>
              )}
              
              {goalStrengths.onTimeRate >= 80 && (
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>
                    <strong>Outstanding Time Management:</strong> {Math.round(goalStrengths.onTimeRate)}% of goals completed on or before deadline, 
                    demonstrating excellent planning and execution skills
                  </span>
                </li>
              )}
            </>
          )}
          
          {topKPIs.length === 0 && !hasGoalStrengths && (
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>
                <strong>Consistent Performance:</strong> Maintained steady performance across all tracked metrics during the review period
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default StrengthsSection;