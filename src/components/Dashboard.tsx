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
import { TrendingUp, Users, Target, Award, AlertTriangle, CheckCircle, Calendar, BarChart3 } from 'lucide-react';
import { performanceService } from '../services/performanceService';
import { analystService } from '../services/analytService';
import type { PerformanceRecord, Analyst, KPITarget } from '../lib/supabase';
import PerformanceCategoryChart from './PerformanceCategoryChart';
import { getPerformanceCategoryStats, performanceCategories, getPerformanceCategory } from '../utils/performanceCategories';
import PerformanceIndicator from './PerformanceIndicator';

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
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [targets, setTargets] = useState<KPITarget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [performanceRecords, analystsList, kpiTargets] = await Promise.all([
        performanceService.getPerformanceRecords(),
        analystService.getActiveAnalysts(),
        performanceService.getKPITargets()
      ]);

      setPerformanceData(performanceRecords);
      setAnalysts(analystsList);
      setTargets(kpiTargets);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPerformance = () => {
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
    
    performanceData.forEach(record => {
      const analystName = record.analysts?.name || 'Unknown';
      if (!analystSummary[analystName]) {
        analystSummary[analystName] = {
          totalRecords: 0,
          totalOutreaches: 0,
          totalLiveLinks: 0,
          totalHighDALinks: 0,
          averagePerformance: 0,
          criticalKPIs: 0,
          goodKPIs: 0,
          lastMonthData: null
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
      
      kpiNames.forEach(kpiName => {
        const target = targets.find(t => t.kpi_name === kpiName);
        if (target && target.monthly_target > 0) {
          const achievement = Math.round((record[kpiName as keyof PerformanceRecord] as number / target.monthly_target) * 100);
          totalAchievement += achievement;
          
          const category = getPerformanceCategory(achievement);
          if (category.name === 'Critical') criticalCount++;
          if (category.name === 'Good') goodCount++;
        }
      });
      
      analystSummary[analystName].averagePerformance = Math.round(totalAchievement / kpiNames.length);
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

  const getTopPerformers = () => {
    const analystSummary = getAnalystPerformanceSummary();
    return Object.entries(analystSummary)
      .sort(([,a], [,b]) => b.averagePerformance - a.averagePerformance)
      .slice(0, 3);
  };

  const getTeamInsights = () => {
    const analystSummary = getAnalystPerformanceSummary();
    const totalAnalysts = Object.keys(analystSummary).length;
    const totalCriticalKPIs = Object.values(analystSummary).reduce((sum: number, analyst: any) => sum + analyst.criticalKPIs, 0);
    const totalGoodKPIs = Object.values(analystSummary).reduce((sum: number, analyst: any) => sum + analyst.goodKPIs, 0);
    const avgTeamPerformance = Object.values(analystSummary).reduce((sum: number, analyst: any) => sum + analyst.averagePerformance, 0) / totalAnalysts;
    
    return {
      totalAnalysts,
      totalCriticalKPIs,
      totalGoodKPIs,
      avgTeamPerformance: Math.round(avgTeamPerformance || 0)
    };
  };
  const totalPerformance = calculateTotalPerformance();

  const categoryStats = getPerformanceCategoryStats(performanceData, targets);
  const topPerformers = getTopPerformers();
  const teamInsights = getTeamInsights();

  const getMonthlyTrends = () => {
    const monthlyData: { [key: string]: any } = {};
    
    performanceData.forEach(record => {
      const monthKey = `${record.year}-${record.month.padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          outreaches: 0,
          live_links: 0,
          high_da_links: 0,
          content_distribution: 0,
          new_blogs: 0,
          blog_optimizations: 0,
          top_5_keywords: 0
        };
      }
      
      monthlyData[monthKey].outreaches += record.outreaches;
      monthlyData[monthKey].live_links += record.live_links;
      monthlyData[monthKey].high_da_links += record.high_da_links;
      monthlyData[monthKey].content_distribution += record.content_distribution;
      monthlyData[monthKey].new_blogs += record.new_blogs;
      monthlyData[monthKey].blog_optimizations += record.blog_optimizations;
      monthlyData[monthKey].top_5_keywords += record.top_5_keywords;
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    
    return {
      labels: sortedMonths.map(month => {
        const [year, monthNum] = month.split('-');
        const date = new Date(parseInt(year), parseInt(monthNum) - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }),
      datasets: [
        {
          label: 'Outreaches',
          data: sortedMonths.map(month => monthlyData[month].outreaches),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        },
        {
          label: 'Live Links',
          data: sortedMonths.map(month => monthlyData[month].live_links),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.4
        }
      ]
    };
  };

  const getTargetComparison = () => {
    const targetMap = targets.reduce((acc, target) => {
      acc[target.kpi_name] = target.monthly_target * 13; // 13 months total
      return acc;
    }, {} as { [key: string]: number });

    return {
      labels: ['Outreaches', 'Live Links', 'High DA Links', 'Content Dist.', 'New Blogs', 'Blog Opt.', 'Top Keywords'],
      datasets: [
        {
          label: 'Actual',
          data: [
            totalPerformance.outreaches,
            totalPerformance.live_links,
            totalPerformance.high_da_links,
            totalPerformance.content_distribution,
            totalPerformance.new_blogs,
            totalPerformance.blog_optimizations,
            totalPerformance.top_5_keywords
          ],
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        },
        {
          label: 'Target',
          data: [
            targetMap.outreaches || 6825,
            targetMap.live_links || 195,
            targetMap.high_da_links || 39,
            targetMap.content_distribution || 104,
            targetMap.new_blogs || 130,
            targetMap.blog_optimizations || 65,
            targetMap.top_5_keywords || 39
          ],
          backgroundColor: 'rgba(239, 68, 68, 0.6)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1
        }
      ]
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Team Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Performance</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-3xl font-bold text-gray-900">{teamInsights.avgTeamPerformance}%</p>
                <PerformanceIndicator 
                  achievementPercentage={teamInsights.avgTeamPerformance}
                  showLabel={false}
                  size="sm"
                />
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-full">
              <BarChart3 className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Analysts</p>
              <p className="text-3xl font-bold text-gray-900">{analysts.length}</p>
              <p className="text-xs text-gray-500 mt-1">Contributing members</p>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Critical KPIs</p>
              <p className="text-3xl font-bold text-red-600">{teamInsights.totalCriticalKPIs}</p>
              <p className="text-xs text-gray-500 mt-1">Need attention</p>
            </div>
            <div className="bg-red-50 p-3 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Excellent KPIs</p>
              <p className="text-3xl font-bold text-green-600">{teamInsights.totalGoodKPIs}</p>
              <p className="text-xs text-gray-500 mt-1">Above target</p>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <Award className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-gray-800">Top Performers This Period</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {topPerformers.map(([analystName, performance], index) => (
            <div key={analystName} className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{analystName}</h4>
                <div className="flex items-center gap-1">
                  <span className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Avg Performance:</span>
                  <PerformanceIndicator 
                    achievementPercentage={performance.averagePerformance}
                    showLabel={true}
                    size="sm"
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Outreaches:</span>
                  <span className="font-medium">{performance.totalOutreaches.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Live Links:</span>
                  <span className="font-medium">{performance.totalLiveLinks}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Outreaches</p>
              <p className="text-3xl font-bold text-gray-900">{totalPerformance.outreaches.toLocaleString()}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Live Links</p>
              <p className="text-3xl font-bold text-gray-900">{totalPerformance.live_links}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-full">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">High DA Links</p>
              <p className="text-3xl font-bold text-gray-900">{totalPerformance.high_da_links}</p>
            </div>
            <div className="bg-orange-50 p-3 rounded-full">
              <Award className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Content Pieces</p>
              <p className="text-3xl font-bold text-gray-900">{totalPerformance.new_blogs + totalPerformance.content_distribution}</p>
            </div>
            <div className="bg-indigo-50 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Team Performance Analysis */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Team Performance Analysis</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-700 mb-3">Individual Analyst Summary</h4>
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
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Performance Trends</h3>
          <div className="h-80">
            <Line 
              data={getMonthlyTrends()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Target vs Actual Performance</h3>
          <div className="h-80">
            <Bar 
              data={getTargetComparison()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top' as const,
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Activity Overview</h3>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">Total Performance Records</span>
                <span className="text-2xl font-bold text-blue-900">{performanceData.length}</span>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">Avg Monthly Outreaches</span>
                <span className="text-2xl font-bold text-green-900">
                  {performanceData.length > 0 ? Math.round(totalPerformance.outreaches / performanceData.length) : 0}
                </span>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-purple-800">Avg Monthly Links</span>
                <span className="text-2xl font-bold text-purple-900">
                  {performanceData.length > 0 ? Math.round(totalPerformance.live_links / performanceData.length) : 0}
                </span>
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-orange-800">Content Success Rate</span>
                <span className="text-2xl font-bold text-orange-900">
                  {totalPerformance.outreaches > 0 ? Math.round((totalPerformance.live_links / totalPerformance.outreaches) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Category Legend */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Category Guide</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {performanceCategories.map((category) => (
            <div key={category.name} className="flex items-center p-4 rounded-lg border-2" style={{ borderColor: category.color }}>
              <div 
                className="w-4 h-4 rounded-full mr-3" 
                style={{ backgroundColor: category.color }}
              ></div>
              <div>
                <h4 className="font-semibold text-gray-900">{category.name}</h4>
                <p className="text-sm text-gray-600">{category.range}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Summary Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Performance Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KPI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actual</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Achievement %</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {[
                { name: 'Outreaches', actual: totalPerformance.outreaches, target: 6825 },
                { name: 'Live Links', actual: totalPerformance.live_links, target: 195 },
                { name: 'High DA Links', actual: totalPerformance.high_da_links, target: 39 },
                { name: 'Content Distribution', actual: totalPerformance.content_distribution, target: 104 },
                { name: 'New Blogs', actual: totalPerformance.new_blogs, target: 130 },
                { name: 'Blog Optimizations', actual: totalPerformance.blog_optimizations, target: 65 },
                { name: 'Top 5 Keywords', actual: totalPerformance.top_5_keywords, target: 39 }
              ].map((kpi) => {
                const achievement = Math.round((kpi.actual / kpi.target) * 100);
                return (
                  <tr key={kpi.name}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{kpi.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{kpi.actual.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{kpi.target.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <PerformanceIndicator 
                        achievementPercentage={achievement}
                        showLabel={true}
                        size="sm"
                      />
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
};

export default Dashboard;