import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, User, Save, X, Upload, Download, FileText } from 'lucide-react';
import { performanceService } from '../../services/performanceService';
import { analystService } from '../../services/analytService';
import type { TeamMember, UserKPIMapping, KPIDefinition, KPIDesignationMapping } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface UserMappingsTabProps {
  kpiDefinitions: KPIDefinition[];
  onMappingsChange: () => void;
}

const UserMappingsTab: React.FC<UserMappingsTabProps> = ({ kpiDefinitions, onMappingsChange }) => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [userMappings, setUserMappings] = useState<UserKPIMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [editingMapping, setEditingMapping] = useState<UserKPIMapping | null>(null);
  const [formData, setFormData] = useState({
    kpi_name: '',
    monthly_target: 0,
    annual_target: 0
  });
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [kpiDesignationMappings, setKpiDesignationMappings] = useState<KPIDesignationMapping[]>([]);
  const [selectedDesignation, setSelectedDesignation] = useState<string>('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [importMode, setImportMode] = useState<'create' | 'update'>('create');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [members, mappings, designationMappings] = await Promise.all([
        analystService.getAllAnalysts(),
        performanceService.getUserKPIMappings(),
        performanceService.getKPIDesignationMappings()
      ]);
      setTeamMembers(members);
      setUserMappings(mappings);
      setKpiDesignationMappings(designationMappings);
      setKpiDesignationMappings(designationMappings);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.kpi_name) {
      toast.error('Please select a KPI');
      return;
    }
    
    if (editingMapping && !selectedMember) {
      toast.error('Please select a team member');
      return;
    }
    
    if (!editingMapping && selectedMembers.length === 0) {
      toast.error('Please select at least one team member');
      return;
    }

    try {
      // Handle delivered type KPIs - set targets to 1 and 13
      const selectedKPI = kpiDefinitions.find(kpi => kpi.name === formData.kpi_name);
      const isDeliveredType = selectedKPI?.unit === 'delivered';
      
      let finalFormData = { ...formData };
      if (isDeliveredType) {
        finalFormData.monthly_target = 1;
        finalFormData.annual_target = 13;
      }
      
      console.log('UserMappingsTab: Submitting form with data:', {
        editingMapping: !!editingMapping,
        selectedMember,
        selectedMembers,
        finalFormData,
        isDeliveredType
      });
      
      if (editingMapping) {
        // Single user update for editing
        const mappingData = {
          team_member_id: selectedMember,
          kpi_name: finalFormData.kpi_name,
          monthly_target: finalFormData.monthly_target,
          annual_target: finalFormData.annual_target,
          is_active: true
        };
        console.log('UserMappingsTab: Updating mapping with data:', mappingData);
        await performanceService.updateUserKPIMapping(editingMapping.id, mappingData);
        toast.success('User KPI mapping updated successfully');
      } else {
        // Multiple users creation for new mappings
        const mappingsToCreate = selectedMembers.map(memberId => ({
          team_member_id: memberId,
          kpi_name: finalFormData.kpi_name,
          monthly_target: finalFormData.monthly_target,
          annual_target: finalFormData.annual_target,
          is_active: true
        }));
        
        console.log('UserMappingsTab: Creating mappings:', mappingsToCreate);
        await performanceService.bulkCreateUserKPIMappings(mappingsToCreate);
        toast.success(`User KPI mappings created for ${selectedMembers.length} team members`);
      }
      
      resetForm();
      loadData();
      onMappingsChange();
    } catch (error) {
      console.error('Error saving mapping:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('duplicate key value')) {
          toast.error('A mapping for this KPI already exists for the selected team member(s)');
        } else if (error.message.includes('foreign key constraint')) {
          toast.error('Invalid team member or KPI selected');
        } else {
          toast.error(`Failed to save user KPI mapping: ${error.message}`);
        }
      } else {
        toast.error('Failed to save user KPI mapping: Unknown error');
      }
    }
  };

  const handleEdit = (mapping: UserKPIMapping) => {
    setEditingMapping(mapping);
    setSelectedMember(mapping.team_member_id);
    setSelectedMembers([mapping.team_member_id]);
    setFormData({
      kpi_name: mapping.kpi_name,
      monthly_target: mapping.monthly_target,
      annual_target: mapping.annual_target
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    console.log('UserMappingsTab: Attempting to delete mapping with ID:', id);
    
    if (!confirm('Are you sure you want to delete this user KPI mapping?')) {
      console.log('User cancelled deletion');
      return;
    }

    try {
      console.log('Calling performanceService.deleteUserKPIMapping with ID:', id);
      await performanceService.deleteUserKPIMapping(id);
      toast.success('User KPI mapping deleted successfully');
      console.log('Deletion successful, reloading data...');
      loadData();
      onMappingsChange();
    } catch (error) {
      console.error('Error deleting mapping:', error);
      toast.error(`Failed to delete user KPI mapping: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const resetForm = () => {
    setFormData({ kpi_name: '', monthly_target: 0, annual_target: 0 });
    setSelectedMember('');
    setSelectedMembers([]);
    setSelectedDesignation('');
    setEditingMapping(null);
    setShowModal(false);
  };

  const handleMonthlyTargetChange = (monthlyValue: number) => {
    const selectedKPI = kpiDefinitions.find(kpi => kpi.name === formData.kpi_name);
    const isDeliveredType = selectedKPI?.unit === 'delivered';
    
    let annualValue;
    if (isDeliveredType) {
      // For delivered type, always 1 monthly and 13 annual
      annualValue = 13;
      monthlyValue = 1;
    } else {
      annualValue = monthlyValue * 13; // 13 months for annual cycle
    }
    
    setFormData({
      ...formData,
      monthly_target: monthlyValue,
      annual_target: annualValue
    });
  };

  const formatKPIName = (kpiName: string) => {
    const kpiDef = kpiDefinitions.find(kpi => kpi.name === kpiName);
    return kpiDef ? kpiDef.display_name : kpiName;
  };

  const getAvailableKPIs = () => {
    // Always return all KPI definitions if no specific filtering is needed
    if (!selectedMember && selectedMembers.length === 0) return kpiDefinitions;
    
    // For editing, use single selected member
    if (editingMapping && selectedMember) {
      const selectedTeamMember = teamMembers.find(tm => tm.id === selectedMember);
      if (!selectedTeamMember) return [];
      
      // Get existing mappings for this user
      const existingKPIs = userMappings
        .filter(mapping => mapping.team_member_id === selectedMember)
        .map(mapping => mapping.kpi_name);
      
      // Return all KPIs that don't have mappings yet (or the one being edited)
      return kpiDefinitions.filter(kpi => 
        !existingKPIs.includes(kpi.name) || 
        (editingMapping && editingMapping.kpi_name === kpi.name)
      );
    }
    
    // For new mappings with multiple users, find common KPIs across all selected designations
    if (selectedMembers.length > 0) {
      // For simplicity, return all KPI definitions for new mappings
      // Users can create mappings for any KPI regardless of designation mappings
      return kpiDefinitions;
    }
    
    return kpiDefinitions;
  };

  const handleMemberToggle = (memberId: string) => {
    setSelectedMembers(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const getUniqueDesignations = () => {
    return [...new Set(teamMembers.map(tm => tm.designation))];
  };

  const getFilteredTeamMembers = () => {
    if (!selectedDesignation) return teamMembers;
    return teamMembers.filter(tm => tm.designation === selectedDesignation);
  };

  const downloadCSVTemplate = () => {
    const headers = [
      'team_member_name',
      'team_member_designation',
      'kpi_name',
      'kpi_display_name',
      'monthly_target',
      'annual_target'
    ];
    
    const sampleData = [
      ['Aniket', 'Social Media Specialist', 'linkedin_posts', 'Linkedin Posts', '45', '585'],
      ['John Doe', 'Content Writer', 'blog_posts', 'Blog Posts', '8', '104'],
      ['Jane Smith', 'SEO Specialist', 'keyword_rankings', 'Keyword Rankings', '50', '650']
    ];
    
    const csvContent = [headers, ...sampleData]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'user_kpi_mappings_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadAllData = async () => {
    try {
      // Get all data from the three main tables
      const [allTeamMembers, allDesignations, allKPIDefinitions] = await Promise.all([
        analystService.getAllAnalysts(),
        performanceService.getDesignations(),
        performanceService.getKPIDefinitions()
      ]);

      // Create comprehensive data export
      const allDataExport = {
        team_members: allTeamMembers.map(member => ({
          id: member.id,
          name: member.name,
          email: member.email,
          designation: member.designation,
          hire_date: member.hire_date,
          status: member.status
        })),
        designations: allDesignations.map(designation => ({
          id: designation.id,
          name: designation.name,
          description: designation.description,
          is_active: designation.is_active
        })),
        kpi_definitions: allKPIDefinitions.map(kpi => ({
          id: kpi.id,
          name: kpi.name,
          display_name: kpi.display_name,
          description: kpi.description,
          unit: kpi.unit,
          is_active: kpi.is_active
        }))
      };

      // Create CSV content with all available combinations
      const headers = [
        'team_member_name',
        'team_member_designation', 
        'team_member_email',
        'kpi_name',
        'kpi_display_name',
        'kpi_description',
        'kpi_unit',
        'monthly_target',
        'annual_target',
        'notes'
      ];

      const csvRows = [];
      
      // Add header
      csvRows.push(headers);
      
      // Add a row for each team member and KPI combination
      allTeamMembers.forEach(member => {
        allKPIDefinitions.forEach(kpi => {
          csvRows.push([
            member.name,
            member.designation,
            member.email,
            kpi.name,
            kpi.display_name,
            kpi.description || '',
            kpi.unit,
            '0', // Default monthly target - user should fill this
            '0', // Default annual target - user should fill this
            `Set targets for ${member.name} - ${kpi.display_name}`
          ]);
        });
      });

      const csvContent = csvRows.map(row => 
        row.map(cell => `"${cell}"`).join(',')
      ).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all_data_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Downloaded complete data export with ${allTeamMembers.length} team members and ${allKPIDefinitions.length} KPIs`);
    } catch (error) {
      console.error('Error downloading all data:', error);
      toast.error('Failed to download all data');
    }
  };
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setCsvFile(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('CSV file must contain at least a header row and one data row');
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim());
      const requiredHeaders = ['team_member_name', 'team_member_designation', 'kpi_name', 'monthly_target'];
      
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        toast.error(`Missing required columns: ${missingHeaders.join(', ')}`);
        return;
      }
      
      const data = lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        
        // Auto-calculate annual target if not provided
        if (!row.annual_target && row.monthly_target) {
          row.annual_target = parseInt(row.monthly_target) * 13;
        }
        
        return row;
      });
      
      setCsvData(data);
      toast.success(`Loaded ${data.length} records from CSV`);
    };
    
    reader.readAsText(file);
  };

  const handleBulkImport = async () => {
    if (csvData.length === 0) return;
    
    setImporting(true);
    
    try {
      const mappingsToCreate = [];
      const errors = [];
      
      for (const row of csvData) {
        // Find team member by name and designation
        const teamMember = teamMembers.find(tm => 
          tm.name.toLowerCase() === row.team_member_name.toLowerCase() &&
          tm.designation.toLowerCase() === row.team_member_designation.toLowerCase()
        );
        
        if (!teamMember) {
          errors.push(`Team member not found: ${row.team_member_name} (${row.team_member_designation})`);
          continue;
        }
        
        // Validate KPI exists
        const kpiExists = kpiDefinitions.find(kpi => kpi.name === row.kpi_name);
        if (!kpiExists) {
          errors.push(`KPI not found: ${row.kpi_name}`);
          continue;
        }
        
        mappingsToCreate.push({
          team_member_id: teamMember.id,
          kpi_name: row.kpi_name,
          monthly_target: parseInt(row.monthly_target) || 0,
          annual_target: parseInt(row.annual_target) || (parseInt(row.monthly_target) * 13),
          is_active: true
        });
      }
      
      if (errors.length > 0) {
        toast.error(`Found ${errors.length} errors. Check console for details.`);
        console.error('Import errors:', errors);
      }
      
      if (mappingsToCreate.length > 0) {
        if (importMode === 'update') {
          await performanceService.bulkUpsertUserKPIMappings(mappingsToCreate);
          toast.success(`Successfully updated ${mappingsToCreate.length} user KPI mappings`);
        } else {
          await performanceService.bulkCreateUserKPIMappings(mappingsToCreate);
          toast.success(`Successfully created ${mappingsToCreate.length} user KPI mappings`);
        }
        
        setShowImportModal(false);
        setCsvFile(null);
        setCsvData([]);
        setImportMode('create');
        loadData();
        onMappingsChange();
      }
      
    } catch (error) {
      console.error('Error importing CSV:', error);
      toast.error(`Failed to import CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">User-Specific KPI Mappings</h3>
          <p className="text-sm text-gray-600 mt-1">
            Override designation defaults with user-specific targets
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add User Mapping
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Team Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  KPI
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monthly Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Annual Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {userMappings.map((mapping) => {
                const member = teamMembers.find(tm => tm.id === mapping.team_member_id);
                return (
                  <tr key={mapping.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {member?.name || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {member?.designation || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatKPIName(mapping.kpi_name)}
                      </div>
                      <div className="text-sm text-gray-500">{mapping.kpi_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {mapping.monthly_target.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {mapping.annual_target.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(mapping)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(mapping.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
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

        {userMappings.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No user mappings found</h3>
            <p className="text-gray-500 mb-4">Create user-specific KPI targets to override designation defaults</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add First Mapping
            </button>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingMapping ? 'Edit User KPI Mapping' : 'Add User KPI Mapping'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 1. KPI Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">KPI</label>
                <select
                  required
                  value={formData.kpi_name}
                  onChange={(e) => setFormData({ ...formData, kpi_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!!editingMapping}
                >
                  <option value="">Select KPI...</option>
                  {getAvailableKPIs().map((kpi) => (
                    <option key={kpi.id} value={kpi.name}>
                      {kpi.display_name}
                    </option>
                  ))}
                </select>
                {getAvailableKPIs().length === 0 && (selectedMembers.length > 0 || selectedMember) && (
                  <p className="text-sm text-gray-500 mt-1">
                    All available KPIs already have user-specific targets for the selected member(s)
                  </p>
                )}
              </div>

              {/* 2. Designation Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <select
                  value={selectedDesignation}
                  onChange={(e) => {
                    setSelectedDesignation(e.target.value);
                    setSelectedMembers([]); // Reset selected members when designation changes
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!!editingMapping}
                >
                  <option value="">All Designations</option>
                  {getUniqueDesignations().map((designation) => (
                    <option key={designation} value={designation}>{designation}</option>
                  ))}
                </select>
              </div>

              {/* 3. Team Members Selection */}
              {editingMapping ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Team Member</label>
                  <select
                    required
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!!editingMapping}
                  >
                    <option value="">Select team member...</option>
                    {getFilteredTeamMembers().map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.designation})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Members <span className="text-red-500">*</span>
                  </label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                    {getFilteredTeamMembers().map((member) => (
                      <label key={member.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member.id)}
                          onChange={() => handleMemberToggle(member.id)}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-700">{member.name}</span>
                          <span className="text-xs text-gray-500 ml-2">({member.designation})</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  {getFilteredTeamMembers().length === 0 && selectedDesignation && (
                    <p className="text-sm text-gray-500 mt-1">No team members found for {selectedDesignation}</p>
                  )}
                  {selectedMembers.length === 0 && getFilteredTeamMembers().length > 0 && (
                    <p className="text-sm text-red-600 mt-1">Please select at least one team member</p>
                  )}
                  {selectedMembers.length > 0 && (
                    <p className="text-sm text-blue-600 mt-1">
                      {selectedMembers.length} team member{selectedMembers.length > 1 ? 's' : ''} selected
                    </p>
                  )}
                </div>
              )}
              
              {/* 4. Monthly Target */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Target</label>
                {(() => {
                  const selectedKPI = kpiDefinitions.find(kpi => kpi.name === formData.kpi_name);
                  const isDeliveredType = selectedKPI?.unit === 'delivered';
                  
                  if (isDeliveredType) {
                    return (
                      <>
                        <div className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-600">
                          1 (Delivered/Not Delivered)
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Delivered/Not Delivered KPIs always have a target of 1 (completion)
                        </p>
                      </>
                    );
                  }
                  
                  return (
                    <>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.monthly_target}
                  onChange={(e) => handleMonthlyTargetChange(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                    </>
                  );
                })()}
              </div>
              
              {/* 5. Annual Target */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Target (13 months)
                </label>
                {(() => {
                  const selectedKPI = kpiDefinitions.find(kpi => kpi.name === formData.kpi_name);
                  const isDeliveredType = selectedKPI?.unit === 'delivered';
                  
                  if (isDeliveredType) {
                    return (
                      <>
                        <div className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-600">
                          13 (13 months × 1 delivery)
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Annual target = 13 months × 1 delivery per month
                        </p>
                      </>
                    );
                  }
                  
                  return (
                    <>
                <input
                  type="number"
                  min="0"
                  value={formData.annual_target}
                  onChange={(e) => setFormData({ ...formData, annual_target: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Auto-calculated from monthly target"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Annual target = Monthly target × 13 months
                </p>
                    </>
                  );
                })()}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={editingMapping ? !selectedMember : selectedMembers.length === 0}
                >
                  {editingMapping ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Import User KPI Mappings from CSV</h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setCsvFile(null);
                  setCsvData([]);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* Import Mode Selection */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-3">Import Mode</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="importMode"
                      value="create"
                      checked={importMode === 'create'}
                      onChange={(e) => setImportMode(e.target.value as 'create' | 'update')}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div>
                      <span className="text-sm font-medium text-blue-800">Create New Records</span>
                      <p className="text-xs text-blue-600">Add new user KPI mappings (will fail if mapping already exists)</p>
                    </div>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="importMode"
                      value="update"
                      checked={importMode === 'update'}
                      onChange={(e) => setImportMode(e.target.value as 'create' | 'update')}
                      className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <div>
                      <span className="text-sm font-medium text-blue-800">Create or Update Records</span>
                      <p className="text-xs text-blue-600">Create new mappings or update existing ones (safe for partial updates)</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Instructions */}
              {/* Download Template Button */}
              <div className="text-center space-y-3">
                <button
                  onClick={downloadCSVTemplate}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <Download className="w-5 h-5" />
                  Download CSV Template
                </button>
                <p className="text-sm text-gray-500 mt-2">
                  Download a template with the correct format and sample data
                </p>
                
                <button
                  onClick={downloadAllData}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <FileText className="w-5 h-5" />
                  All Data Download
                </button>
                <p className="text-sm text-gray-500">
                  Download all team members, designations, and KPIs for comprehensive mapping
                </p>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Click to upload CSV file or drag and drop
                    </span>
                    <span className="text-xs text-gray-500">
                      CSV files only
                    </span>
                  </label>
                </div>
                
                {csvFile && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">{csvFile.name}</span>
                      <span className="text-xs text-gray-500">({csvData.length} records)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Data */}
              {csvData.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">Preview Data ({csvData.length} records)</h4>
                  <div className="max-h-60 overflow-y-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Member</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">KPI</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Monthly</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Annual</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {csvData.slice(0, 10).map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-sm text-gray-900">{row.team_member_name}</td>
                            <td className="px-3 py-2 text-sm text-gray-600">{row.team_member_designation}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{row.kpi_display_name || row.kpi_name}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{row.monthly_target}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{row.annual_target}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {csvData.length > 10 && (
                      <div className="p-3 text-center text-sm text-gray-500 bg-gray-50">
                        ... and {csvData.length - 10} more records
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Import Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowImportModal(false);
                    setCsvFile(null);
                    setCsvData([]);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkImport}
                  disabled={csvData.length === 0 || importing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {importMode === 'update' ? 'Updating...' : 'Importing...'}
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      {importMode === 'update' ? 'Update' : 'Import'} {csvData.length} Records
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMappingsTab;