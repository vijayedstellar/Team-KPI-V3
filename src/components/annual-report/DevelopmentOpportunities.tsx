import React from 'react';
import { AlertTriangle } from 'lucide-react';

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

interface DevelopmentOpportunitiesProps {
  kpiData: KPIData[];
  goals: GoalData[];
}

const DevelopmentOpportunities: React.FC<DevelopmentOpportunitiesProps> = ({ kpiData, goals }) => {
  const getUnderperformingKPIs = () => {
    return kpiData
      .filter(kpi => kpi.achievement < 84)
      .sort((a, b) => a.achievement - b.achievement)
      .slice(0, 3);
  };

  const getGoalChallenges = () => {
    const completedGoals = goals.filter(goal => goal.status === 'completed');
    const totalGoals = goals.length;
    const completionRate = totalGoals > 0 ? (completedGoals.length / totalGoals) * 100 : 0;
    
    const overdueGoals = completedGoals.filter(goal => {
      if (!goal.completed_date) return false;
      return new Date(goal.completed_date) > new Date(goal.deadline);
    });
    
    const overdueRate = completedGoals.length > 0 ? (overdueGoals.length / completedGoals.length) * 100 : 0;
    
    return { completionRate, overdueRate, totalGoals };
  };

  const underperformingKPIs = getUnderperformingKPIs();
  const goalChallenges = getGoalChallenges();
  const hasGoalChallenges = goals.length > 0 && (goalChallenges.completionRate < 60 || goalChallenges.overdueRate > 30);

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-600" />
        Development Opportunities
      </h3>
      <div className="bg-amber-50 p-6 rounded-lg border border-amber-200">
        <ul className="space-y-3">
          {underperformingKPIs.map((kpi) => (
            <li key={kpi.name} className="flex items-start gap-3">
              <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>
                <strong>{kpi.name}:</strong> Currently at {kpi.achievement}% of target ({kpi.actual.toLocaleString()}/{kpi.target.toLocaleString()}), 
                focus on {kpi.achievement < 50 ? 'fundamental improvements and strategy review' : 'process optimization and efficiency gains'}
              </span>
            </li>
          ))}
          
          {hasGoalChallenges && (
            <>
              {goalChallenges.completionRate < 60 && (
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>
                    <strong>Goal Completion Focus:</strong> {Math.round(goalChallenges.completionRate)}% completion rate suggests need for 
                    better goal planning, resource allocation, and time management strategies
                  </span>
                </li>
              )}
              
              {goalChallenges.overdueRate > 30 && (
                <li className="flex items-start gap-3">
                  <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                  <span>
                    <strong>Deadline Management:</strong> {Math.round(goalChallenges.overdueRate)}% of completed goals were overdue, 
                    indicating opportunity to improve time estimation and project planning skills
                  </span>
                </li>
              )}
            </>
          )}
          
          {underperformingKPIs.length === 0 && !hasGoalChallenges && (
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
              <span>
                <strong>Continuous Improvement:</strong> While performance is strong across most areas, 
                consider exploring advanced techniques and methodologies to further enhance capabilities
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default DevelopmentOpportunities;