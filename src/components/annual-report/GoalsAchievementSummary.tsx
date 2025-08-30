import React from 'react';
import { Award, Target, Clock, CheckCircle } from 'lucide-react';

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

interface GoalsAchievementSummaryProps {
  goals: GoalData[];
}

const GoalsAchievementSummary: React.FC<GoalsAchievementSummaryProps> = ({ goals }) => {
  const calculateGoalMetrics = () => {
    const totalGoals = goals.length;
    const completedGoals = goals.filter(goal => goal.status === 'completed').length;
    const inProgressGoals = goals.filter(goal => goal.status === 'in_progress').length;
    
    const completedGoalsWithDates = goals.filter(goal => 
      goal.status === 'completed' && goal.completed_date
    );
    
    const totalCompletionDays = completedGoalsWithDates.reduce((sum, goal) => {
      const assigned = new Date(goal.assigned_date);
      const completed = new Date(goal.completed_date!);
      const days = Math.ceil((completed.getTime() - assigned.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);
    
    const avgCompletionDays = completedGoalsWithDates.length > 0 
      ? Math.round(totalCompletionDays / completedGoalsWithDates.length)
      : 0;
    
    const completionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
    
    return {
      totalGoals,
      completedGoals,
      inProgressGoals,
      avgCompletionDays,
      completionRate
    };
  };

  const getComplexity = (assignedDate: string, deadline: string) => {
    const assigned = new Date(assignedDate);
    const deadlineDate = new Date(deadline);
    const durationDays = Math.ceil((deadlineDate.getTime() - assigned.getTime()) / (1000 * 60 * 60 * 24));
    
    if (durationDays <= 60) return { label: 'Simple', class: 'bg-gray-100 text-gray-800' };
    if (durationDays <= 120) return { label: 'Medium', class: 'bg-blue-100 text-blue-800' };
    return { label: 'Complex', class: 'bg-purple-100 text-purple-800' };
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCompletionDetails = (goal: GoalData) => {
    if (goal.status !== 'completed' || !goal.completed_date) {
      return { duration: 'N/A', onTime: null };
    }
    
    const assigned = new Date(goal.assigned_date);
    const deadline = new Date(goal.deadline);
    const completed = new Date(goal.completed_date);
    
    const duration = Math.ceil((completed.getTime() - assigned.getTime()) / (1000 * 60 * 60 * 24));
    const onTime = completed <= deadline;
    
    return {
      duration: `${duration} days`,
      onTime: onTime ? 'On Time' : 'Overdue'
    };
  };

  if (goals.length === 0) {
    return (
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-purple-600" />
          Goals Achievement Summary
        </h3>
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 text-center">
          <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-600">No goals were assigned during this performance period.</p>
          <p className="text-sm text-gray-500 mt-2">
            Consider setting professional development and performance goals for the next review period.
          </p>
        </div>
      </div>
    );
  }

  const metrics = calculateGoalMetrics();

  return (
    <div className="mb-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <Award className="w-5 h-5 text-purple-600" />
        Goals Achievement Summary
      </h3>
      
      {/* Goals Overview Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total Goals</p>
              <p className="text-2xl font-bold text-purple-800">{metrics.totalGoals}</p>
            </div>
            <Target className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Completed</p>
              <p className="text-2xl font-bold text-green-800">{metrics.completedGoals}</p>
              <p className="text-xs text-green-600">{metrics.completionRate}% rate</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-800">{metrics.inProgressGoals}</p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-600">Avg Days</p>
              <p className="text-2xl font-bold text-indigo-800">{metrics.avgCompletionDays}</p>
              <p className="text-xs text-indigo-600">to Complete</p>
            </div>
            <Award className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Goals Summary Table */}
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-3">Goals Summary</h4>
        <div className="overflow-x-auto border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Goal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Complexity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timeline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {goals.map((goal, index) => {
                const complexity = getComplexity(goal.assigned_date, goal.deadline);
                const completion = getCompletionDetails(goal);
                
                return (
                  <tr key={goal.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {goal.goal_name}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(goal.priority)}`}>
                        {goal.priority || 'Medium'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${complexity.class}`}>
                        {complexity.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                        {goal.status?.split('_').map(word => 
                          word.charAt(0).toUpperCase() + word.slice(1)
                        ).join(' ') || 'Assigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="space-y-1">
                        <div>Assigned: {formatDate(goal.assigned_date)}</div>
                        <div>Deadline: {formatDate(goal.deadline)}</div>
                        {goal.completed_date && (
                          <div>Completed: {formatDate(goal.completed_date)}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="space-y-1">
                        <div>Duration: {completion.duration}</div>
                        {completion.onTime && (
                          <div className={`text-xs font-medium ${
                            completion.onTime === 'On Time' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {completion.onTime}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Goals Performance Insights */}
      <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
        <h4 className="text-lg font-semibold text-purple-800 mb-3">Goals Performance Insights</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-purple-700 mb-2">Achievement Metrics</h5>
            <ul className="space-y-1 text-sm text-purple-600">
              <li>• <strong>Completion Rate:</strong> {metrics.completionRate}% ({metrics.completedGoals}/{metrics.totalGoals})</li>
              <li>• <strong>On-Time Completion:</strong> {(() => {
                const onTimeGoals = goals.filter(goal => {
                  if (goal.status !== 'completed' || !goal.completed_date) return false;
                  return new Date(goal.completed_date) <= new Date(goal.deadline);
                }).length;
                const onTimeRate = metrics.completedGoals > 0 ? Math.round((onTimeGoals / metrics.completedGoals) * 100) : 0;
                return `${onTimeRate}% of completed goals`;
              })()}</li>
              <li>• <strong>Average Completion Time:</strong> {metrics.avgCompletionDays} days</li>
              <li>• <strong>Goals In Progress:</strong> {metrics.inProgressGoals} active goals</li>
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-purple-700 mb-2">Performance Assessment</h5>
            <p className="text-sm text-purple-600">
              {(() => {
                if (metrics.completionRate >= 80) {
                  return "Excellent goal achievement rate demonstrates strong commitment to professional development and organizational objectives.";
                } else if (metrics.completionRate >= 60) {
                  return "Good goal completion rate with room for improvement in time management and goal prioritization.";
                } else if (metrics.completionRate >= 40) {
                  return "Moderate goal completion rate indicates need for better goal planning and resource allocation.";
                } else if (metrics.totalGoals > 0) {
                  return "Goal completion rate requires attention. Consider reviewing goal setting process and support mechanisms.";
                } else {
                  return "No goals were assigned during this period. Consider implementing goal-setting for professional development.";
                }
              })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoalsAchievementSummary;