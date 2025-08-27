import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Users, 
  Target, 
  Database, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Copy,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { performanceService } from '../services/performanceService';
import { analystService } from '../services/analytService';
import type { TeamMember, KPITarget, Designation, KPIDefinition, UserKPIMapping } from '../lib/supabase';
import toast from 'react-hot-toast';

interface CloneKPIOption {
  kpi_name: string;
  display_name: string;
  monthly_target: number;
  annual_target: number;
  source: 'existing' | 'new';
}

const Settings: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState('instructions');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [kpiDefinitions, setKPIDefinitions] = useState<KPIDefinition[]>([]);
  const [kpiTargets, setKPITargets] = useState<KPITarget[]>([]);
  const [userKPIMappings, setUserKPIMappings] = useState<UserKPIMapping[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showDesignationModal, setShowDesignationModal] = useState(false);
  const [showKPIModal, setShowKPIModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showTeamMemberModal, setShowTeamMemberModal] = useState(false);

  // Form states
  const [newDesignation, setNewDesignation] = useState({ name: '', description: '' });
  const [newKPI, setNewKPI] = useState({ name: '', display_name: '', description: '', unit: 'count' });
  const [newTeamMember, setNewTeamMember] = useState({
    name: '',
    email: '',
    hire_date: new Date().toISOString().split('T')[0],
    designation: '',
    status: 'active' as 'active' | 'inactive'
  });
  const [editingTeamMember, setEditingTeamMember] = useState<TeamMember | null>(null);

  // Clone modal states
  const [cloneSourceUser, setCloneSourceUser] = useState<TeamMember | null>(null);
  const [cloneTargetDesignation, setCloneTargetDesignation] = useState('');
  const [cloneTargetUser, setCloneTargetUser] = useState('');
  const [cloneKPIOptions, setCloneKPIOptions] = useState<CloneKPIOption[]>([]);
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);
  
  // Filter states
  const [selectedDesignationFilter, setSelectedDesignationFilter] = useState('');

  // Load all data on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [members, roles, kpis, targets, mappings] = await Promise.all([
        analystService.getAllAnalysts(),
        performanceService.getRoles(),
        performanceService.getKPIDefinitions(),
        performanceService.getKPITargets(),
        performanceService.getUserKPIMappings()
      ]);

      setTeamMembers(members);
      setDesignations(roles);
      setKPIDefinitions(kpis);
      setKPITargets(targets);
      setUserKPIMappings(mappings);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  // Designation management functions
  const handleCreateDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await performanceService.createRole(newDesignation);
      toast.success('Designation created successfully');
      setNewDesignation({ name: '', description: '' });
      setShowDesignationModal(false);
      loadAllData();
    } catch (error) {
      console.error('Error creating designation:', error);
      toast.error('Failed to create designation');
    }
  };

  const handleDeleteDesignation = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the designation "${name}"?`)) {
      return;
    }

    try {
      await performanceService.deleteRole(id);
      toast.success('Designation deleted successfully');
      loadAllData();
    } catch (error) {
      console.error('Error deleting designation:', error);
      toast.error('Failed to delete designation');
    }
  };

  // KPI management functions
  const handleCreateKPI = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const kpiData = {
        ...newKPI,
        name: newKPI.display_name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      };
      
      await performanceService.createKPIDefinition(kpiData);
      toast.success('KPI created successfully');
      setNewKPI({ name: '', display_name: '', description: '', unit: 'count' });
      setShowKPIModal(false);
      loadAllData();
    } catch (error) {
      console.error('Error creating KPI:', error);
      toast.error('Failed to create KPI');
    }
  };

  const handleDeleteKPI = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the KPI "${name}"?`)) {
      return;
    }

    try {
      await performanceService.deleteKPIDefinition(id);
      toast.success('KPI deleted successfully');
      loadAllData();
    } catch (error) {
      console.error('Error deleting KPI:', error);
      toast.error('Failed to delete KPI');
    }
  };

  // Team member management functions
  const handleCreateTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTeamMember) {
        await analystService.updateAnalyst(editingTeamMember.id, newTeamMember);
        toast.success('Team member updated successfully');
      } else {
        await analystService.createAnalyst(newTeamMember);
        toast.success('Team member created successfully');
      }
      
      resetTeamMemberForm();
      loadAllData();
    } catch (error) {
      console.error('Error saving team member:', error);
      toast.error('Failed to save team member');
    }
  };

  const handleEditTeamMember = (member: TeamMember) => {
    setEditingTeamMember(member);
    setNewTeamMember({
      name: member.name,
      email: member.email,
      hire_date: member.hire_date,
      designation: member.designation,
      status: member.status
    });
    setShowTeamMemberModal(true);
  };

  const handleDeleteTeamMember = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete team member "${name}"? This will also delete all their performance records.`)) {
      return;
    }

    try {
      await analystService.deleteAnalyst(id);
      toast.success('Team member deleted successfully');
      loadAllData();
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast.error('Failed to delete team member');
    }
  };

  const resetTeamMemberForm = () => {
    setNewTeamMember({
      name: '',
      email: '',
      hire_date: new Date().toISOString().split('T')[0],
      designation: '',
      status: 'active'
    });
    setEditingTeamMember(null);
    setShowTeamMemberModal(false);
  };
  // Clone functionality
  const handleOpenCloneModal = (sourceUser: TeamMember) => {
    console.log('Opening clone modal for source user:', sourceUser.name);
    setCloneSourceUser(sourceUser);
    setCloneTargetDesignation('');
    setCloneTargetUser('');
    setCloneKPIOptions([]);
    setSelectedKPIs([]);
    setShowCloneModal(true);
  };

  const handleTargetDesignationChange = (designation: string) => {
    console.log('Target designation changed to:', designation);
    setCloneTargetDesignation(designation);
    setCloneTargetUser('');
    setCloneKPIOptions([]);
    setSelectedKPIs([]);
  };

  const handleTargetUserChange = (userId: string) => {
    console.log('Target user changed to:', userId);
    setCloneTargetUser(userId);
    
    if (userId && cloneTargetDesignation && cloneSourceUser) {
      loadCloneKPIOptions(userId, cloneTargetDesignation);
    }
  };

  const loadCloneKPIOptions = (targetUserId: string, targetDesignation: string) => {
    console.log('Loading clone KPI options for:', { targetUserId, targetDesignation, sourceUser: cloneSourceUser?.name });
    
    if (!cloneSourceUser) {
      console.log('No source user selected');
      return;
    }

    // Get source user's existing KPIs (both user-specific and designation-based)
    const sourceUserMappings = userKPIMappings.filter(m => m.team_member_id === cloneSourceUser.id);
    const sourceDesignationTargets = kpiTargets.filter(t => 
      t.designation === cloneSourceUser.designation || t.role === cloneSourceUser.designation
    );

    console.log('Source user mappings:', sourceUserMappings.length);
    console.log('Source designation targets:', sourceDesignationTargets.length);

    // Get target user's existing KPIs
    const targetUserMappings = userKPIMappings.filter(m => m.team_member_id === targetUserId);
    const targetDesignationTargets = kpiTargets.filter(t => 
      t.designation === targetDesignation || t.role === targetDesignation
    );

    console.log('Target user mappings:', targetUserMappings.length);
    console.log('Target designation targets:', targetDesignationTargets.length);

    // Create a set of target user's existing USER-SPECIFIC KPIs only
    // We don't include designation-based KPIs because we want to allow creating user-specific overrides
    const targetExistingUserKPIs = new Set(targetUserMappings.map(m => m.kpi_name));

    console.log('Target existing user-specific KPIs:', Array.from(targetExistingUserKPIs));

    // Build clone options
    const options: CloneKPIOption[] = [];

    // Add source user's user-specific mappings that target doesn't have as user-specific
    sourceUserMappings.forEach(mapping => {
      if (!targetExistingUserKPIs.has(mapping.kpi_name)) {
        const kpiDef = kpiDefinitions.find(k => k.name === mapping.kpi_name);
        options.push({
          kpi_name: mapping.kpi_name,
          display_name: kpiDef?.display_name || mapping.kpi_name,
          monthly_target: mapping.monthly_target,
          annual_target: mapping.annual_target,
          source: 'existing'
        });
      }
    });

    // Add source designation targets that target doesn't have as user-specific overrides
    sourceDesignationTargets.forEach(target => {
      if (!targetExistingUserKPIs.has(target.kpi_name)) {
        // Check if we already added this from user mappings
        const alreadyAdded = options.some(opt => opt.kpi_name === target.kpi_name);
        if (!alreadyAdded) {
          const kpiDef = kpiDefinitions.find(k => k.name === target.kpi_name);
          options.push({
            kpi_name: target.kpi_name,
            display_name: kpiDef?.display_name || target.kpi_name,
            monthly_target: target.monthly_target,
            annual_target: target.annual_target,
            source: 'existing'
          });
        }
      }
    });

    // Add all KPIs from target designation that target doesn't have as user-specific
    const allTargetDesignationKPIs = kpiTargets.filter(t => 
      t.designation === targetDesignation || t.role === targetDesignation
    );

    allTargetDesignationKPIs.forEach(target => {
      if (!targetExistingUserKPIs.has(target.kpi_name)) {
        // Check if we already added this
        const alreadyAdded = options.some(opt => opt.kpi_name === target.kpi_name);
        if (!alreadyAdded) {
          const kpiDef = kpiDefinitions.find(k => k.name === target.kpi_name);
          options.push({
            kpi_name: target.kpi_name,
            display_name: kpiDef?.display_name || target.kpi_name,
            monthly_target: target.monthly_target,
            annual_target: target.annual_target,
            source: 'new'
          });
        }
      }
    });

    console.log('Final clone options:', options.length, options);
    setCloneKPIOptions(options);
  };

  const handleCloneKPIs = async () => {
    if (!cloneTargetUser || selectedKPIs.length === 0) {
      toast.error('Please select KPIs to clone');
      return;
    }

    try {
      const mappingsToCreate = selectedKPIs.map(kpiName => {
        const option = cloneKPIOptions.find(opt => opt.kpi_name === kpiName);
        if (!option) return null;

        return {
          team_member_id: cloneTargetUser,
          kpi_name: option.kpi_name,
          monthly_target: option.monthly_target,
          annual_target: option.annual_target,
          is_active: true
        };
      }).filter(Boolean);

      if (mappingsToCreate.length > 0) {
        await performanceService.bulkCreateUserKPIMappings(mappingsToCreate);
        toast.success(`Successfully cloned ${mappingsToCreate.length} KPIs`);
        setShowCloneModal(false);
        loadAllData();
      }
    } catch (error) {
      console.error('Error cloning KPIs:', error);
      toast.error('Failed to clone KPIs');
    }
  };

  // Get filtered team members for target selection
  const getTargetUsers = () => {
    if (!cloneTargetDesignation) return [];
    return teamMembers.filter(member => 
      member.designation === cloneTargetDesignation && 
      member.id !== cloneSourceUser?.id
    );
  };

  // Get user's KPI summary
  const getUserKPISummary = (userId: string) => {
    const userMappings = userKPIMappings.filter(m => m.team_member_id === userId);
    const user = teamMembers.find(m => m.id === userId);
    const designationTargets = user ? kpiTargets.filter(t => 
      t.designation === user.designation || t.role === user.designation
    ) : [];
    
    return {
      userSpecific: userMappings.length,
      designation: designationTargets.length,
      total: userMappings.length + designationTargets.length
    };
  };
  
  // Get filtered team members for KPI mappings
  const getFilteredTeamMembers = () => {
    if (!selectedDesignationFilter) {
      return teamMembers;
    }
    return teamMembers.filter(member => member.designation === selectedDesignationFilter);
  };
  
  // Get unique designations for filter
  const getUniqueDesignations = () => {
    const designations = [...new Set(teamMembers.map(member => member.designation).filter(Boolean))];
    return designations.sort();
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'instructions', label: 'Instructions', icon: Info },
              { id: 'designations', label: 'Designations', icon: Users },
              { id: 'kpis', label: 'KPI Definitions', icon: Target },
              { id: 'team-members', label: 'Team Members', icon: Users },
              { id: 'mappings', label: 'KPI Mappings', icon: Database }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Instructions Tab */}
          {activeTab === 'instructions' && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">Setup Instructions</h3>
                <div className="space-y-4 text-blue-700">
                  <div>
                    <h4 className="font-medium mb-2">1. Create Designations</h4>
                    <p className="text-sm">Define job roles like "SEO Analyst", "Content Writer", etc. These group team members by their responsibilities.</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">2. Define KPIs</h4>
                    <p className="text-sm">Create Key Performance Indicators that will be tracked, such as "Monthly Outreaches", "Live Links", etc.</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">3. Set Up KPI Mappings</h4>
                    <p className="text-sm">Assign specific KPIs to team members with custom targets, or use designation-based defaults.</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">4. Clone KPI Settings</h4>
                    <p className="text-sm">Quickly copy KPI configurations from one team member to another using the clone feature.</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-4">Quick Start</h3>
                <div className="space-y-2 text-green-700 text-sm">
                  <p>• Go to <strong>Members</strong> to add team members</p>
                  <p>• Use <strong>Targets</strong> to set designation-based KPI targets</p>
                  <p>• Use <strong>KPI Mappings</strong> here for user-specific customizations</p>
                  <p>• Track performance in <strong>Performance Tracking</strong></p>
                </div>
              </div>
            </div>
          )}

          {/* Designations Tab */}
          {activeTab === 'designations' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Manage Designations</h3>
                <button
                  onClick={() => setShowDesignationModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Designation
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {designations.map((designation) => (
                  <div key={designation.id} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{designation.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{designation.description}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          {teamMembers.filter(m => m.designation === designation.name).length} team members
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteDesignation(designation.id, designation.name)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KPIs Tab */}
          {activeTab === 'kpis' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Manage KPI Definitions</h3>
                <button
                  onClick={() => setShowKPIModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add KPI
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {kpiDefinitions.map((kpi) => (
                  <div key={kpi.id} className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{kpi.display_name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{kpi.description}</p>
                        <div className="mt-2 text-xs text-gray-500">
                          Internal name: {kpi.name} | Unit: {kpi.unit}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteKPI(kpi.id, kpi.display_name)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Members Tab */}
          {activeTab === 'team-members' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Manage Team Members</h3>
                <button
                  onClick={() => setShowTeamMemberModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Team Member
                </button>
              </div>

              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hire Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {teamMembers.map((member) => (
                        <tr key={member.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {member.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {member.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {member.designation}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(member.hire_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              member.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {member.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEditTeamMember(member)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit Team Member"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTeamMember(member.id, member.name)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete Team Member"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {teamMembers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">No team members found</p>
                    <p className="text-sm text-gray-400 mt-1">Add your first team member to get started</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {/* KPI Mappings Tab */}
          {activeTab === 'mappings' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">User-Specific KPI Mappings</h3>
                  <p className="text-sm text-gray-600">Override designation defaults with user-specific targets</p>
                </div>
                
                {/* Designation Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Filter by Designation:</label>
                  <select
                    value={selectedDesignationFilter}
                    onChange={(e) => setSelectedDesignationFilter(e.target.value)}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[180px]"
                  >
                    <option value="">All Designations</option>
                    {getUniqueDesignations().map((designation) => (
                      <option key={designation} value={designation}>{designation}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Summary Stats */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="font-medium text-blue-800">
                        Showing {getFilteredTeamMembers().length} of {teamMembers.length} team members
                      </span>
                      {selectedDesignationFilter && (
                        <span className="text-blue-600 ml-2">
                          ({selectedDesignationFilter})
                        </span>
                      )}
                    </div>
                  </div>
                  {selectedDesignationFilter && (
                    <button
                      onClick={() => setSelectedDesignationFilter('')}
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {getFilteredTeamMembers().map((member) => {
                  const summary = getUserKPISummary(member.id);
                  return (
                    <div key={member.id} className="bg-white p-4 rounded-lg border">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{member.name}</h4>
                          <p className="text-sm text-gray-600">{member.designation}</p>
                        </div>
                        <button
                          onClick={() => handleOpenCloneModal(member)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Clone KPIs from this user"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">User-Specific:</span>
                          <span className="font-medium text-blue-600">{summary.userSpecific}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">From Designation:</span>
                          <span className="font-medium text-green-600">{summary.designation}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-gray-600 font-medium">Total KPIs:</span>
                          <span className="font-semibold text-gray-900">{summary.total}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {getFilteredTeamMembers().length === 0 && selectedDesignationFilter && (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No team members found for "{selectedDesignationFilter}"</p>
                  <p className="text-sm text-gray-400 mt-1">Try selecting a different designation or clear the filter</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Designation Modal */}
      {showDesignationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Designation</h3>
            
            <form onSubmit={handleCreateDesignation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={newDesignation.name}
                  onChange={(e) => setNewDesignation({ ...newDesignation, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., SEO Manager"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newDesignation.description}
                  onChange={(e) => setNewDesignation({ ...newDesignation, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Brief description of the role..."
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowDesignationModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Designation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add KPI Modal */}
      {showKPIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New KPI</h3>
            
            <form onSubmit={handleCreateKPI} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={newKPI.display_name}
                  onChange={(e) => setNewKPI({ ...newKPI, display_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Monthly Outreaches"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newKPI.description}
                  onChange={(e) => setNewKPI({ ...newKPI, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="What does this KPI measure..."
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowKPIModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create KPI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Team Member Modal */}
      {showTeamMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingTeamMember ? 'Edit Team Member' : 'Add New Team Member'}
            </h3>
            
            <form onSubmit={handleCreateTeamMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={newTeamMember.name}
                  onChange={(e) => setNewTeamMember({ ...newTeamMember, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newTeamMember.email}
                  onChange={(e) => setNewTeamMember({ ...newTeamMember, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <select
                  required
                  value={newTeamMember.designation}
                  onChange={(e) => setNewTeamMember({ ...newTeamMember, designation: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Designation</option>
                  {designations.map((designation) => (
                    <option key={designation.id} value={designation.name}>
                      {designation.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                <input
                  type="date"
                  required
                  value={newTeamMember.hire_date}
                  onChange={(e) => setNewTeamMember({ ...newTeamMember, hire_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={newTeamMember.status}
                  onChange={(e) => setNewTeamMember({ ...newTeamMember, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={resetTeamMemberForm}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingTeamMember ? 'Update Member' : 'Create Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Clone KPIs Modal */}
      {showCloneModal && cloneSourceUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Clone KPI Mappings</h3>
                <button
                  onClick={() => setShowCloneModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Copy KPI settings from <strong>{cloneSourceUser.name}</strong> to another team member
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Step 1: Select Target Designation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Step 1: Select Target Designation
                </label>
                <select
                  value={cloneTargetDesignation}
                  onChange={(e) => handleTargetDesignationChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose designation...</option>
                  {designations.map((designation) => (
                    <option key={designation.id} value={designation.name}>
                      {designation.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2: Select Target User */}
              {cloneTargetDesignation && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Step 2: Select Target User
                  </label>
                  <select
                    value={cloneTargetUser}
                    onChange={(e) => handleTargetUserChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Choose user...</option>
                    {getTargetUsers().map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Step 3: Select KPIs to Clone */}
              {cloneKPIOptions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Step 3: Select KPIs to Clone ({cloneKPIOptions.length} available)
                  </label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                    {cloneKPIOptions.map((option) => (
                      <label key={option.kpi_name} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedKPIs.includes(option.kpi_name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedKPIs([...selectedKPIs, option.kpi_name]);
                            } else {
                              setSelectedKPIs(selectedKPIs.filter(k => k !== option.kpi_name));
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{option.display_name}</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              option.source === 'existing' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {option.source === 'existing' ? 'From Source' : 'New KPI'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-600">
                            Monthly: {option.monthly_target} | Annual: {option.annual_target}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* No KPIs Available Message */}
              {cloneTargetUser && cloneKPIOptions.length === 0 && (
                <div className="text-center py-8">
                  <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No additional KPIs available to clone</p>
                  <p className="text-sm text-gray-400 mt-1">
                    The target user already has all available KPIs for their designation
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  onClick={() => setShowCloneModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCloneKPIs}
                  disabled={selectedKPIs.length === 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Clone {selectedKPIs.length} KPIs
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;