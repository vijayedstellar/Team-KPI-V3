import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, User, Filter, X, Eye, Image } from 'lucide-react';
import { analystService } from '../services/analytService';
import { performanceService } from '../services/performanceService';
import { goalService } from '../services/goalService';
import type { TeamMember, PerformanceRecord, KPITarget } from '../lib/supabase';
import { generateYearRange, getMonthOptions, formatMonthName, getDefaultReportPeriod } from '../utils/dateUtils';
import AnnualReportGenerator from './annual-report/AnnualReportGenerator';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';

const AnnualReports: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [generatedReport, setGeneratedReport] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  
  const [reportConfig, setReportConfig] = useState({
    teamMemberId: '',
    startMonth: getDefaultReportPeriod().startMonth,
    startYear: getDefaultReportPeriod().startYear,
    endMonth: getDefaultReportPeriod().endMonth,
    endYear: getDefaultReportPeriod().endYear,
    format: 'comprehensive' as 'comprehensive' | 'summary' | 'kpi-only',
    includeGoals: true,
    includeActionItems: true
  });

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      const members = await analystService.getAllAnalysts();
      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!reportConfig.teamMemberId) {
      toast.error('Please select a team member');
      return;
    }

    try {
      setGenerating(true);
      
      // Load all required data for the report
      const [performanceRecords, targets, goals, userMappings, kpiDefinitions] = await Promise.all([
        performanceService.getAnalystPeriodPerformance(reportConfig.teamMemberId, {
          startMonth: reportConfig.startMonth,
          startYear: reportConfig.startYear,
          endMonth: reportConfig.endMonth,
          endYear: reportConfig.endYear
        }),
        performanceService.getKPITargets(),
        reportConfig.includeGoals ? goalService.getUserGoals() : Promise.resolve([]),
        performanceService.getUserKPIMappings(reportConfig.teamMemberId),
        performanceService.getKPIDefinitions()
      ]);

      const selectedMember = teamMembers.find(m => m.id === reportConfig.teamMemberId);
      
      if (!selectedMember) {
        toast.error('Selected team member not found');
        return;
      }

      // Filter goals for the selected team member and period
      const memberGoals = goals.filter(goal => 
        goal.team_member_id === reportConfig.teamMemberId
      );

      const reportData = {
        teamMember: selectedMember,
        performanceRecords,
        targets,
        goals: memberGoals,
        userMappings,
        kpiDefinitions,
        period: {
          startMonth: reportConfig.startMonth,
          startYear: reportConfig.startYear,
          endMonth: reportConfig.endMonth,
          endYear: reportConfig.endYear
        },
        config: reportConfig
      };

      setGeneratedReport(reportData);
      setShowReportModal(true);
      setShowGenerateModal(false);
      
      toast.success('Annual report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportAsImage = async () => {
    if (!generatedReport) return;
    
    try {
      // Show loading state
      toast.loading('Preparing report for export...', { id: 'image-export' });
      
      // Wait for any pending renders and ensure all content is loaded
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const reportElement = document.querySelector('.annual-report-container');
      if (!reportElement) {
        toast.error('Report content not found');
        return;
      }
      
      // Update loading message
      toast.loading('Generating high-quality image...', { id: 'image-export' });
      
      // Wait a bit more to ensure all styles are applied
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(reportElement as HTMLElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: Math.max(reportElement.scrollWidth, reportElement.clientWidth),
        height: Math.max(reportElement.scrollHeight, reportElement.clientHeight),
        scrollX: 0,
        scrollY: 0,
        logging: false,
        removeContainer: false,
        foreignObjectRendering: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          // Ensure all styles are properly applied in the cloned document
          const clonedElement = clonedDoc.querySelector('.annual-report-container');
          if (clonedElement) {
            clonedElement.style.transform = 'none';
            clonedElement.style.position = 'static';
            clonedElement.style.overflow = 'visible';
          }
        }
      });
      
      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `annual_report_${generatedReport.teamMember.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          toast.success('Report exported as image successfully!', { id: 'image-export' });
        } else {
          toast.error('Failed to generate image', { id: 'image-export' });
        }
      }, 'image/png', 1.0);
      
    } catch (error) {
      console.error('Error exporting as image:', error);
      toast.error('Failed to export as image', { id: 'image-export' });
    }
  };

  const formatPeriodLabel = () => {
    const startMonthName = formatMonthName(reportConfig.startMonth);
    const endMonthName = formatMonthName(reportConfig.endMonth);
    return `${startMonthName} ${reportConfig.startYear} - ${endMonthName} ${reportConfig.endYear}`;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Annual Reports</h2>
            <p className="text-gray-600">Generate comprehensive performance reports for team members</p>
          </div>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Generate Report
        </button>
      </div>

      {/* Report Generation Options */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Report Generation Options</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Comprehensive Report */}
          <div className="border-2 border-blue-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Comprehensive Report</h4>
                <p className="text-sm text-gray-600">Full annual review</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 mb-4">
              <li>• Executive Summary</li>
              <li>• Complete KPI Analysis</li>
              <li>• Goals Achievement Summary</li>
              <li>• Strengths & Development Areas</li>
              <li>• Strategic Recommendations</li>
              <li>• Monthly Performance Trends</li>
              <li>• Action Items & Insights</li>
            </ul>
            <button
              onClick={() => {
                setReportConfig({ ...reportConfig, format: 'comprehensive' });
                setShowGenerateModal(true);
              }}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate Comprehensive
            </button>
          </div>

          {/* Summary Report */}
          <div className="border-2 border-green-200 rounded-lg p-6 hover:border-green-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">Summary Report</h4>
                <p className="text-sm text-gray-600">Key highlights only</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 mb-4">
              <li>• Executive Summary</li>
              <li>• Top KPI Achievements</li>
              <li>• Key Goals Status</li>
              <li>• Overall Performance Grade</li>
              <li>• Top 3 Recommendations</li>
            </ul>
            <button
              onClick={() => {
                setReportConfig({ ...reportConfig, format: 'summary' });
                setShowGenerateModal(true);
              }}
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Generate Summary
            </button>
          </div>

          {/* KPI-Only Report */}
          <div className="border-2 border-purple-200 rounded-lg p-6 hover:border-purple-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">KPI-Only Report</h4>
                <p className="text-sm text-gray-600">Performance metrics focus</p>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-gray-600 mb-4">
              <li>• KPI Performance Summary</li>
              <li>• Achievement Percentages</li>
              <li>• Monthly Trends Analysis</li>
              <li>• Performance Categories</li>
              <li>• Target vs Actual Comparison</li>
            </ul>
            <button
              onClick={() => {
                setReportConfig({ ...reportConfig, format: 'kpi-only', includeGoals: false });
                setShowGenerateModal(true);
              }}
              className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              Generate KPI Report
            </button>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Generate</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.slice(0, 6).map((member) => (
            <div key={member.id} className="border rounded-lg p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{member.name}</h4>
                  <p className="text-sm text-gray-600">{member.designation}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setReportConfig({
                    ...reportConfig,
                    teamMemberId: member.id,
                    format: 'comprehensive'
                  });
                  handleGenerateReport();
                }}
                className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                Quick Report
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Generate Report Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Generate Annual Report</h3>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Team Member Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Team Member <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={reportConfig.teamMemberId}
                  onChange={(e) => setReportConfig({ ...reportConfig, teamMemberId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select team member...</option>
                  {teamMembers.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} ({member.designation})
                    </option>
                  ))}
                </select>
              </div>

              {/* Report Period */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Period</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Start Period</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={reportConfig.startMonth}
                        onChange={(e) => setReportConfig({
                          ...reportConfig,
                          startMonth: parseInt(e.target.value)
                        })}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {months.map((month) => (
                          <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                      </select>
                      <select
                        value={reportConfig.startYear}
                        onChange={(e) => setReportConfig({
                          ...reportConfig,
                          startYear: parseInt(e.target.value)
                        })}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {years.map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">End Period</label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={reportConfig.endMonth}
                        onChange={(e) => setReportConfig({
                          ...reportConfig,
                          endMonth: parseInt(e.target.value)
                        })}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {months.map((month) => (
                          <option key={month.value} value={month.value}>{month.label}</option>
                        ))}
                      </select>
                      <select
                        value={reportConfig.endYear}
                        onChange={(e) => setReportConfig({
                          ...reportConfig,
                          endYear: parseInt(e.target.value)
                        })}
                        className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        {years.map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Selected Period:</strong> {formatPeriodLabel()}
                  </p>
                </div>
              </div>

              {/* Report Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Report Format</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="comprehensive"
                      checked={reportConfig.format === 'comprehensive'}
                      onChange={(e) => setReportConfig({ ...reportConfig, format: e.target.value as any })}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Comprehensive Report</span>
                      <p className="text-xs text-gray-500">Complete analysis with all sections and recommendations</p>
                    </div>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="summary"
                      checked={reportConfig.format === 'summary'}
                      onChange={(e) => setReportConfig({ ...reportConfig, format: e.target.value as any })}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">Summary Report</span>
                      <p className="text-xs text-gray-500">Key highlights and executive summary only</p>
                    </div>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="kpi-only"
                      checked={reportConfig.format === 'kpi-only'}
                      onChange={(e) => setReportConfig({ 
                        ...reportConfig, 
                        format: e.target.value as any,
                        includeGoals: false 
                      })}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div>
                      <span className="text-sm font-medium text-gray-700">KPI-Only Report</span>
                      <p className="text-xs text-gray-500">Focus on performance metrics and achievements</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Additional Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Options</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={reportConfig.includeGoals}
                      onChange={(e) => setReportConfig({ ...reportConfig, includeGoals: e.target.checked })}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={reportConfig.format === 'kpi-only'}
                    />
                    <span className="text-sm text-gray-700">Include Goals Analysis</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={reportConfig.includeActionItems}
                      onChange={(e) => setReportConfig({ ...reportConfig, includeActionItems: e.target.checked })}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">Include Action Items & Recommendations</span>
                  </label>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateReport}
                  disabled={!reportConfig.teamMemberId || generating}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {generating ? (
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
        </div>
      )}

      {/* Generated Report Modal */}
      {showReportModal && generatedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-lg">
              <h3 className="text-lg font-semibold text-gray-900">
                Annual Performance Report - {generatedReport.teamMember.name}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportAsImage}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                  <Image className="w-4 h-4" />
                  Export Image
                </button>
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setGeneratedReport(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 annual-report-container">
              <AnnualReportGenerator
                teamMember={generatedReport.teamMember}
                performanceRecords={generatedReport.performanceRecords}
                targets={generatedReport.targets}
                goals={generatedReport.goals}
                userMappings={generatedReport.userMappings}
                kpiDefinitions={generatedReport.kpiDefinitions}
                period={generatedReport.period}
                config={generatedReport.config}
              />
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">How to Generate Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-blue-700 mb-2">Report Types</h4>
            <ul className="space-y-1 text-sm text-blue-600">
              <li>• <strong>Comprehensive:</strong> Complete annual review with all sections</li>
              <li>• <strong>Summary:</strong> Executive overview with key highlights</li>
              <li>• <strong>KPI-Only:</strong> Performance metrics and trends focus</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-700 mb-2">Features</h4>
            <ul className="space-y-1 text-sm text-blue-600">
              <li>• PDF export for HR documentation</li>
              <li>• Customizable reporting periods</li>
              <li>• Goals and KPI integration</li>
              <li>• Action items and recommendations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnnualReports;