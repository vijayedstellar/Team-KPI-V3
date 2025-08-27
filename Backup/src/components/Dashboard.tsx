import React, { useEffect, useState } from 'react';
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
  Legend
} from 'chart.js';
import { TrendingUp, Users, Target, Award, AlertTriangle, CheckCircle, Calendar, BarChart3, Filter } from 'lucide-react';
import { performanceService } from '../services/performanceService';
import { analystService } from '../services/analytService';
import type { PerformanceRecord, TeamMember, KPITarget } from '../lib/supabase';
import PerformanceCategoryChart from './PerformanceCategoryChart';
import { getPerformanceCategoryStats, performanceCategories, getPerformanceCategory } from '../utils/performanceCategories';
import PerformanceIndicator from './PerformanceIndicator';
import { getCurrentYear, generateYearRange, getMonthOptions, formatPeriodLabel } from '../utils/dateUtils';

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

const Dashboard: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceRecord[]>([]);
  const [allPerformanceData, setAllPerformanceData] = useState<PerformanceRecord[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [targets, setTargets] = useState<KPITarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState({
    startMonth: 8, // August
    startYear: getCurrentYear(),
    endMonth: 9, // September
    endYear: getCurrentYear() + 1
  });
  const [showPeriodSelector, setShowPeriodSelector] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    filterDataByPeriod();
  }, [allPerformanceData, selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [performanceRecords, teamMembersList, kpiTargets] = await Promise.all([
        performanceService.getPerformanceRecords(),
        analystService.getAllAnalysts(),
        performanceService.getKPITargets()
      ]);

      console.log('Dashboard loaded data:', {
        performanceRecords: performanceRecords.length,
        teamMembers: teamMembersList.length,
        targets: kpiTargets.length
      });

      setAllPerformanceData(performanceRecords);
      setTeamMembers(teamMembersList);
      setTargets(kpiTargets);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Don't use mock data - show empty state instead
      setAllPerformanceData([]);
      setTeamMembers([]);
      setTargets([]);
    } finally {
      setLoading(false);
    }
  };

  const filterDataByPeriod = () => {
    const filteredRecords = allPerformanceData.filter(record => {
      const recordDate = new Date(record.year, parseInt(record.month) - 1);
      const startDate = new Date(selectedPeriod.startYear, selectedPeriod.startMonth - 1);
      const endDate = new Date(selectedPeriod.endYear, selectedPeriod.endMonth - 1);
      
      return recordDate >= startDate && recordDate <= endDate;
    });
    
    console.log('Filtered records for period:', {
      totalRecords: allPerformanceData.length,
      filteredRecords: filteredRecords.length,
      period: formatPeriodLabel(
        selectedPeriod.startMonth,
        selectedPeriod.startYear,
        selectedPeriod.endMonth,
        selectedPeriod.endYear
      )
    });
    
    setPerformanceData(filteredRecords);
  };

  const handlePeriodChange = (field: string, value: number) => {
    setSelectedPeriod(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetToDefaultPeriod = () => {
    setSelectedPeriod({
      startMonth: 8, // August
      startYear: getCurrentYear(),
      endMonth: 9, // September
      endYear: getCurrentYear() + 1
    });
  };

  const calculateTotalPerformance = () => {
    if (performanceData.length === 0) {
      return {
        outreaches: 0,
        live_links: 0,
        high_da_links: 0,
        content_distribution: 0,
        new_blogs: 0,
        blog_optimizations: 0,
        top_5_keywords: 0
      };
    }

    return performanceData.reduce((acc, record) => ({
      outreaches: acc.outreaches + record.outreaches,
      live_links: acc.live_links + record.live_links,
      high_da_links: acc.high_da_links + record.high_da_links,
      content_distribution: acc.content_distribution + record.content_distribution,
      new_blogs: acc.new_blogs + record.new_blogs,
      blog_optimizations: acc.blog_optimizations + record.blog_optimizations,
      top_5_keywords: acc.top_5_keywords + record.top_5_keywords
    }), {
      outreaches: 0,
      live_links: 0,
      high_da_links: 0,
      content_distribution: 0,
      new_blogs: 0,
      blog_optimizations: 0,
      top_5_keywords: 0
    });
  };

  const getAnalystPerformanceSummary = () => {
    const analystSummary: { [key: string]: any } = {};
    
    if (performanceData.length === 0 || teamMembers.length === 0) {
      return {};
    }
    
    performanceData.forEach(record => {
      const teamMember = teamMembers.find(tm => tm.id === record.team_member_id);
      if (!teamMember) return;
      
      const analystName = teamMember.name;
      
      if (!analystSummary[analystName]) {
        analystSummary[analystName] = {
          totalRecords: 0,
          totalOutreaches: 0,
          totalLiveLinks: 0,
          totalHighDALinks: 0,
          averagePerformance: 0,
          criticalKPIs: 0,
          goodKPIs: 0,
          lastMonthData: null,
          designation: teamMember.designation
        };
      }
      
      analystSummary[analystName].totalRecords += 1;
      analystSummary[analystName].totalOutreaches += record.outreaches;
      analystSummary[analystName].totalLiveLinks += record.live_links;
      analystSummary[analystName].totalHighDALinks += record.high_da_links;
      
      // Calculate KPI performance categories
      const kpiNames = ['outreaches', 'live_links', 'high_da_links', 'content_distribution', 'new_blogs', 'blog_optimizations', 'top_5_keywords'];
      let totalAchievement = 0;
      let criticalCount = 0;
      let goodCount = 0;
      let validKPICount = 0;
      
      kpiNames.forEach(kpiName => {
        const target = targets.find(t => 
          t.kpi_name === kpiName && 
          (t.designation === teamMember.designation || t.role === teamMember.designation)
        );
        if (target && target.monthly_target > 0) {
          const achievement = Math.round((record[kpiName as keyof PerformanceRecord] as number / target.monthly_target) * 100);
          totalAchievement += achievement;
          validKPICount++;
          
          const category = getPerformanceCategory(achievement);
          if (category.name === 'Critical') criticalCount++;
          if (category.name === 'Good') goodCount++;
        }
      });
      
      analystSummary[analystName].averagePerformance = validKPICount > 0 ? Math.round(totalAchievement / validKPICount) : 0;
      analystSummary[analystName].criticalKPIs += criticalCount;
      analystSummary[analystName].goodKPIs += goodCount;
      
      // Track most recent record
      if (!analystSummary[analystName].lastMonthData || 
          new Date(record.year, parseInt(record.month) - 1) > 
          new Date(analystSummary[analystName].lastMonthData.year, parseInt(analystSummary[analystName].lastMonthData.month) - 1)) {
        analystSummary[analystName].lastMonthData = record;
      }
    });
    
    return analystSummary;
  };

  const categoryStats = getPerformanceCategoryStats(performanceData, targets);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Performance Period Selector */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Performance Period</h3>
          </div>
          <button
            onClick={() => setShowPeriodSelector(!showPeriodSelector)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Filter className="w-4 h-4" />
            {showPeriodSelector ? 'Hide Filters' : 'Change Period'}
          </button>
        </div>
        
        <div className="flex items-center gap-4 mb-4">
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <span className="text-sm font-medium text-blue-800">
              Current Period: {formatPeriodLabel(
                selectedPeriod.startMonth,
                selectedPeriod.startYear,
                selectedPeriod.endMonth,
                selectedPeriod.endYear
              )}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {performanceData.length} records in this period
          </div>
        </div>

        {showPeriodSelector && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Period</label>
                <div className="flex gap-2">
                  <select
                    value={selectedPeriod.startMonth}
                    onChange={(e) => handlePeriodChange('startMonth', parseInt(e.target.value))}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {getMonthOptions().map((month) => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                  <select
                    value={selectedPeriod.startYear}
                    onChange={(e) => handlePeriodChange('startYear', parseInt(e.target.value))}
                    className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {generateYearRange(2024, 20).map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Period</label>
                <div className="flex gap-2">
                  <select
                    value={selectedPeriod.endMonth}
                    onChange={(e) => handlePeriodChange('endMonth', parseInt(e.target.value))}
                    className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {getMonthOptions().map((month) => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                  <select
                    value={selectedPeriod.endYear}
                    onChange={(e) => handlePeriodChange('endYear', parseInt(e.target.value))}
                    className="w-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {generateYearRange(2024, 20).map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={resetToDefaultPeriod}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reset to Default
              </button>
              <button
                onClick={() => setShowPeriodSelector(false)}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Period
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Team Performance Analysis */}
      {Object.keys(getAnalystPerformanceSummary()).length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Team Performance Analysis</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Individual Team Member Summary</h4>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {Object.entries(getAnalystPerformanceSummary()).map(([analystName, summary]) => (
                  <div key={analystName} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-900">{analystName}</h5>
                      <PerformanceIndicator 
                        achievementPercentage={summary.averagePerformance}
                        showLabel={true}
                        size="sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Records:</span>
                        <span className="ml-2 font-medium">{summary.totalRecords}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Outreaches:</span>
                        <span className="ml-2 font-medium">{summary.totalOutreaches.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Live Links:</span>
                        <span className="ml-2 font-medium">{summary.totalLiveLinks}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">High DA:</span>
                        <span className="ml-2 font-medium">{summary.totalHighDALinks}</span>
                      </div>
                    </div>
                    {summary.criticalKPIs > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-600">{summary.criticalKPIs} critical KPIs need attention</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-3">Performance Distribution</h4>
              <PerformanceCategoryChart stats={categoryStats} />
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Team Performance Analysis</h3>
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 mb-2">No performance data available for this period</p>
            <p className="text-sm text-gray-400">Add performance records in the Performance Tracking section to see analysis</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;