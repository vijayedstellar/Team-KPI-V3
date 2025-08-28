import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, User, TrendingUp, Award, AlertTriangle, Target, Users } from 'lucide-react';
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
      // First, try to get user-specific KPI mappings
      console.log('Getting user-specific KPI mappings for analyst:', selectedAnalyst);
      const userMappings = await performanceService.getUserKPIMappingsFromView(selectedAnalyst);
      console.log('User-specific KPI mappings for analyst:', userMappings);
      
      let analystTargets: KPITarget[] = [];
      
      if (userMappings.length > 0) {
        // Convert user mappings to KPITarget format
        analystTargets = userMappings.map(mapping => ({
          id: mapping.id,
          kpi_name: mapping.kpi_name,
          monthly_target: mapping.monthly_target,
          annual_target: mapping.annual_target,
          designation: analyst.designation,
          role: analyst.designation,
          created_at: mapping.created_at
        }));
        console.log('Using user-specific targets:', analystTargets);
      } else {
        console.log('No user-specific mappings found, checking designation-based targets...');
        // Fallback to designation-based targets
        analystTargets = targets.filter(target => 
          target.designation === analyst.designation || target.role === analyst.designation
        );
        console.log('Using designation-based targets:', analystTargets);
      }
      
      console.log('KPI targets for analyst designation:', analystTargets);

      if (analystTargets.length === 0) {
        toast.error(`No KPI targets found for ${analyst.name} (${analyst.designation}). Please set up user-specific KPI targets in Settings → User KPI Mappings first.`);
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
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-800">Report Configuration</h3>
            <div className="text-sm text-gray-500 hidden sm:block">
              Configure your annual performance report parameters
            </div>
          </div>
          
          {/* Form Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Team Member Selection */}
            <div className="xl:col-span-2 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Filter by Designation
                  </label>
                  <select
                    value={selectedDesignation}
                    onChange={(e) => {
                      setSelectedDesignation(e.target.value);
                      setSelectedAnalyst(''); // Reset selected analyst when designation changes
                    }}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white shadow-sm text-sm sm:text-base"
                  >
                    <option value="">All Designations</option>
                    {getUniqueDesignations().map((designation) => (
                      <option key={designation} value={designation}>{designation}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4 text-green-600" />
                    <span className="hidden sm:inline">Select Team Member</span>
                    <span className="sm:hidden">Team Member</span>
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedAnalyst}
                    onChange={(e) => setSelectedAnalyst(e.target.value)}
                    className="w-full px-3 py-2 sm:px-4 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white shadow-sm text-sm sm:text-base"
                  >
                    <option value="">Choose team member...</option>
                    {getFilteredAnalysts().map((analyst) => (
                      <option key={analyst.id} value={analyst.id}>{analyst.name}</option>
                    ))}
                  </select>
                  {!selectedAnalyst && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Select a team member to generate their annual report
                    </p>
                  )}
                </div>
              </div>
            </div>
          
            {/* Report Period Section */}
            <div className="xl:col-span-1">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h4 className="font-semibold text-gray-800 text-sm sm:text-base">Report Period</h4>
                </div>
                
                <div className="space-y-4">
                  {/* Period Selection */}
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        Start Period
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={reportPeriod.startMonth}
                          onChange={(e) => setReportPeriod({
                            ...reportPeriod,
                            startMonth: parseInt(e.target.value)
                          })}
                          className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-xs sm:text-sm"
                        >
                          {months.map((month) => (
                            <option key={month.value} value={month.value}>
                              <span className="hidden sm:inline">{month.label}</span>
                              <span className="sm:hidden">{month.label.slice(0, 3)}</span>
                            </option>
                          ))}
                        </select>
                        <select
                          value={reportPeriod.startYear}
                          onChange={(e) => setReportPeriod({
                            ...reportPeriod,
                            startYear: parseInt(e.target.value)
                          })}
                          className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-xs sm:text-sm"
                        >
                          {years.map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                        End Period
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={reportPeriod.endMonth}
                          onChange={(e) => setReportPeriod({
                            ...reportPeriod,
                            endMonth: parseInt(e.target.value)
                          })}
                          className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-xs sm:text-sm"
                        >
                          {months.map((month) => (
                            <option key={month.value} value={month.value}>
                              <span className="hidden sm:inline">{month.label}</span>
                              <span className="sm:hidden">{month.label.slice(0, 3)}</span>
                            </option>
                          ))}
                        </select>
                        <select
                          value={reportPeriod.endYear}
                          onChange={(e) => setReportPeriod({
                            ...reportPeriod,
                            endYear: parseInt(e.target.value)
                          })}
                          className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-xs sm:text-sm"
                        >
                          {years.map((year) => (
                            <option key={year} value={year}>{year}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Period Summary */}
                  <div className="bg-white rounded-lg p-3 sm:p-4 border border-blue-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-700">Selected Period</p>
                        <p className="text-sm sm:text-lg font-bold text-blue-800 break-words">
                          {formatPeriodLabelForDisplay()}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="text-xs sm:text-sm font-semibold text-gray-700">
                          {(() => {
                            const startDate = new Date(reportPeriod.startYear, reportPeriod.startMonth - 1);
                            const endDate = new Date(reportPeriod.endYear, reportPeriod.endMonth - 1);
                            const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                                             (endDate.getMonth() - startDate.getMonth()) + 1;
                            return `${monthsDiff} month${monthsDiff !== 1 ? 's' : ''}`;
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Generate Button */}
          <div className="flex justify-center pt-4">
            <button
              onClick={generateAnnualReport}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span className="font-semibold">
                    <span className="hidden sm:inline">Generating Report...</span>
                    <span className="sm:hidden">Generating...</span>
                  </span>
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  <span className="font-semibold">
                    <span className="hidden sm:inline">Generate Annual Report</span>
                    <span className="sm:hidden">Generate Report</span>
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      {reportData && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 sm:p-6 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <h3 className="text-lg font-semibold text-gray-800">
              Annual Performance Report - {reportData.analyst.name}
            </h3>
            <button
              onClick={exportToPDF}
              className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export PDF</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>

          <div id="annual-report-content" className="p-4 sm:p-6">
            {/* Report Header */}
            <div className="header text-center mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">Annual Performance Report</h1>
              <div className="text-sm sm:text-base lg:text-lg text-gray-600 space-y-1 sm:space-y-0">
                <div className="flex items-center justify-center gap-2">
                  <User className="w-5 h-5" />
                  <span className="text-center">
                    <strong>{reportData.analyst.name}</strong>
                    <span className="hidden sm:inline"> - </span>
                    <span className="block sm:inline">{reportData.analyst.designation}</span>
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <Calendar className="w-4 h-4" />
                  <span className="text-center">
                    <span className="hidden sm:inline">Performance Period: </span>
                    <span className="sm:hidden">Period: </span>
                    {formatPeriodLabelForDisplay()}
                  </span>
                </div>
                <p className="text-xs sm:text-sm">Report Generated: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="section mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                Executive Summary
              </h3>
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900">{reportData.averagePerformance}%</div>
                    <div className="text-xs sm:text-sm text-gray-600">Overall Performance</div>
                  </div>
                  <div className="text-center">
                    <div className={`inline-block px-3 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold ${getPerformanceGradeColor(reportData.performanceGrade)}`}>
                      {reportData.performanceGrade}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 mt-1">Performance Grade</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold text-gray-900">{reportData.monthlyRecords.length}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Months Tracked</div>
                  </div>
                </div>
              </div>
            </div>

            {/* KPI Performance Summary */}
            <div className="section mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                KPI Performance Summary
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {reportData.kpiPerformances.map((kpi) => (
                  <div key={kpi.kpi} className={`p-3 sm:p-4 rounded-lg border-2 ${getPerformanceColor(kpi.achievement)}`}>
                    <div className="font-semibold text-gray-900 text-xs sm:text-sm mb-2 break-words">{kpi.kpiDisplayName}</div>
                    <div className="text-xl sm:text-2xl font-bold mb-1">{kpi.actual.toLocaleString()}</div>
                    <div className="text-xs text-gray-600 mb-2">Target: {kpi.target.toLocaleString()}</div>
                    <div className="text-xs sm:text-sm font-semibold">
                      {kpi.achievement}% Achievement
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Strengths */}
            <div className="section mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Key Strengths
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {reportData.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-sm sm:text-base break-words">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div className="section mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                Areas for Improvement
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {reportData.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-sm sm:text-base break-words">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="section mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Recommendations for Next Period
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {reportData.recommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-sm sm:text-base break-words">{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Monthly Performance Trend */}
            <div className="section">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Monthly Performance Trend</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                      {reportData.kpiPerformances.slice(0, 4).map((kpi) => (
                        <th key={kpi.kpi} className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          <span className="hidden sm:inline">{kpi.kpiDisplayName}</span>
                          <span className="sm:hidden">{kpi.kpiDisplayName.split(' ')[0]}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.monthlyRecords.map((record) => (
                      <tr key={record.id}>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">
                          <span className="hidden sm:inline">
                            {new Date(record.year, parseInt(record.month) - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </span>
                          <span className="sm:hidden">
                            {new Date(record.year, parseInt(record.month) - 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                          </span>
                        </td>
                        {reportData.kpiPerformances.slice(0, 4).map((kpi) => (
                          <td key={kpi.kpi} className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
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
        <div className="bg-white rounded-lg shadow-sm border p-6 sm:p-12 text-center">
          <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Generate Annual Performance Report</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-6">
            Select a team member and period to generate a comprehensive annual performance report with real KPI data, analysis, strengths, improvements, and recommendations.
          </p>
          
          {/* Setup Requirements */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <h4 className="font-semibold text-amber-800 text-sm sm:text-base">Setup Requirements</h4>
            </div>
            <div className="text-xs sm:text-sm text-amber-700 space-y-2">
              <p>Before generating reports, ensure you have:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Created designations in <strong>Settings → Designations</strong></li>
                <li>Defined KPIs in <strong>Settings → KPI Definitions</strong></li>
                <li>Mapped KPIs to designations in <strong>Settings → KPI Mappings</strong></li>
                <li>Added team members with proper designations in <strong>Members</strong></li>
                <li>Recorded performance data in <strong>Performance Tracking</strong></li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg text-left">
            <h4 className="font-semibold text-blue-800 mb-2 text-sm sm:text-base">Report Features:</h4>
            <ul className="text-xs sm:text-sm text-blue-700 space-y-1">
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