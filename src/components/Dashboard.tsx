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
    startMonth: new Date().getMonth() + 1, // Current month
    startYear: getCurrentYear(),
    endMonth: new Date().getMonth() + 1, // Current month
    endYear: getCurrentYear()
  });
  const [showPeriodSelector, setShowPeriodSelector] = useState(false);
  const [selectedDesignation, setSelectedDesignation] = useState<string>('');

  // Load user KPI mappings for dashboard
  const [userKPIMappings, setUserKPIMappings] = useState<UserKPIMapping[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    filterDataByPeriod();
  }, [allPerformanceData, selectedPeriod]);

  useEffect(() => {
    // Reset designation filter if no team members match
    if (selectedDesignation && !getUniqueDesignations().includes(selectedDesignation)) {
      setSelectedDesignation('');
    }
  }, [teamMembers, selectedDesignation]);
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [performanceRecords, teamMembersList, kpiTargets, userMappings] = await Promise.all([
        performanceService.getPerformanceRecords(),
        analystService.getAllAnalysts(),
        performanceService.getKPITargets(),
        performanceService.getUserKPIMappings()
      ]);

      console.log('Dashboard loaded data:', {
        performanceRecords: performanceRecords.length,
        teamMembers: teamMembersList.length,
        targets: kpiTargets.length,
        userMappings: userMappings.length
      });

      setAllPerformanceData(performanceRecords);
      setTeamMembers(teamMembersList);
      setTargets(kpiTargets);
      setUserKPIMappings(userMappings);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Don't use mock data - show empty state instead
      setAllPerformanceData([]);
      setTeamMembers([]);
      setTargets([]);
      setUserKPIMappings([]);
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

  const getUniqueDesignations = () => {
    const designations = [...new Set(teamMembers.map(member => member.designation).filter(Boolean))];
    return designations.sort();
  };

  const getFilteredTeamMembers = () => {
    if (!selectedDesignation) return teamMembers;
    return teamMembers.filter(member => member.designation === selectedDesignation);
  };

  const handlePeriodChange = (field: string, value: number) => {
    setSelectedPeriod(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetToDefaultPeriod = () => {
    setSelectedPeriod({
      startMonth: new Date().getMonth() + 1, // Current month
      startYear: getCurrentYear(),
      endMonth: new Date().getMonth() + 1, // Current month
      endYear: getCurrentYear()
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
          const actualValue = record[kpiName as keyof PerformanceRecord] as number;
          // Note: We don't have kpiDefinitions in Dashboard yet, so we'll assume numeric for now
          // This can be enhanced later if needed
          const achievement = Math.round((actualValue / target.monthly_target) * 100);
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

  // Get KPIs for a specific team member (same logic as Performance Tracking)
  const getKPIsForTeamMember = (teamMemberId: string) => {
    const teamMember = teamMembers.find(tm => tm.id === teamMemberId);
    if (!teamMember) return [];
    
    // Use the same logic as Performance Tracking - check for user-specific mappings first
    const userMappings = userKPIMappings.filter(mapping => 
      mapping.team_member_id === teamMemberId && mapping.is_active && mapping.monthly_target > 0
    );
    
    // Convert user mappings to KPITarget format
    const userSpecificTargets: KPITarget[] = userMappings.map(mapping => ({
      id: mapping.id,
      kpi_name: mapping.kpi_name,
      monthly_target: mapping.monthly_target,
      annual_target: mapping.annual_target,
      designation: teamMember.designation,
      role: teamMember.designation,
      created_at: mapping.created_at
    }));
    
    // If user has specific mappings, ONLY use those
    if (userSpecificTargets.length > 0) {
      return userSpecificTargets;
    }
    
    // Fallback: If no user-specific mappings, use designation defaults with targets > 0
    const designationTargets = targets.filter(target => 
      (target.designation === teamMember.designation || target.role === teamMember.designation) &&
      target.monthly_target > 0
    );
    
    return designationTargets;
  };

  // Calculate leaderboard data
  const getLeaderboardData = () => {
    const allLeaderboardData: Array<{
      teamMember: TeamMember;
      totalRecords: number;
      averagePerformance: number;
      kpiPerformances: Array<{
        kpi: string;
        actual: number;
        target: number;
        achievement: number;
      }>;
      totalAchievement: number;
      criticalKPIs: number;
      goodKPIs: number;
      lastMonthRecord: PerformanceRecord | null;
      hasValidData: boolean;
    }> = [];

    // Process all team members (not filtered by designation)
    teamMembers.forEach(teamMember => {
      const memberRecords = performanceData.filter(record => record.team_member_id === teamMember.id);
      if (memberRecords.length === 0) return;

      const memberKPIs = getKPIsForTeamMember(teamMember.id);
      if (memberKPIs.length === 0) return;

      let totalAchievement = 0;
      let validKPICount = 0;
      let criticalCount = 0;
      let goodCount = 0;
      let hasAnyValidData = false;
      const kpiPerformances: Array<{
        kpi: string;
        actual: number;
        target: number;
        achievement: number;
      }> = [];

      // Calculate performance for each KPI
      memberKPIs.forEach(target => {
        const totalActual = memberRecords.reduce((sum, record) => {
          return sum + ((record as any)[target.kpi_name] || 0);
        }, 0);
        
        const totalTarget = target.monthly_target * memberRecords.length;
        const achievement = totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0;
        
        // Check if this KPI has meaningful data
        if (totalActual > 0 || totalTarget > 0) {
          hasAnyValidData = true;
        }
        
        kpiPerformances.push({
          kpi: target.kpi_name,
          actual: totalActual,
          target: totalTarget,
          achievement
        });
        
        totalAchievement += achievement;
        validKPICount++;
        
        // Count performance categories
        if (achievement <= 66) criticalCount++;
        else if (achievement >= 120) goodCount++;
      });

      const averagePerformance = validKPICount > 0 ? Math.round(totalAchievement / validKPICount) : 0;
      
      // Get most recent record
      const sortedRecords = memberRecords.sort((a, b) => {
        const aDate = new Date(a.year, parseInt(a.month) - 1);
        const bDate = new Date(b.year, parseInt(b.month) - 1);
        return bDate.getTime() - aDate.getTime();
      });

      allLeaderboardData.push({
        teamMember,
        totalRecords: memberRecords.length,
        averagePerformance,
        kpiPerformances,
        totalAchievement,
        criticalKPIs: criticalCount,
        goodKPIs: goodCount,
        lastMonthRecord: sortedRecords[0] || null,
        hasValidData: hasAnyValidData
      });
    });

    // Filter out entries without valid data
    const validEntries = allLeaderboardData.filter(entry => 
      entry.hasValidData && entry.averagePerformance > 0
    );
    
    // Group by designation
    const groupedByDesignation: { [key: string]: typeof validEntries } = {};
    
    validEntries.forEach(entry => {
      const designation = entry.teamMember.designation;
      if (!groupedByDesignation[designation]) {
        groupedByDesignation[designation] = [];
      }
      groupedByDesignation[designation].push(entry);
    });
    
    // Sort each designation group by performance
    Object.keys(groupedByDesignation).forEach(designation => {
      groupedByDesignation[designation].sort((a, b) => b.averagePerformance - a.averagePerformance);
    });
    
    return groupedByDesignation;
  };

  const formatKPIName = (kpiName: string) => {
    return kpiName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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
          {/* Designation Filter */}
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <label className="text-sm font-medium text-gray-700">Filter by Designation:</label>
            <select
              value={selectedDesignation}
              onChange={(e) => setSelectedDesignation(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-sm min-w-[200px]"
            >
              <option value="">All Designations</option>
              {getUniqueDesignations().map((designation) => (
                <option key={designation} value={designation}>{designation}</option>
              ))}
            </select>
            {selectedDesignation && (
              <button
                onClick={() => setSelectedDesignation('')}
                className="px-3 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <span className="text-sm font-medium text-blue-800">
              {selectedDesignation ? `${selectedDesignation} - ` : ''}Current Period: {formatPeriodLabel(
                selectedPeriod.startMonth,
                selectedPeriod.startYear,
                selectedPeriod.endMonth,
                selectedPeriod.endYear
              )}
            </span>
          </div>
          <div className="text-sm text-gray-600">
            {performanceData.length} records in this period
            {selectedDesignation && ` • ${getFilteredTeamMembers().length} team members in ${selectedDesignation}`}
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
      {(() => {
        const leaderboardsByDesignation = getLeaderboardData();
        const allDesignations = Object.keys(leaderboardsByDesignation).sort();
        const designations = selectedDesignation 
          ? allDesignations.filter(d => d === selectedDesignation)
          : allDesignations;
        
        return designations.length > 0 ? (
          <div className="space-y-6">
            {designations.map((designation) => {
              const designationData = leaderboardsByDesignation[designation];
              const topPerformer = designationData.find(entry => entry.averagePerformance >= 50);
              
              return (
                <div key={designation} className="bg-white rounded-lg shadow-sm border">
                  {/* Designation Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{designation} Leaderboard</h3>
                          <p className="text-sm text-gray-600">
                            {designationData.length} team member{designationData.length !== 1 ? 's' : ''} 
                            {selectedDesignation ? ' (filtered)' : ''} • 
                            Period: {formatPeriodLabel(
                              selectedPeriod.startMonth,
                              selectedPeriod.startYear,
                              selectedPeriod.endMonth,
                              selectedPeriod.endYear
                            )}
                          </p>
                        </div>
                      </div>
                      {topPerformer && (
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-yellow-700">
                            <Award className="w-5 h-5" />
                            <span className="text-sm font-semibold">Top Performer</span>
                          </div>
                          <p className="text-xs text-gray-600">{topPerformer.teamMember.name} - {topPerformer.averagePerformance}%</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top Performer Highlight for this designation */}
                  {topPerformer && (
                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b-2 border-yellow-200 p-6">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Award className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-yellow-800">
                            🏆 {designation} Leader
                          </h4>
                          <p className="text-sm text-yellow-700">Highest performance in {designation} designation</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-yellow-700">Team Member</p>
                          <p className="text-xl font-bold text-yellow-900">{topPerformer.teamMember.name}</p>
                          <p className="text-sm text-yellow-600">{topPerformer.teamMember.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-yellow-700">Average Performance</p>
                          <p className="text-3xl font-bold text-yellow-900">{topPerformer.averagePerformance}%</p>
                          <PerformanceIndicator 
                            achievementPercentage={topPerformer.averagePerformance}
                            showLabel={false}
                            size="sm"
                          />
                        </div>
                        <div>
                          <p className="text-sm text-yellow-700">Performance Summary</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-green-600 font-medium">{topPerformer.goodKPIs} Good KPIs</span>
                            {topPerformer.criticalKPIs > 0 && (
                              <span className="text-red-600 font-medium">{topPerformer.criticalKPIs} Critical KPIs</span>
                            )}
                          </div>
                          <p className="text-xs text-yellow-600 mt-1">{topPerformer.totalRecords} months tracked</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* No Top Performer Message for this designation */}
                  {!topPerformer && (
                    <div className="bg-amber-50 border-b border-amber-200 p-4">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <div>
                          <h4 className="font-bold text-amber-800">No Leader in {designation}</h4>
                          <p className="text-sm text-amber-700">
                            No team member achieved 50% minimum performance threshold in this designation.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Leaderboard Table for this designation */}
                  <div className="p-6">
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
                          {designationData.map((entry, index) => {
                            const isTopPerformer = topPerformer && entry.teamMember.id === topPerformer.teamMember.id;
                            const rowClass = isTopPerformer 
                              ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-400' 
                              : 'hover:bg-gray-50';
                            
                            return (
                              <tr key={entry.teamMember.id} className={rowClass}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  <div className="flex items-center gap-2">
                                    {isTopPerformer && <Award className="w-5 h-5 text-yellow-500" />}
                                    <span className={`text-lg font-bold ${isTopPerformer ? 'text-yellow-700' : 'text-gray-700'}`}>
                                      #{index + 1}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                                      isTopPerformer ? 'bg-yellow-500' : 'bg-blue-500'
                                    }`}>
                                      {entry.teamMember.name.charAt(0)}
                                    </div>
                                    <div className="ml-4">
                                      <div className={`text-sm font-medium ${isTopPerformer ? 'text-yellow-900' : 'text-gray-900'}`}>
                                        {entry.teamMember.name}
                                      </div>
                                      <div className="text-sm text-gray-500">{entry.teamMember.email}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-2xl font-bold ${
                                      isTopPerformer ? 'text-yellow-700' : 'text-gray-900'
                                    }`}>
                                      {entry.averagePerformance}%
                                    </span>
                                    <PerformanceIndicator 
                                      achievementPercentage={entry.averagePerformance}
                                      showLabel={false}
                                      size="sm"
                                    />
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  <div className="space-y-1 max-w-xs">
                                    {entry.kpiPerformances.slice(0, 3).map((kpi) => (
                                      <div key={kpi.kpi} className="flex items-center justify-between bg-gray-50 p-2 rounded text-xs">
                                        <span className="font-medium text-gray-700 truncate">
                                          {formatKPIName(kpi.kpi)}:
                                        </span>
                                        <div className="flex items-center gap-1">
                                          <span className="text-gray-600">{kpi.actual}/{kpi.target}</span>
                                          <span className={`font-semibold ${
                                            kpi.achievement >= 100 ? 'text-green-600' :
                                            kpi.achievement >= 84 ? 'text-blue-600' :
                                            kpi.achievement >= 67 ? 'text-amber-600' :
                                            'text-red-600'
                                          }`}>
                                            {kpi.achievement}%
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                    {entry.kpiPerformances.length > 3 && (
                                      <div className="text-xs text-gray-500 text-center">
                                        +{entry.kpiPerformances.length - 3} more KPIs
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex flex-col gap-1">
                                    {entry.goodKPIs > 0 && (
                                      <div className="flex items-center gap-1">
                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                        <span className="text-xs text-green-600 font-medium">{entry.goodKPIs} Good</span>
                                      </div>
                                    )}
                                    {entry.criticalKPIs > 0 && (
                                      <div className="flex items-center gap-1">
                                        <AlertTriangle className="w-4 h-4 text-red-500" />
                                        <span className="text-xs text-red-600 font-medium">{entry.criticalKPIs} Critical</span>
                                      </div>
                                    )}
                                    {entry.goodKPIs === 0 && entry.criticalKPIs === 0 && (
                                      <div className="flex items-center gap-1">
                                        <Target className="w-4 h-4 text-blue-500" />
                                        <span className="text-xs text-blue-600 font-medium">On Track</span>
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  <div className="text-center">
                                    <div className="font-semibold text-gray-900">{entry.totalRecords}</div>
                                    <div className="text-xs text-gray-500">months</div>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 mb-2">
                {selectedDesignation 
                  ? `No performance data available for ${selectedDesignation} in this period`
                  : 'No performance data available for this period'
                }
              </p>
              <p className="text-sm text-gray-400">Add performance records in the Performance Tracking section to see designation leaderboards</p>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default Dashboard;
