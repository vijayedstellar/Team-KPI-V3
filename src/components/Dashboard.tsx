import React, { useState, useEffect } from 'react';
import { BarChart3, Users, TrendingUp, Calendar, Award, Target, CheckCircle, Clock, AlertTriangle, X } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { performanceService } from '../services/performanceService';
import { analystService } from '../services/analytService';
import { goalService, type GoalWithAssignments } from '../services/goalService';
import type { PerformanceRecord, TeamMember, KPITarget } from '../lib/supabase';
import PerformanceIndicator from './PerformanceIndicator';
import { getPerformanceCategory } from '../utils/performanceCategories';
import { generateYearRange, getCurrentYear, getMonthOptions, formatMonthName } from '../utils/dateUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AnalystSummary {
  analyst: TeamMember;
  totalRecords: number;
  averagePerformance: number;
  kpiBreakdown: { [key: string]: { actual: number; target: number; achievement: number } };
  performanceCategory: string;
  lastRecordDate: string;
}

const Dashboard: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceRecord[]>([]);
  const [analysts, setAnalysts] = useState<TeamMember[]>([]);
  const [targets, setTargets] = useState<KPITarget[]>([]);
  const [goals, setGoals] = useState<GoalWithAssignments[]>([]);
  const [userKPIMappings, setUserKPIMappings] = useState<any[]>([]);
  const [kpiDefinitions, setKpiDefinitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDesignation, setSelectedDesignation] = useState<string>('');
  const [selectedGoalStatus, setSelectedGoalStatus] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startMonth: getCurrentYear() === 2025 ? 8 : 1, // August for 2025, January for other years
    startYear: getCurrentYear(),
    endMonth: getCurrentYear() === 2025 ? 12 : 12, // December for current year
    endYear: getCurrentYear()
  });
  const [showDateModal, setShowDateModal] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState({
    startMonth: getCurrentYear() === 2025 ? 8 : 1, // August for 2025, January for other years
    startYear: getCurrentYear(),
    endMonth: getCurrentYear() === 2025 ? 8 : 12, // August for 2025, December for other years  
    endYear: getCurrentYear()
  });
  const [showPeriodModal, setShowPeriodModal] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, [selectedDesignation, dateRange]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Filter performance records by date range
      const allRecords = await performanceService.getPerformanceRecords();
      const filteredRecords = allRecords.filter(record => {
        const recordDate = new Date(record.year, parseInt(record.month) - 1);
        const startDate = new Date(dateRange.startYear, dateRange.startMonth - 1);
        const endDate = new Date(dateRange.endYear, dateRange.endMonth - 1);
        return recordDate >= startDate && recordDate <= endDate;
      });
      
      const [analystsList, kpiTargets, goalsData, userMappings, kpiDefs] = await Promise.all([
        analystService.getAllAnalysts(),
        performanceService.getKPITargets(),
        goalService.getGoals({
          startMonth: dateRange.startMonth,
          startYear: dateRange.startYear,
          endMonth: dateRange.endMonth,
          endYear: dateRange.endYear
        }),
        performanceService.getUserKPIMappings(),
        performanceService.getKPIDefinitions()
      ]);

      setPerformanceData(filteredRecords);
      setAnalysts(analystsList);
      setTargets(kpiTargets);
      setGoals(goalsData);
      setUserKPIMappings(userMappings);
      setKpiDefinitions(kpiDefs);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getKPIsForAnalyst = (analystId: string) => {
    const analyst = analysts.find(a => a.id === analystId);
    if (!analyst) return [];
    
    // Get user-specific KPI mappings first
    const userMappings = userKPIMappings.filter(mapping => 
      mapping.team_member_id === analystId && mapping.is_active && mapping.monthly_target > 0
    );
    
    // Convert user mappings to KPITarget format
    const userSpecificTargets: KPITarget[] = userMappings.map(mapping => ({
      id: mapping.id,
      kpi_name: mapping.kpi_name,
      monthly_target: mapping.monthly_target,
      annual_target: mapping.annual_target,
      designation: analyst.designation,
      role: analyst.designation,
      created_at: mapping.created_at
    }));
    
    // If user has specific mappings, use those
    if (userSpecificTargets.length > 0) {
      return userSpecificTargets;
    }
    
    // Fallback: Use designation defaults with targets > 0
    const designationTargets = targets.filter(target => 
      (target.designation === analyst.designation || target.role === analyst.designation) &&
      target.monthly_target > 0
    );
    
    return designationTargets;
  };

  const calculateAnalystSummary = (): AnalystSummary[] => {
    const analystSummaries: AnalystSummary[] = [];
    const filteredAnalysts = selectedDesignation 
      ? analysts.filter(analyst => analyst.designation === selectedDesignation)
      : analysts;

    filteredAnalysts.forEach(analyst => {
      const analystRecords = performanceData.filter(record => record.team_member_id === analyst.id);
      
      if (analystRecords.length === 0) {
        analystSummaries.push({
          analyst,
          totalRecords: 0,
          averagePerformance: 0,
          kpiBreakdown: {},
          performanceCategory: 'No Data',
          lastRecordDate: 'Never'
        });
        return;
      }

      // Get effective KPI targets for this analyst (user-specific or designation defaults)
      const analystTargets = getKPIsForAnalyst(analyst.id);
      
      console.log(`Dashboard: KPIs for ${analyst.name}:`, {
        analystId: analyst.id,
        designation: analyst.designation,
        targetsFound: analystTargets.length,
        kpiNames: analystTargets.map(t => t.kpi_name),
        recordsCount: analystRecords.length
      });

      const kpiBreakdown: { [key: string]: { actual: number; target: number; achievement: number } } = {};
      let totalAchievement = 0;
      let validKPIs = 0;

      analystTargets.forEach(target => {
        const totalActual = analystRecords.reduce((sum, record) => {
          return sum + ((record as any)[target.kpi_name] || 0);
        }, 0);

        const monthlyTarget = target.monthly_target || 0;
        const periodTarget = monthlyTarget * analystRecords.length;

        if (monthlyTarget > 0 && periodTarget > 0) {
          const achievement = Math.round((totalActual / periodTarget) * 100);
          
          console.log(`Dashboard: KPI ${target.kpi_name} for ${analyst.name}:`, {
            totalActual,
            monthlyTarget,
            recordsCount: analystRecords.length,
            periodTarget,
            achievement
          });
          
          kpiBreakdown[target.kpi_name] = {
            actual: totalActual,
            target: periodTarget,
            achievement
          };
          totalAchievement += achievement;
          validKPIs++;
        } else {
          console.log(`Dashboard: Skipping KPI ${target.kpi_name} for ${analyst.name} - no valid target (monthly: ${monthlyTarget})`);
        }
      });

      console.log(`Dashboard: Final calculation for ${analyst.name}:`, {
        validKPIs,
        totalAchievement,
        averagePerformance: validKPIs > 0 ? Math.round(totalAchievement / validKPIs) : 0
      });

      const averagePerformance = validKPIs > 0 ? Math.round(totalAchievement / validKPIs) : 0;
      const performanceCategory = getPerformanceCategory(averagePerformance);

      const lastRecord = analystRecords.sort((a, b) => {
        const aDate = new Date(a.year, parseInt(a.month) - 1);
        const bDate = new Date(b.year, parseInt(b.month) - 1);
        return bDate.getTime() - aDate.getTime();
      })[0];

      const analystSummary: AnalystSummary = {
        analyst,
        totalRecords: analystRecords.length,
        averagePerformance,
        kpiBreakdown,
        performanceCategory: performanceCategory.name,
        lastRecordDate: lastRecord ? `${formatMonthName(parseInt(lastRecord.month))} ${lastRecord.year}` : 'Never'
      };

      analystSummaries.push(analystSummary);
    });

    return analystSummaries.sort((a, b) => b.averagePerformance - a.averagePerformance);
  };

  const getFilteredGoals = () => {
    let filteredGoals = goals;
    
    // Filter by designation if selected
    if (selectedDesignation) {
      filteredGoals = goals.filter(goal => 
        goal.assigned_members?.some(member => member.designation === selectedDesignation)
      );
    }
    
    // Filter by status if selected
    if (selectedGoalStatus) {
      filteredGoals = filteredGoals.filter(goal =>
        goal.assigned_members?.some(member => member.status === selectedGoalStatus)
      );
    }
    
    return filteredGoals;
  };

  const getGoalStatusCounts = () => {
    const filteredGoals = getFilteredGoals();
    const counts = {
      total: filteredGoals.length,
      completed: 0,
      in_progress: 0,
      overdue: 0,
      assigned: 0
    };
    
    filteredGoals.forEach(goal => {
      const today = new Date();
      const deadline = new Date(goal.deadline);
      const isOverdue = deadline < today;
      
      goal.assigned_members?.forEach(member => {
        if (member.status === 'completed') {
          counts.completed++;
        } else if (member.status === 'in_progress') {
          counts.in_progress++;
        } else if (member.status === 'assigned') {
          counts.assigned++;
        }
        
        if (member.status !== 'completed' && isOverdue) {
          counts.overdue++;
        }
      });
    });
    
    return counts;
  };

  const formatKPIName = (kpiName: string) => {
    const kpiDef = kpiDefinitions.find(kpi => kpi.name === kpiName);
    return kpiDef ? kpiDef.display_name : kpiName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatPeriodLabel = () => {
    const startMonthName = formatMonthName(dateRange.startMonth);
    const endMonthName = formatMonthName(dateRange.endMonth);
    return `${startMonthName} ${dateRange.startYear} - ${endMonthName} ${dateRange.endYear}`;
  };

  const months = getMonthOptions();
  const years = generateYearRange(2024, 15);
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const analystSummaries = calculateAnalystSummary();
  const goalStatusCounts = getGoalStatusCounts();
  const filteredGoals = getFilteredGoals();
  
  const getUniqueDesignations = () => {
    const designations = [...new Set(analysts.map(analyst => analyst.designation).filter(Boolean))];
    return designations.sort();
  };

  return (
    <div className="space-y-6">
      {/* Header with Period Selection */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
            <p className="text-gray-600">Real-time analytics and team performance insights</p>
          </div>
        </div>
        <button
          onClick={() => setShowDateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Calendar className="w-4 h-4" />
          <span className="hidden sm:inline">Period: </span>
          {formatPeriodLabel()}
        </button>
      </div>

      {/* Date Range Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Performance Period</h3>
          </div>
          <button
            onClick={() => setShowDateModal(true)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium underline"
          >
            Change Period
          </button>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Selected Period</p>
              <p className="text-lg font-bold text-blue-900">{formatPeriodLabel()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600">Duration</p>
              <p className="text-sm font-semibold text-blue-800">
                {(() => {
                  const startDate = new Date(dateRange.startYear, dateRange.startMonth - 1);
                  const endDate = new Date(dateRange.endYear, dateRange.endMonth - 1);
                  const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                                   (endDate.getMonth() - startDate.getMonth()) + 1;
                  return `${monthsDiff} month${monthsDiff !== 1 ? 's' : ''}`;
                })()}
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Designation:</label>
            <select
              value={selectedDesignation}
              onChange={(e) => setSelectedDesignation(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
            >
              <option value="">All Designations</option>
              {getUniqueDesignations().map((designation) => (
                <option key={designation} value={designation}>{designation}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Goal Status:</label>
            <select
              value={selectedGoalStatus}
              onChange={(e) => setSelectedGoalStatus(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
            >
              <option value="">All Statuses</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Goals Performance Overview */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center gap-3">
            <Award className="w-6 h-6 text-purple-600" />
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Goals Performance Overview</h3>
              <p className="text-sm text-gray-600">Track goal completion rates and progress across the team</p>
            </div>
          </div>
        </div>
        
        {/* Goals Summary Cards */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Goals</p>
                  <p className="text-2xl font-bold text-blue-800">{goalStatusCounts.total}</p>
                </div>
                <Target className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Completed</p>
                  <p className="text-2xl font-bold text-green-800">{goalStatusCounts.completed}</p>
                  <p className="text-xs text-green-600">
                    {goalStatusCounts.total > 0 ? Math.round((goalStatusCounts.completed / goalStatusCounts.total) * 100) : 0}% rate
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-600">In Progress</p>
                  <p className="text-2xl font-bold text-amber-800">{goalStatusCounts.in_progress}</p>
                </div>
                <Clock className="w-8 h-8 text-amber-600" />
              </div>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-800">{goalStatusCounts.overdue}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Total Assignments</p>
                  <p className="text-2xl font-bold text-purple-800">
                    {goals.reduce((sum, goal) => sum + (goal.assigned_members?.length || 0), 0)}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </div>
          </div>
          
          {/* Goals Table */}
          {filteredGoals.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Goal</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Deadline</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Assigned To</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGoals.map((goal) => (
                    <tr key={goal.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{goal.goal_name}</div>
                        {goal.description && (
                          <div className="text-sm text-gray-500">{goal.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(goal.deadline)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {goal.assigned_members && goal.assigned_members.length > 0 ? (
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <div className="flex flex-col space-y-1">
                              {goal.assigned_members.slice(0, 2).map((member, idx) => (
                                <span key={idx} className="text-sm text-gray-700 font-medium">
                                  {member.name} ({member.designation})
                                </span>
                              ))}
                              {goal.assigned_members.length > 2 && (
                                <span className="text-xs text-gray-500">
                                  +{goal.assigned_members.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {goal.assigned_members && goal.assigned_members.length > 0 ? (
                          <div className="space-y-1">
                            {goal.assigned_members.map((member, idx) => (
                              <span
                                key={idx}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.status)}`}
                              >
                                {formatStatus(member.status)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No assignments</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {goal.assigned_members && goal.assigned_members.length > 0 ? (
                          <div className="space-y-1">
                            {goal.assigned_members.map((member, idx) => (
                              <div key={idx} className="text-xs text-gray-700 max-w-xs truncate">
                                {member.notes || 'No comment'}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No assignments</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Goals Found</h3>
              <p className="text-gray-500">
                {selectedDesignation || selectedGoalStatus 
                  ? 'No goals match your current filters.'
                  : 'No goals have been created yet.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Date Range Modal */}
      {showDateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Date Range</h3>
              <button
                onClick={() => setShowDateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Period</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={dateRange.startMonth}
                    onChange={(e) => setDateRange({
                      ...dateRange,
                      startMonth: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                  <select
                    value={dateRange.startYear}
                    onChange={(e) => setDateRange({
                      ...dateRange,
                      startYear: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Period</label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={dateRange.endMonth}
                    onChange={(e) => setDateRange({
                      ...dateRange,
                      endMonth: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                  <select
                    value={dateRange.endYear}
                    onChange={(e) => setDateRange({
                      ...dateRange,
                      endYear: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Selected Period</p>
                    <p className="text-lg font-bold text-gray-900">{formatPeriodLabel()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Duration</p>
                    <p className="text-sm font-semibold text-gray-700">
                      {(() => {
                        const startDate = new Date(dateRange.startYear, dateRange.startMonth - 1);
                        const endDate = new Date(dateRange.endYear, dateRange.endMonth - 1);
                        const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                                         (endDate.getMonth() - startDate.getMonth()) + 1;
                        return `${monthsDiff} month${monthsDiff !== 1 ? 's' : ''}`;
                      })()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDateModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowDateModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Apply Period
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Performance Leaderboard */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">KPI Performance Leaderboard</h3>
              <p className="text-sm text-gray-600 mt-1">
                Performance rankings for {selectedDesignation || 'all designations'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filter by Designation:</label>
              <select
                value={selectedDesignation}
                onChange={(e) => setSelectedDesignation(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[200px] bg-white"
              >
                <option value="">All Designations</option>
                {getUniqueDesignations().map((designation) => (
                  <option key={designation} value={designation}>{designation}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Performance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KPI Breakdown</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Records</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analystSummaries.map((summary, index) => (
                <tr key={summary.analyst.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-50 text-blue-700'
                      }`}>
                        #{index + 1}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">
                          {summary.analyst.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{summary.analyst.name}</div>
                        <div className="text-sm text-gray-500">{summary.analyst.designation}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PerformanceIndicator 
                      achievementPercentage={summary.averagePerformance}
                      showLabel={true}
                      size="md"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(summary.kpiBreakdown).slice(0, 5).map(([kpi, data]) => (
                        <span
                          key={kpi}
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            data.achievement >= 100 ? 'bg-green-100 text-green-800' :
                            data.achievement >= 80 ? 'bg-blue-100 text-blue-800' :
                            data.achievement >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}
                          title={`${kpi}: ${data.actual}/${data.target} (${data.achievement}%)`}
                        >
                          {formatKPIName(kpi).split(' ').map(word => word.charAt(0)).join('')}: {data.achievement}%
                        </span>
                      ))}
                      {Object.keys(summary.kpiBreakdown).length > 5 && (
                        <span className="px-2 py-1 text-xs text-gray-500 bg-gray-100 rounded-full">
                          +{Object.keys(summary.kpiBreakdown).length - 5} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      summary.averagePerformance >= 100 ? 'bg-green-100 text-green-800' :
                      summary.averagePerformance >= 80 ? 'bg-blue-100 text-blue-800' :
                      summary.averagePerformance >= 60 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {summary.averagePerformance >= 100 ? 'Exceeding' :
                       summary.averagePerformance >= 80 ? 'On Track' :
                       summary.averagePerformance >= 60 ? 'Needs Focus' :
                       'Critical'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="text-center">
                      <div className="font-semibold">{summary.totalRecords}</div>
                      <div className="text-xs text-gray-500">{summary.lastRecordDate}</div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {analystSummaries.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No performance data available for the selected period and filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;