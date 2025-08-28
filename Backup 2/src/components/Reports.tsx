import React, { useState, useEffect } from 'react';
import { Download, FileText, Calendar, User, TrendingUp } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import { performanceService } from '../services/performanceService';
import { analystService } from '../services/analytService';
import type { PerformanceRecord, Analyst, KPITarget } from '../lib/supabase';
import PerformanceCategoryChart from './PerformanceCategoryChart';
import PerformanceIndicator from './PerformanceIndicator';
import { getPerformanceCategoryStats } from '../utils/performanceCategories';
import { generateYearRange, getMonthOptions } from '../utils/dateUtils';

const Reports: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<PerformanceRecord[]>([]);
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [targets, setTargets] = useState<KPITarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAnalyst, setSelectedAnalyst] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    loadReportData();
  }, [selectedAnalyst, selectedYear, selectedMonth]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      const [records, analystsList, kpiTargets] = await Promise.all([
        performanceService.getPerformanceRecords(selectedAnalyst || undefined),
        analystService.getActiveAnalysts(),
        performanceService.getKPITargets()
      ]);

      let filteredRecords = records;
      if (selectedYear) {
        filteredRecords = records.filter(record => record.year === selectedYear);
      }
      if (selectedMonth) {
        filteredRecords = filteredRecords.filter(record => record.month === selectedMonth);
      }

      setPerformanceData(filteredRecords);
      setAnalysts(analystsList);
      setTargets(kpiTargets);
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalystPerformance = () => {
    const analystPerformance: { [key: string]: any } = {};

    performanceData.forEach(record => {
      const analyst = analysts.find(a => a.id === record.team_member_id);
      const analystName = analyst?.name || 'Unknown';
      
      if (!analystPerformance[analystName]) {
        analystPerformance[analystName] = {
          totalOutreaches: 0,
          totalLiveLinks: 0,
          totalHighDALinks: 0,
          totalContentDistribution: 0,
          totalNewBlogs: 0,
          totalBlogOptimizations: 0,
          totalTopKeywords: 0,
          monthsRecorded: 0,
          designation: analyst?.designation || 'Unknown'
        };
      }

      analystPerformance[analystName].totalOutreaches += record.outreaches;
      analystPerformance[analystName].totalLiveLinks += record.live_links;
      analystPerformance[analystName].totalHighDALinks += record.high_da_links;
      analystPerformance[analystName].totalContentDistribution += record.content_distribution;
      analystPerformance[analystName].totalNewBlogs += record.new_blogs;
      analystPerformance[analystName].totalBlogOptimizations += record.blog_optimizations;
      analystPerformance[analystName].totalTopKeywords += record.top_5_keywords;
      analystPerformance[analystName].monthsRecorded += 1;
    });

    return analystPerformance;
  };

  const getMonthlyProgressChart = () => {
    const monthlyData: { [key: string]: any } = {};
    
    performanceData.forEach(record => {
      const monthKey = `${record.year}-${record.month.padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          outreaches: 0,
          live_links: 0,
          high_da_links: 0,
          new_blogs: 0
        };
      }
      
      monthlyData[monthKey].outreaches += record.outreaches;
      monthlyData[monthKey].live_links += record.live_links;
      monthlyData[monthKey].high_da_links += record.high_da_links;
      monthlyData[monthKey].new_blogs += record.new_blogs;
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
        },
        {
          label: 'High DA Links',
          data: sortedMonths.map(month => monthlyData[month].high_da_links),
          borderColor: 'rgb(245, 158, 11)',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
          tension: 0.4
        }
      ]
    };
  };

  const getAnalystComparisonChart = () => {
    const analystPerformance = calculateAnalystPerformance();
    const analystNames = Object.keys(analystPerformance);

    return {
      labels: analystNames,
      datasets: [
        {
          label: 'Total Outreaches',
          data: analystNames.map(name => analystPerformance[name].totalOutreaches),
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        },
        {
          label: 'Total Live Links',
          data: analystNames.map(name => analystPerformance[name].totalLiveLinks),
          backgroundColor: 'rgba(16, 185, 129, 0.6)',
          borderColor: 'rgb(16, 185, 129)',
          borderWidth: 1
        }
      ]
    };
  };

  const exportToCSV = () => {
    const csvData = [
      ['Analyst', 'Month', 'Year', 'Outreaches', 'Live Links', 'High DA Links', 'Content Distribution', 'New Blogs', 'Blog Optimizations', 'Top Keywords'],
      ...performanceData.map(record => [
        record.analysts?.name || 'Unknown',
        record.month,
        record.year,
        record.outreaches,
        record.live_links,
        record.high_da_links,
        record.content_distribution,
        record.new_blogs,
        record.blog_optimizations,
        record.top_5_keywords
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seo_performance_report_${selectedYear}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const months = getMonthOptions().map(month => ({
    value: month.value.toString().padStart(2, '0'),
    label: month.label
  }));
  
  const years = generateYearRange(2024, 15); // 15 years into the future

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const analystPerformance = calculateAnalystPerformance();

  const categoryStats = getPerformanceCategoryStats(performanceData, targets);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Performance Reports</h2>
        </div>
        <button
          onClick={exportToCSV}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Analyst</label>
            <select
              value={selectedAnalyst}
              onChange={(e) => setSelectedAnalyst(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
            >
              <option value="">All Analysts</option>
              {analysts.map((analyst) => (
                <option key={analyst.id} value={analyst.id}>{analyst.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {generateYearRange(2024, 20).map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[150px]"
            >
              <option value="">All Months</option>
              {months.map((month) => (
                <option key={month.value} value={month.value}>{month.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Records</p>
              <p className="text-3xl font-bold text-gray-900">{performanceData.length}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-full">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Analysts</p>
              <p className="text-3xl font-bold text-gray-900">{Object.keys(analystPerformance).length}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <User className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reporting Period</p>
              <p className="text-lg font-bold text-gray-900">{selectedYear}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-full">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Monthly Progress Trend</h3>
          <div className="h-80">
            <Line 
              data={getMonthlyProgressChart()}
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Analyst Performance Comparison</h3>
          <div className="h-80">
            <Bar 
              data={getAnalystComparisonChart()}
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall Performance Distribution</h3>
          <PerformanceCategoryChart stats={categoryStats} />
        </div>
      </div>

      {/* Performance Category Summary */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Category Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Critical (0-66%)</p>
                <p className="text-2xl font-bold text-red-800">{categoryStats.critical}</p>
              </div>
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            </div>
          </div>
          
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">Bad (67-83%)</p>
                <p className="text-2xl font-bold text-amber-800">{categoryStats.bad}</p>
              </div>
              <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            </div>
          </div>
          
          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600">Target (84-119%)</p>
                <p className="text-2xl font-bold text-emerald-800">{categoryStats.target}</p>
              </div>
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Good (120%+)</p>
                <p className="text-2xl font-bold text-blue-800">{categoryStats.good}</p>
              </div>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Analyst Performance Summary */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Analyst Performance Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Analyst</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Months Recorded</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Outreaches</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Live Links</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total High DA</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Monthly Performance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(analystPerformance).map(([analystName, performance]) => (
                <tr key={analystName}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{analystName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{performance.designation}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{performance.monthsRecorded}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{performance.totalOutreaches.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{performance.totalLiveLinks}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{performance.totalHighDALinks}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      {Math.round((performance.totalOutreaches / performance.monthsRecorded) || 0)} outreaches/month
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {Object.keys(analystPerformance).length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No performance data available for the selected filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;