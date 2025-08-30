import React from 'react';
import { Target } from 'lucide-react';

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

interface StrategicRecommendationsProps {
  kpiData: KPIData[];
  goals: GoalData[];
  analystDesignation: string;
}

const StrategicRecommendations: React.FC<StrategicRecommendationsProps> = ({ 
  kpiData, 
  goals, 
  analystDesignation 
}) => {
  const getRecommendations = () => {
    const recommendations: string[] = [];
    
    // KPI-based recommendations
    const avgKPIPerformance = kpiData.length > 0 
      ? kpiData.reduce((sum, kpi) => sum + kpi.achievement, 0) / kpiData.length 
      : 0;
    
    const topPerformers = kpiData.filter(kpi => kpi.achievement >= 120);
    const underperformers = kpiData.filter(kpi => kpi.achievement < 84);
    
    // Goal-based recommendations
    const completedGoals = goals.filter(goal => goal.status === 'completed');
    const totalGoals = goals.length;
    const completionRate = totalGoals > 0 ? (completedGoals.length / totalGoals) * 100 : 0;
    const inProgressGoals = goals.filter(goal => goal.status === 'in_progress');
    
    // Generate recommendations based on performance patterns
    if (avgKPIPerformance >= 100 && completionRate >= 80) {
      recommendations.push("**Leadership Development:** Consider mentoring junior team members and sharing successful strategies given exceptional performance across KPIs and goals");
      recommendations.push("**Advanced Specialization:** Explore advanced certifications and specialized training to leverage current strengths");
      recommendations.push("**Goal Expansion:** Set more ambitious goals for the next period given consistent over-achievement");
    } else if (avgKPIPerformance >= 84 && completionRate >= 60) {
      recommendations.push("**Process Optimization:** Document and systematize successful approaches for consistent application");
      recommendations.push("**Skill Enhancement:** Focus on targeted training in areas showing the most improvement potential");
      recommendations.push("**Goal Refinement:** Adjust goal complexity and timelines based on current completion patterns");
    } else {
      recommendations.push("**Foundation Building:** Focus on establishing consistent processes and workflows for core responsibilities");
      recommendations.push("**Support Systems:** Increase mentoring and guidance to improve performance consistency");
      recommendations.push("**Goal Simplification:** Start with simpler, achievable goals to build momentum and confidence");
    }
    
    // Specific KPI recommendations
    if (underperformers.length > 0) {
      const worstKPI = underperformers[0];
      recommendations.push(`**${worstKPI.name} Focus:** Prioritize improvement in ${worstKPI.name} through targeted training and process review`);
    }
    
    // Goal-specific recommendations
    if (inProgressGoals.length > 0) {
      recommendations.push(`**Goal Completion:** Focus on completing ${inProgressGoals.length} in-progress goals before taking on new objectives`);
    }
    
    if (totalGoals === 0) {
      recommendations.push("**Goal Setting:** Implement regular goal-setting sessions to drive professional development and performance improvement");
    }
    
    // Role-specific recommendations
    if (analystDesignation.includes('Analyst')) {
      recommendations.push("**Skill Development:** Consider pursuing advanced certifications to progress toward specialist-level responsibilities");
    } else if (analystDesignation.includes('Specialist')) {
      recommendations.push("**Knowledge Sharing:** Develop training materials and mentor junior team members to maximize impact");
    }
    
    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  };

  const recommendations = getRecommendations();

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Target className="w-5 h-5 text-blue-600" />
        Strategic Recommendations for Next Period
      </h3>
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <ul className="space-y-3">
          {recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start gap-3">
              <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
              <span className="text-sm text-blue-700" dangerouslySetInnerHTML={{ __html: recommendation }} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default StrategicRecommendations;