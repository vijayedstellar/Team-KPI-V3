import React, { useState, useEffect } from 'react';
import { Plus, Edit, Calendar, TrendingUp, BarChart3, AlertTriangle, X, Save, Trash2 } from 'lucide-react';
import { performanceService } from '../services/performanceService';
import { analystService } from '../services/analytService';
import type { PerformanceRecord, Analyst, KPITarget } from '../lib/supabase';
import PerformanceIndicator from './PerformanceIndicator';
import ActionItemsPanel from './ActionItemsPanel';
import { generateActionItems } from '../utils/actionItemsGenerator';
import toast from 'react-hot-toast';

const PerformanceTracking: React.FC = () => {
  const [performanceRecords, setPerformanceRecords] = useState<PerformanceRecord[]>([]);
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [targets, setTargets] = useState<KPITarget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PerformanceRecord | null>(null);
  const [selectedAnalyst, setSelectedAnalyst] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedDesignation, setSelectedDesignation] = useState<string>('');
  const [selectedRecordForActions, setSelectedRecordForActions] = useState<PerformanceRecord | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState({
    team_member_id: '',
    month: new Date().getMonth() + 1 < 10 ? `0${new Date().getMonth() + 1}` : `${new Date().getMonth() + 1}`,
    year: new Date().getFullYear(),
  });

  const [kpiValues, setKpiValues] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    loadData();
  }, [selectedAnalyst, selectedYear, selectedMonth, selectedDesignation]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [records, analystsList, kpiTargets] = await Promise.all([
        performanceService.getPerformanceRecords(selectedAnalyst || undefined),
        analystService.getAllAnalysts(),
        performanceService.getKPITargets()
      ]);

      let filteredRecords = records;
      if (selectedYear) {
        filteredRecords = records.filter(record => record.year === selectedYear);
      }
      if (selectedMonth) {
        filteredRecords = filteredRecords.filter(record => record.month === selectedMonth);
      }
      if (selectedDesignation) {
        const designationAnalysts = analystsList.filter(a => a.designation === selectedDesignation);
        const designationAnalystIds = designationAnalysts.map(a => a.id);
        filteredRecords = filteredRecords.filter(record => designationAnalystIds.includes(record.team_member_id));
      }

      setPerformanceRecords(filteredRecords);
      setAnalysts(analystsList);
      setTargets(kpiTargets);
    } catch (error) {
      console.error('Error loading performance data:', error);
      toast.error('Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const getKPIsForAnalyst = (analystId: string) => {
    const analyst = analysts.find(a => a.id === analystId);
    if (!analyst) return [];
    
    return targets.filter(target => target.designation === analyst.designation);
  };

  const handleAnalystChange = (analystId: string) => {
    setFormData(prev => ({ ...prev, team_member_id: analystId }));
    
    // Initialize KPI values for the selected analyst
    const analystKPIs = getKPIsForAnalyst(analystId);
    const initialKpiValues: { [key: string]: number } = {};
    analystKPIs.forEach(target => {
      initialKpiValues[target.kpi_name] = 0;
    });
    setKpiValues(initialKpiValues);
  };

  const getFilteredAnalysts = () => {
    if (selectedDesignation) {
      return analysts.filter(analyst => analyst.designation === selectedDesignation);
    }
    return analysts;
  };

  const getUniqueDesignations = () => {
    const designations = [...new Set(analysts.map(analyst => analyst.designation).filter(Boolean))];
    return designations.sort();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Ensure we have all required data
      if (!formData.team_member_id || !formData.month || !formData.year) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Get the selected team member to verify designation
      const selectedTeamMember = analysts.find(a => a.id === formData.team_member_id);
      if (!selectedTeamMember) {
        toast.error('Selected team member not found');
        return;
      }

      console.log('Submitting performance record:', {
        formData,
        kpiValues,
        selectedTeamMember: selectedTeamMember.name
      });

      const recordData = {
        team_member_id: formData.team_member_id,
        month: formData.month,
        year: formData.year,
        ...kpiValues
      };
      
      console.log('Final record data to submit:', recordData);
      
      if (editingRecord) {
        // Update existing record - include the ID
        const updateData = {
          ...recordData,
          id: editingRecord.id
        };
        await performanceService.updatePerformanceRecord(editingRecord.id, updateData);
        toast.success('Performance record updated successfully');
      } else {
        // Create new record
        await performanceService.createOrUpdatePerformanceRecord(recordData);
        toast.success('Performance record created successfully');
      }
      
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving performance record:', error);
      toast.error(`Failed to save performance record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleEdit = (record: PerformanceRecord) => {
    setEditingRecord(record);
    setFormData({
      team_member_id: record.team_member_id,
      month: record.month.padStart(2, '0'),
      year: record.year,
    });
    
    // Load KPI values from the record
    const analyst = analysts.find(a => a.id === record.team_member_id);
    if (analyst) {
      const analystKPIs = targets.filter(target => target.designation === analyst.designation);
      const recordKpiValues: { [key: string]: number } = {};
      analystKPIs.forEach(target => {
        recordKpiValues[target.kpi_name] = (record as any)[target.kpi_name] || 0;
      });
      setKpiValues(recordKpiValues);
    }
    
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this performance record?')) {
      return;
    }

    try {
      await performanceService.deletePerformanceRecord(id);
      toast.success('Performance record deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting performance record:', error);
      toast.error('Failed to delete performance record');
    }
  };

  const resetForm = () => {
    setFormData({
      team_member_id: '',
      month: new Date().getMonth() + 1 < 10 ? `0${new Date().getMonth() + 1}` : `${new Date().getMonth() + 1}`,
      year: new Date().getFullYear(),
    });
    setKpiValues({});
    setEditingRecord(null);
    setShowModal(false);
  };

  const getTargetForKPI = (kpiName: string, role: string) => {
    const target = targets.find(t => t.kpi_name === kpiName && t.role === role);
    return target?.monthly_target || 0;
  };

  const calculateAchievementRate = (actual: number, target: number) => {
    return target > 0 ? Math.round((actual / target) * 100) : 0;
  };

  const handleShowActionItems = (record: PerformanceRecord) => {
    setSelectedRecordForActions(record);
  };

  const getActionItems = () => {
    if (!selectedRecordForActions) return [];
    
    const previousRecords = performanceRecords.filter(
      r => r.team_member_id === selectedRecordForActions.team_member_id && r.id !== selectedRecordForActions.id
    );
    
    return generateActionItems(selectedRecordForActions, previousRecords, targets);
  };

  const toggleRowExpansion = (recordId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(recordId)) {
      newExpandedRows.delete(recordId);
    } else {
      newExpandedRows.add(recordId);
    }
    setExpandedRows(newExpandedRows);
  };

  const formatKPIName = (kpiName: string) => {
    return kpiName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Performance Tracking</h2>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Performance Record
        </button>
      </div>

      {/* Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">
          Track monthly performance achievements for team members. Targets are automatically populated based on their designation, and performance categories are highlighted with action item recommendations.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
            <select
              value={selectedDesignation}
              onChange={(e) => {
                setSelectedDesignation(e.target.value);
                setSelectedAnalyst(''); // Reset selected analyst when designation changes
              }}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
            >
              <option value="">All Designations</option>
              {getUniqueDesignations().map((designation) => (
                <option key={designation} value={designation}>{designation}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Member</label>
            <select
              value={selectedAnalyst}
              onChange={(e) => setSelectedAnalyst(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[200px]"
            >
              <option value="">All Team Members</option>
              {getFilteredAnalysts().map((analyst) => (
                <option key={analyst.id} value={analyst.id}>{analyst.name} ({analyst.department})</option>
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
              <option value={2025}>2025</option>
              <option value={2026}>2026</option>
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

      {/* Performance Records Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Performance Records</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Member</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month/Year</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    KPI Performance
                    <button
                      onClick={() => {
                        if (expandedRows.size === performanceRecords.length) {
                          setExpandedRows(new Set());
                        } else {
                          setExpandedRows(new Set(performanceRecords.map(r => r.id)));
                        }
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 underline"
                    >
                      {expandedRows.size === performanceRecords.length ? 'Collapse All' : 'Expand All'}
                    </button>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Overall Performance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {performanceRecords.map((record) => {
                const analyst = analysts.find(a => a.id === record.analyst_id);
                const analystKPIs = analyst ? targets.filter(t => t.designation === analyst.designation) : [];
                
                return (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {record.team_members?.name || analysts.find(a => a.id === record.team_member_id)?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {record.team_members?.designation || analysts.find(a => a.id === record.team_member_id)?.designation || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {months[parseInt(record.month) - 1]?.label} {record.year}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="min-w-0">
                        <button
                          onClick={() => toggleRowExpansion(record.id)}
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 mb-2"
                        >
                          {expandedRows.has(record.id) ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              Hide Details
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              Show Details ({(() => {
                                const teamMember = analysts.find(a => a.id === record.team_member_id);
                                const memberKPIs = teamMember ? targets.filter(t => t.designation === teamMember.designation) : [];
                                return memberKPIs.length;
                              })()} KPIs)
                            </>
                          )}
                        </button>
                        
                        {expandedRows.has(record.id) && (
                          <div className="space-y-1">
                            {(() => {
                              const teamMember = analysts.find(a => a.id === record.team_member_id);
                              const memberKPIs = teamMember ? targets.filter(t => t.designation === teamMember.designation) : [];
                              return memberKPIs.map((target) => {
                                const actualValue = (record as any)[target.kpi_name] || 0;
                                const achievementRate = calculateAchievementRate(actualValue, target.monthly_target);
                                
                                return (
                                  <div key={target.kpi_name} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                    <span className="text-xs font-medium text-gray-700">
                                      {formatKPIName(target.kpi_name)}:
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-600">
                                        {actualValue}/{target.monthly_target}
                                      </span>
                                      <PerformanceIndicator 
                                        achievementPercentage={achievementRate}
                                        showLabel={false}
                                        size="sm"
                                      />
                                    </div>
                                  </div>
                                );
                              });
                            })()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(() => {
                        const teamMember = analysts.find(a => a.id === record.team_member_id);
                        const analystKPIs = teamMember ? targets.filter(t => t.designation === teamMember.designation) : [];
                        const achievements = analystKPIs.map(target => {
                          const actualValue = (record as any)[target.kpi_name] || 0;
                          return calculateAchievementRate(actualValue, target.monthly_target);
                        });
                        const avgAchievement = achievements.length > 0 
                          ? Math.round(achievements.reduce((sum, val) => sum + val, 0) / achievements.length)
                          : 0;
                        
                        return (
                          <PerformanceIndicator 
                            achievementPercentage={avgAchievement}
                            showLabel={true}
                            size="md"
                          />
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(record)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Edit Record"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleShowActionItems(record)}
                          className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                          title="View Action Items"
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {performanceRecords.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No performance records found</p>
            <p className="text-sm text-gray-400 mt-1">Add your first performance record to get started</p>
          </div>
        )}
      </div>

      {/* Action Items Panel */}
      {selectedRecordForActions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Performance Analysis & Action Items
              </h3>
              <button
                onClick={() => setSelectedRecordForActions(null)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <ActionItemsPanel
                actionItems={getActionItems()}
                analystName={selectedRecordForActions.team_members?.name}
                month={months[parseInt(selectedRecordForActions.month) - 1]?.label}
                year={selectedRecordForActions.year}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingRecord ? 'Edit Performance Record' : 'Add Performance Record'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team Member</label>
                    <select
                      required
                      value={formData.team_member_id}
                      onChange={(e) => handleAnalystChange(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select Team Member</option>
                      {getFilteredAnalysts().map((analyst) => (
                        <option key={analyst.id} value={analyst.id}>
                          {analyst.name} ({analyst.designation})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                    <select
                      required
                      value={formData.month}
                      onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {months.map((month) => (
                        <option key={month.value} value={month.value}>{month.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <select
                      required
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={2025}>2025</option>
                      <option value={2026}>2026</option>
                    </select>
                  </div>
                </div>

                {/* KPI Input Fields */}
                {formData.team_member_id && (
                  <div className="border-t pt-4">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">KPI Achievements</h4>
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Selected Team Member:</strong> {(() => {
                          const selectedAnalyst = analysts.find(a => a.id === formData.team_member_id);
                          return selectedAnalyst ? `${selectedAnalyst.name} (${selectedAnalyst.designation})` : 'Unknown';
                        })()}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getKPIsForAnalyst(formData.team_member_id).map((target) => (
                        <div key={target.kpi_name} className="bg-gray-50 p-4 rounded-lg">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {formatKPIName(target.kpi_name)}
                          </label>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs text-gray-500">Target:</span>
                            <span className="text-sm font-semibold text-blue-600">{target.monthly_target}</span>
                          </div>
                          <input
                            type="number"
                            min="0"
                            value={kpiValues[target.kpi_name] || 0}
                            onChange={(e) => setKpiValues({ 
                              ...kpiValues, 
                              [target.kpi_name]: parseInt(e.target.value) || 0 
                            })}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter achieved value"
                          />
                          {kpiValues[target.kpi_name] !== undefined && target.monthly_target > 0 && (
                            <div className="mt-2">
                              <PerformanceIndicator 
                                achievementPercentage={calculateAchievementRate(kpiValues[target.kpi_name], target.monthly_target)}
                                showLabel={true}
                                size="sm"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {!formData.team_member_id && (
                  <div className="text-center py-8 text-gray-500 border-t">
                    Please select a team member to see their KPIs and targets
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.team_member_id}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editingRecord ? 'Update Record' : 'Save Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceTracking;