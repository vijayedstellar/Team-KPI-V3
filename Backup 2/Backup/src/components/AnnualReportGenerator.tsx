import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, User, TrendingUp, Award, AlertTriangle, Target } from 'lucide-react';
import { performanceService } from '../services/performanceService';
import { analystService } from '../services/analytService';
import type { PerformanceRecord, TeamMember, KPITarget } from '../lib/supabase';
import { getPerformanceCategory } from '../utils/performanceCategories';
import { generateActionItems, formatKPIName } from '../utils/actionItemsGenerator';
import { generateYearRange, getMonthOptions, formatPeriodLabel, getDefaultReportPeriod } from '../utils/dateUtils';
import toast from 'react-hot-toast';

interface AnnualReportData {
  analyst: TeamMember;
  monthlyRecords: PerformanceRecord[];
  totalPerformance: { [key: string]: number };
  averagePerformance: number;
  performanceGrade: string;
  kpiPerformances: Array<{
    kpi: string;
    kpiDisplayName: string;
    achievement: number;
    actual: number;
    target: number;
  }>;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}

const AnnualReportGenerator: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [targets, setTargets] = useState<KPITarget[]>([]);
  const [selectedAnalyst, setSelectedAnalyst] = useState<string>('');
  const [selectedDesignation, setSelectedDesignation] = useState<string>('');
  const [reportPeriod, setReportPeriod] = useState<{
    startMonth: number;
    startYear: number;
    endMonth: number;
    endYear: number;
  }>(getDefaultReportPeriod());
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<AnnualReportData | null>(null);
  const [showSampleReport, setShowSampleReport] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('Loading data for Annual Report Generator...');
      const [members, kpiTargets] = await Promise.all([
        analystService.getAllAnalysts(),
        performanceService.getKPITargets()
      ]);
      
      console.log('Loaded team members:', members);
      console.log('Loaded KPI targets:', kpiTargets);
      
      setTeamMembers(members);
      setTargets(kpiTargets);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    }
  };

  const getFilteredAnalysts = () => {
    if (selectedDesignation) {
      return teamMembers.filter(member => member.designation === selectedDesignation);
    }
    return teamMembers;
  };

  const getUniqueDesignations = () => {
    const designations = [...new Set(teamMembers.map(member => member.designation).filter(Boolean))];
    return designations.sort();
  };

  const months = getMonthOptions();
  const years = generateYearRange(2024, 15); // 15 years into the future

  const formatPeriodLabelForDisplay = () => {
    return formatPeriodLabel(
      reportPeriod.startMonth,
      reportPeriod.startYear,
      reportPeriod.endMonth,
      reportPeriod.endYear
    );
  };

  const generateAnnualReport = async () => {
    if (!selectedAnalyst) {
      toast.error('Please select a team member');
      return;
    }

    setLoading(true);
    try {
      console.log('Generating annual report for analyst:', selectedAnalyst);
      
      // Find the selected analyst
      const analyst = teamMembers.find(a => a.id === selectedAnalyst);
      if (!analyst) {
        toast.error('Selected team member not found');
        setLoading(false);
        return;
      }

      console.log('Selected analyst:', analyst);

      // Get ALL performance records for this analyst
      const allPerformanceRecords = await performanceService.getPerformanceRecords(selectedAnalyst);
      console.log('All performance records for analyst:', allPerformanceRecords);

      if (allPerformanceRecords.length === 0) {
        toast.error('No performance data found for the selected team member');
        setLoading(false);
        return;
      }

      // Filter records to match the selected period
      const filteredRecords = allPerformanceRecords.filter(record => {
        const recordDate = new Date(record.year, parseInt(record.month) - 1);
        const startDate = new Date(reportPeriod.startYear, reportPeriod.startMonth - 1);
        const endDate = new Date(reportPeriod.endYear, reportPeriod.endMonth - 1);
        
        return recordDate >= startDate && recordDate <= endDate;
      });

      console.log('Filtered records for period:', filteredRecords);

      if (filteredRecords.length === 0) {
        toast.error(`No performance data found for ${analyst.name} in the selected period (${formatPeriodLabelForDisplay()})`);
        setLoading(false);
        return;
      }

      // Get KPI targets for this analyst's designation
      const analystTargets = targets.filter(target => 
        target.designation === analyst.designation || target.role === analyst.designation
      );
      
      console.log('KPI targets for analyst designation:', analystTargets);

      if (analystTargets.length === 0) {
        toast.error(`No KPI targets found for designation: ${analyst.designation}`);
        setLoading(false);
        return;
      }

      // Calculate total performance across all KPIs
      const totalPerformance: { [key: string]: number } = {};
      
      // Initialize all KPI totals to 0
      analystTargets.forEach(target => {
        totalPerformance[target.kpi_name] = 0;
      });

      // Sum up performance across all months
      filteredRecords.forEach(record => {
        analystTargets.forEach(target => {
          const kpiValue = (record as any)[target.kpi_name] || 0;
          totalPerformance[target.kpi_name] += kpiValue;
        });
      });

      console.log('Total performance calculated:', totalPerformance);

      // Calculate KPI performances and achievements
      const kpiPerformances: Array<{
        kpi: string;
        kpiDisplayName: string;
        achievement: number;
        actual: number;
        target: number;
      }> = [];

      let totalAchievement = 0;
      let validKPIs = 0;

      analystTargets.forEach(target => {
        const actualValue = totalPerformance[target.kpi_name] || 0;
        
        // Calculate target for the period
        let periodTarget = 0;
        if (target.annual_target > 0) {
          // Use annual target
          periodTarget = target.annual_target;
        } else if (target.monthly_target > 0) {
          // Calculate based on number of months in period
          periodTarget = target.monthly_target * filteredRecords.length;
        }

        if (periodTarget > 0) {
          const achievement = Math.round((actualValue / periodTarget) * 100);
          
          kpiPerformances.push({
            kpi: target.kpi_name,
            kpiDisplayName: formatKPIName(target.kpi_name),
            achievement,
            actual: actualValue,
            target: periodTarget
          });

          totalAchievement += achievement;
          validKPIs++;
        }
      });

      console.log('KPI performances calculated:', kpiPerformances);

      // Calculate average performance
      const averagePerformance = validKPIs > 0 ? Math.round(totalAchievement / validKPIs) : 0;
      const performanceCategory = getPerformanceCategory(averagePerformance);

      console.log('Average performance:', averagePerformance, 'Category:', performanceCategory.name);

      // Generate strengths and improvements
      const strengths: string[] = [];
      const improvements: string[] = [];

      kpiPerformances.forEach(kpi => {
        if (kpi.achievement >= 120) {
          strengths.push(`Exceptional ${kpi.kpiDisplayName}: ${kpi.achievement}% of target (${kpi.actual.toLocaleString()}/${kpi.target.toLocaleString()})`);
        } else if (kpi.achievement >= 100) {
          strengths.push(`Strong ${kpi.kpiDisplayName}: ${kpi.achievement}% of target (${kpi.actual.toLocaleString()}/${kpi.target.toLocaleString()})`);
        } else if (kpi.achievement < 84) {
          improvements.push(`${kpi.kpiDisplayName} needs improvement: ${kpi.achievement}% of target (${kpi.actual.toLocaleString()}/${kpi.target.toLocaleString()})`);
        }
      });

      // Add default messages if no specific strengths/improvements found
      if (strengths.length === 0) {
        strengths.push('Consistent performance across all KPIs');
        strengths.push('Reliable team member with steady contributions');
      }

      if (improvements.length === 0) {
        improvements.push('Continue maintaining current performance levels');
        improvements.push('Focus on consistency and quality');
      }

      // Generate recommendations based on latest performance
      const latestRecord = filteredRecords[filteredRecords.length - 1];
      let recommendations: string[] = [];
      
      if (latestRecord) {
        const actionItems = generateActionItems(latestRecord, filteredRecords.slice(0, -1), targets);
        recommendations = actionItems.slice(0, 5).map(item => item.recommendations[0]);
      }

      if (recommendations.length === 0) {
        recommendations = [
          'Continue current successful strategies',
          'Focus on maintaining consistency',
          'Set stretch goals for next period',
          'Share best practices with team members',
          'Explore opportunities for skill development'
        ];
      }

      // Create the final report data
      const reportData: AnnualReportData = {
        analyst,
        monthlyRecords: filteredRecords,
        totalPerformance,
        averagePerformance,
        performanceGrade: performanceCategory.name,
        kpiPerformances,
        strengths,
        improvements,
        recommendations
      };

      console.log('Final report data:', reportData);

      setReportData(reportData);
      toast.success(`Annual report generated successfully for ${analyst.name}`);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate annual report: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const printContent = document.getElementById('annual-report-content');
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Annual Performance Report - ${reportData.analyst.name}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .section { margin-bottom: 25px; }
            .section h3 { color: #333; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
            .kpi-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 15px 0; }
            .kpi-item { padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
            .performance-badge { padding: 5px 10px; border-radius: 15px; font-weight: bold; }
            .critical { background-color: #fee; color: #c53030; }
            .bad { background-color: #fffbeb; color: #d69e2e; }
            .target { background-color: #f0fff4; color: #38a169; }
            .good { background-color: #ebf8ff; color: #3182ce; }
            ul { padding-left: 20px; }
            li { margin-bottom: 5px; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  const getPerformanceGradeColor = (grade: string) => {
    switch (grade) {
      case 'Critical': return 'text-red-600 bg-red-100';
      case 'Bad': return 'text-amber-600 bg-amber-100';
      case 'Target': return 'text-green-600 bg-green-100';
      case 'Good': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPerformanceColor = (achievement: number) => {
    if (achievement >= 120) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (achievement >= 84) return 'bg-green-100 text-green-800 border-green-200';
    if (achievement >= 67) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Annual Performance Report Generator</h2>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Designation</label>
            <select
              value={selectedDesignation}
              onChange={(e) => {
                setSelectedDesignation(e.target.value);
                setSelectedAnalyst(''); // Reset selected analyst when designation changes
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Designations</option>
              {getUniqueDesignations().map((designation) => (
                <option key={designation} value={designation}>{designation}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Team Member</label>
            <select
              value={selectedAnalyst}
              onChange={(e) => setSelectedAnalyst(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose team member...</option>
              {getFilteredAnalysts().map((analyst) => (
                <option key={analyst.id} value={analyst.id}>{analyst.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Period</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <div className="flex gap-1">
                  <select
                    value={reportPeriod.startMonth}
                    onChange={(e) => setReportPeriod({
                      ...reportPeriod,
                      startMonth: parseInt(e.target.value)
                    })}
                    className="flex-1 px-2 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                  <select
                    value={reportPeriod.startYear}
                    onChange={(e) => setReportPeriod({
                      ...reportPeriod,
                      startYear: parseInt(e.target.value)
                    })}
                    className="w-20 px-2 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <div className="flex gap-1">
                  <select
                    value={reportPeriod.endMonth}
                    onChange={(e) => setReportPeriod({
                      ...reportPeriod,
                      endMonth: parseInt(e.target.value)
                    })}
                    className="flex-1 px-2 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {months.map((month) => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                  <select
                    value={reportPeriod.endYear}
                    onChange={(e) => setReportPeriod({
                      ...reportPeriod,
                      endYear: parseInt(e.target.value)
                    })}
                    className="w-20 px-2 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {years.map((year) => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Selected period: {formatPeriodLabelForDisplay()}
            </p>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={generateAnnualReport}
              disabled={loading || !selectedAnalyst}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {reportData && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">
              Annual Performance Report - {reportData.analyst.name}
            </h3>
            <button
              onClick={exportToPDF}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>

          <div id="annual-report-content" className="p-6">
            {/* Report Header */}
            <div className="header text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Annual Performance Report</h1>
              <div className="text-lg text-gray-600">
                <div className="flex items-center justify-center gap-2">
                  <User className="w-5 h-5" />
                  <span><strong>{reportData.analyst.name}</strong> - {reportData.analyst.designation}</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Performance Period: {formatPeriodLabelForDisplay()}</span>
                </div>
                <p>Report Generated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="section mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Executive Summary
              </h3>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{reportData.averagePerformance}%</div>
                    <div className="text-sm text-gray-600">Overall Performance</div>
                  </div>
                  <div className="text-center">
                    <div className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getPerformanceGradeColor(reportData.performanceGrade)}`}>
                      {reportData.performanceGrade}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Performance Grade</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-gray-900">{reportData.monthlyRecords.length}</div>
                    <div className="text-sm text-gray-600">Months Tracked</div>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Performance Summary */}
            <div className="section mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                KPI Performance Summary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportData.kpiPerformances.map((kpi) => (
                  <div key={kpi.kpi} className={`p-4 rounded-lg border-2 ${getPerformanceColor(kpi.achievement)}`}>
                    <div className="font-semibold text-gray-900 text-sm mb-2">{kpi.kpiDisplayName}</div>
                    <div className="text-2xl font-bold mb-1">{kpi.actual.toLocaleString()}</div>
                    <div className="text-xs text-gray-600 mb-2">Target: {kpi.target.toLocaleString()}</div>
                    <div className="text-sm font-semibold">
                      {kpi.achievement}% Achievement
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths */}
            <div className="section mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Key Strengths
              </h3>
              <ul className="space-y-2">
                {reportData.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div className="section mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Areas for Improvement
              </h3>
              <ul className="space-y-2">
                {reportData.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="section mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Recommendations for Next Period
              </h3>
              <ul className="space-y-2">
                {reportData.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Monthly Performance Trend */}
            <div className="section">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Monthly Performance Trend</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                      {reportData.kpiPerformances.slice(0, 4).map((kpi) => (
                        <th key={kpi.kpi} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          {kpi.kpiDisplayName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.monthlyRecords.map((record) => (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(record.year, parseInt(record.month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </td>
                        {reportData.kpiPerformances.slice(0, 4).map((kpi) => (
                          <td key={kpi.kpi} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {((record as any)[kpi.kpi] || 0).toLocaleString()}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {!reportData && !showSampleReport && (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Annual Performance Report</h3>
          <p className="text-gray-500 mb-6">
            Select a team member and period to generate a comprehensive annual performance report with real KPI data, analysis, strengths, improvements, and recommendations.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Report Features:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Uses real performance data from your database</li>
              <li>• Calculates actual KPI achievements vs targets</li>
              <li>• Provides data-driven strengths and improvement areas</li>
              <li>• Generates actionable recommendations</li>
              <li>• Shows monthly performance trends</li>
              <li>• Professional PDF export for HR records</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnualReportGenerator;