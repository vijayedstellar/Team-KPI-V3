import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Users, Target, Database, Plus, Trash2, Edit, Save, X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { performanceService } from '../services/performanceService';
import { analystService } from '../services/analytService';
import type { TeamMember, KPITarget, Designation, KPIDefinition } from '../lib/supabase';
import toast from 'react-hot-toast';

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('instructions');
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [kpiDefinitions, setKPIDefinitions] = useState<KPIDefinition[]>([]);
  const [kpiTargets, setKPITargets] = useState<KPITarget[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showAddDesignationModal, setShowAddDesignationModal] = useState(false);
  const [showAddKPIModal, setShowAddKPIModal] = useState(false);
  const [showAddMappingModal, setShowAddMappingModal] = useState(false);
  
  // Form states
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    designation: '',
    hire_date: new Date().toISOString().split('T')[0]
  });
  
  const [newDesignation, setNewDesignation] = useState({
    name: '',
    description: ''
  });
  
  const [newKPI, setNewKPI] = useState({
    name: '',
    display_name: '',
    description: '',
    unit: 'count'
  });
  
  const [newMapping, setNewMapping] = useState({
    designation: '',
    kpi_name: '',
    monthly_target: 0,
    annual_target: 0
  });

  // Search states
  const [memberSearch, setMemberSearch] = useState('');
  const [designationSearch, setDesignationSearch] = useState('');
  const [kpiSearch, setKpiSearch] = useState('');
  const [mappingSearch, setMappingSearch] = useState('');
  
  // Edit states for KPI mappings
  const [editingMappingId, setEditingMappingId] = useState<string | null>(null);
  const [editMappingValues, setEditMappingValues] = useState({
    monthly_target: 0,
    annual_target: 0
  });

  useEffect(() => {
    if (activeTab !== 'instructions') {
      loadData();
    }
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [members, roles, kpis, targets] = await Promise.all([
        analystService.getAllAnalysts(),
        performanceService.getRoles(),
        performanceService.getKPIDefinitions(),
        performanceService.getKPITargets()
      ]);
      
      setTeamMembers(members);
      setDesignations(roles);
      setKPIDefinitions(kpis);
      setKPITargets(targets);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  // Team Member Management
  const handleSaveTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await analystService.createAnalyst({
        ...newMember,
        status: 'active'
      });
      toast.success('Team member added successfully');
      setShowAddMemberModal(false);
      setNewMember({ name: '', email: '', designation: '', hire_date: new Date().toISOString().split('T')[0] });
      loadData();
    } catch (error) {
      console.error('Error saving team member:', error);
      toast.error('Failed to add team member');
    }
  };

  const handleDeleteTeamMember = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will also delete all their performance records.`)) {
      return;
    }

    try {
      await analystService.deleteAnalyst(id);
      toast.success('Team member deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast.error('Failed to delete team member');
    }
  };

  // Designation Management
  const handleSaveDesignation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await performanceService.createRole({
        ...newDesignation,
        is_active: true
      });
      toast.success('Designation added successfully');
      setShowAddDesignationModal(false);
      setNewDesignation({ name: '', description: '' });
      loadData();
    } catch (error) {
      console.error('Error saving designation:', error);
      toast.error('Failed to add designation');
    }
  };

  const handleDeleteDesignation = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the designation "${name}"? This will affect all associated team members and targets.`)) {
      return;
    }

    try {
      await performanceService.deleteRole(id);
      toast.success('Designation deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting designation:', error);
      toast.error('Failed to delete designation');
    }
  };

  // KPI Management
  const handleSaveKPI = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Generate internal name from display name
      const internalName = newKPI.display_name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      
      await performanceService.createKPIDefinition({
        ...newKPI,
        name: internalName
      });
      toast.success('KPI added successfully');
      setShowAddKPIModal(false);
      setNewKPI({ name: '', display_name: '', description: '', unit: 'count' });
      loadData();
    } catch (error) {
      console.error('Error saving KPI:', error);
      toast.error('Failed to add KPI');
    }
  };

  const handleDeleteKPI = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete the KPI "${name}"? This will remove it from all performance tracking.`)) {
      return;
    }

    try {
      await performanceService.deleteKPIDefinition(id);
      toast.success('KPI deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting KPI:', error);
      toast.error('Failed to delete KPI');
    }
  };

  // KPI Mapping Management
  const handleSaveKPIMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Use 'designation' instead of 'role' to match database schema
      await performanceService.createOrUpdateKPITarget({
        kpi_name: newMapping.kpi_name,
        designation: newMapping.designation, // This is the key fix
        monthly_target: newMapping.monthly_target,
        annual_target: newMapping.annual_target
      });
      toast.success('KPI mapping added successfully');
      setShowAddMappingModal(false);
      setNewMapping({ designation: '', kpi_name: '', monthly_target: 0, annual_target: 0 });
      loadData();
    } catch (error) {
      console.error('Error saving KPI mapping:', error);
      toast.error('Failed to add KPI mapping');
    }
  };

  const handleDeleteKPIMapping = async (id: string, designation: string, kpiName: string) => {
    if (!confirm(`Are you sure you want to delete the mapping for ${kpiName} in ${designation}?`)) {
      return;
    }

    try {
      await performanceService.deleteKPITarget(id);
      toast.success('KPI mapping deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting KPI mapping:', error);
      toast.error('Failed to delete KPI mapping');
    }
  };

  // Auto-calculate annual target when monthly target changes
  const handleMonthlyTargetChange = (monthlyValue: number) => {
    const annualValue = monthlyValue * 13; // 13 months for annual cycle
    setNewMapping({
      ...newMapping,
      monthly_target: monthlyValue,
      annual_target: annualValue
    });
  };
  
  // Auto-calculate annual target for editing
  const handleEditMonthlyTargetChange = (monthlyValue: number) => {
    const annualValue = monthlyValue * 13; // 13 months for annual cycle
    setEditMappingValues({
      ...editMappingValues,
      monthly_target: monthlyValue,
      annual_target: annualValue
    });
  };
  
  // Handle edit KPI mapping
  const handleEditKPIMapping = (mapping: KPITarget) => {
    setEditingMappingId(mapping.id);
    setEditMappingValues({
      monthly_target: mapping.monthly_target,
      annual_target: mapping.annual_target
    });
  };
  
  // Handle save edited KPI mapping
  const handleSaveEditedKPIMapping = async (mapping: KPITarget) => {
    try {
      await performanceService.createOrUpdateKPITarget({
        kpi_name: mapping.kpi_name,
        designation: mapping.designation,
        monthly_target: editMappingValues.monthly_target,
        annual_target: editMappingValues.annual_target
      });
      toast.success('KPI mapping updated successfully');
      setEditingMappingId(null);
      loadData();
    } catch (error) {
      console.error('Error updating KPI mapping:', error);
      toast.error('Failed to update KPI mapping');
    }
  };
  
  // Handle cancel edit
  const handleCancelEditKPIMapping = () => {
    setEditingMappingId(null);
    setEditMappingValues({ monthly_target: 0, annual_target: 0 });
  };

  // Filter functions
  const filteredMembers = teamMembers.filter(member =>
    member.name.toLowerCase().includes(memberSearch.toLowerCase()) ||
    member.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
    member.designation.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const filteredDesignations = designations.filter(designation =>
    designation.name.toLowerCase().includes(designationSearch.toLowerCase()) ||
    (designation.description || '').toLowerCase().includes(designationSearch.toLowerCase())
  );

  const filteredKPIs = kpiDefinitions.filter(kpi =>
    kpi.display_name.toLowerCase().includes(kpiSearch.toLowerCase()) ||
    kpi.name.toLowerCase().includes(kpiSearch.toLowerCase()) ||
    (kpi.description || '').toLowerCase().includes(kpiSearch.toLowerCase())
  );

  const filteredMappings = kpiTargets.filter(mapping => {
    const kpiDef = kpiDefinitions.find(kpi => kpi.name === mapping.kpi_name);
    const kpiDisplayName = kpiDef?.display_name || mapping.kpi_name;
    
    return (
      mapping.designation.toLowerCase().includes(mappingSearch.toLowerCase()) ||
      kpiDisplayName.toLowerCase().includes(mappingSearch.toLowerCase()) ||
      mapping.kpi_name.toLowerCase().includes(mappingSearch.toLowerCase())
    );
  });

  const getAvailableKPIsForMapping = () => {
    if (!newMapping.designation) return [];
    
    // Get KPIs that don't already have mappings for the selected designation
    const existingKPIs = kpiTargets
      .filter(target => target.designation === newMapping.designation)
      .map(target => target.kpi_name);
    
    return kpiDefinitions.filter(kpi => !existingKPIs.includes(kpi.name));
  };

  const formatKPIName = (kpiName: string) => {
    const kpiDef = kpiDefinitions.find(kpi => kpi.name === kpiName);
    return kpiDef?.display_name || kpiName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const renderInstructions = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Info className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">Welcome to Settings</h3>
            <p className="text-blue-800">
              Configure your Marketing KPI Tracker by setting up team members, designations, KPIs, and their target mappings. 
              Follow the steps below to get started.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold">1</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Set Up Designations</h4>
          </div>
          <p className="text-gray-600 mb-4">
            Create job roles like "SEO Analyst", "Content Writer", etc. These will be used to categorize team members and set role-specific targets.
          </p>
          <button
            onClick={() => setActiveTab('designations')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Go to Designations →
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold">2</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Define KPIs</h4>
          </div>
          <p className="text-gray-600 mb-4">
            Add Key Performance Indicators like "Monthly Outreaches", "Live Links", etc. These metrics will be tracked for performance evaluation.
          </p>
          <button
            onClick={() => setActiveTab('kpis')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Go to KPIs →
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold">3</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Add Team Members</h4>
          </div>
          <p className="text-gray-600 mb-4">
            Register your team members and assign them to designations. This enables individual performance tracking and reporting.
          </p>
          <button
            onClick={() => setActiveTab('members')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Go to Team Members →
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-600 font-bold">4</span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900">Set KPI Targets</h4>
          </div>
          <p className="text-gray-600 mb-4">
            Map KPIs to designations and set monthly/annual targets. This enables performance evaluation and achievement tracking.
          </p>
          <button
            onClick={() => setActiveTab('mappings')}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Go to KPI Mappings →
          </button>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-amber-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-amber-900 mb-2">Important Notes</h3>
            <ul className="text-amber-800 space-y-1">
              <li>• Complete setup in the order shown above for best results</li>
              <li>• Deleting designations or KPIs will affect existing data</li>
              <li>• Annual targets auto-calculate as Monthly × 13 months</li>
              <li>• Changes take effect immediately across the application</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTeamMembers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Team Members</h3>
        <button
          onClick={() => setShowAddMemberModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search team members..."
          value={memberSearch}
          onChange={(e) => setMemberSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hire Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.designation}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
                    <button
                      onClick={() => handleDeleteTeamMember(member.id, member.name)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMembers.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No team members found</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderDesignations = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Designations</h3>
        <button
          onClick={() => setShowAddDesignationModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Designation
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search designations..."
          value={designationSearch}
          onChange={(e) => setDesignationSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDesignations.map((designation) => (
          <div key={designation.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900">{designation.name}</h4>
                <p className="text-sm text-gray-600 mt-2">{designation.description}</p>
                <div className="mt-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    designation.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {designation.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDeleteDesignation(designation.id, designation.name)}
                className="text-red-600 hover:text-red-800 transition-colors ml-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredDesignations.length === 0 && (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No designations found</p>
        </div>
      )}
    </div>
  );

  const renderKPIs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">KPI Definitions</h3>
        <button
          onClick={() => setShowAddKPIModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add KPI
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search KPIs..."
          value={kpiSearch}
          onChange={(e) => setKpiSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredKPIs.map((kpi) => (
          <div key={kpi.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900">{kpi.display_name}</h4>
                <p className="text-sm text-gray-500 mt-1">Internal: {kpi.name}</p>
                <p className="text-sm text-gray-600 mt-2">{kpi.description}</p>
                <div className="mt-4 flex items-center gap-4">
                  <span className="text-xs text-gray-500">Unit: {kpi.unit}</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    kpi.is_active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {kpi.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDeleteKPI(kpi.id, kpi.display_name)}
                className="text-red-600 hover:text-red-800 transition-colors ml-2"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredKPIs.length === 0 && (
        <div className="text-center py-12">
          <Database className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No KPIs found</p>
        </div>
      )}
    </div>
  );

  const renderKPIMappings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">KPI Target Mappings</h3>
        <button
          onClick={() => setShowAddMappingModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Mapping
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search mappings..."
          value={mappingSearch}
          onChange={(e) => setMappingSearch(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">KPI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Annual Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMappings.map((mapping) => (
                <tr key={mapping.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {mapping.designation}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatKPIName(mapping.kpi_name)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingMappingId === mapping.id ? (
                      <input
                        type="number"
                        min="0"
                        value={editMappingValues.monthly_target}
                        onChange={(e) => handleEditMonthlyTargetChange(parseInt(e.target.value) || 0)}
                        className="w-24 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <span className="font-semibold text-blue-600">
                        {mapping.monthly_target.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingMappingId === mapping.id ? (
                      <input
                        type="number"
                        min="0"
                        value={editMappingValues.annual_target}
                        onChange={(e) => setEditMappingValues({
                          ...editMappingValues,
                          annual_target: parseInt(e.target.value) || 0
                        })}
                        className="w-28 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Auto-calculated"
                      />
                    ) : (
                      <span className="font-semibold text-green-600">
                        {mapping.annual_target.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingMappingId === mapping.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSaveEditedKPIMapping(mapping)}
                          className="p-1 text-green-600 hover:text-green-800 transition-colors"
                          title="Save"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancelEditKPIMapping}
                          className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditKPIMapping(mapping)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteKPIMapping(mapping.id, mapping.designation, formatKPIName(mapping.kpi_name))}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMappings.length === 0 && (
          <div className="text-center py-12">
            <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">No KPI mappings found</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <SettingsIcon className="w-8 h-8 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
      </div>

      {/* Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">
          Manage team members, designations, KPIs, and their mappings. Configure your system to track performance effectively.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'instructions', label: 'Instructions', icon: Info },
              { id: 'members', label: 'Team Members', icon: Users },
              { id: 'designations', label: 'Designations', icon: Target },
              { id: 'kpis', label: 'KPIs', icon: Database },
              { id: 'mappings', label: 'KPI Mappings', icon: Target }
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
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {activeTab === 'instructions' && renderInstructions()}
              {activeTab === 'members' && renderTeamMembers()}
              {activeTab === 'designations' && renderDesignations()}
              {activeTab === 'kpis' && renderKPIs()}
              {activeTab === 'mappings' && renderKPIMappings()}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      
      {/* Add Team Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Team Member</h3>
            
            <form onSubmit={handleSaveTeamMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <select
                  required
                  value={newMember.designation}
                  onChange={(e) => setNewMember({ ...newMember, designation: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Designation</option>
                  {designations.map((designation) => (
                    <option key={designation.id} value={designation.name}>{designation.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                <input
                  type="date"
                  required
                  value={newMember.hire_date}
                  onChange={(e) => setNewMember({ ...newMember, hire_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Designation Modal */}
      {showAddDesignationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Designation</h3>
            
            <form onSubmit={handleSaveDesignation} className="space-y-4">
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
                  onClick={() => setShowAddDesignationModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Designation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add KPI Modal */}
      {showAddKPIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add KPI</h3>
            
            <form onSubmit={handleSaveKPI} className="space-y-4">
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
                  placeholder="Brief description of what this KPI measures..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <input
                  type="text"
                  value={newKPI.unit}
                  onChange={(e) => setNewKPI({ ...newKPI, unit: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., emails, links, posts"
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddKPIModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add KPI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add KPI Mapping Modal */}
      {showAddMappingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add KPI Mapping</h3>
            
            <form onSubmit={handleSaveKPIMapping} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <select
                  required
                  value={newMapping.designation}
                  onChange={(e) => setNewMapping({ ...newMapping, designation: e.target.value, kpi_name: '' })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Designation</option>
                  {designations.map((designation) => (
                    <option key={designation.id} value={designation.name}>{designation.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">KPI</label>
                <select
                  required
                  value={newMapping.kpi_name}
                  onChange={(e) => setNewMapping({ ...newMapping, kpi_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!newMapping.designation}
                >
                  <option value="">Select KPI</option>
                  {getAvailableKPIsForMapping().map((kpi) => (
                    <option key={kpi.id} value={kpi.name}>{kpi.display_name}</option>
                  ))}
                </select>
                {!newMapping.designation && (
                  <p className="text-sm text-gray-500 mt-1">Please select a designation first</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Target</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newMapping.monthly_target}
                  onChange={(e) => handleMonthlyTargetChange(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Target 
                  <span className="text-xs text-gray-500 ml-1">- Auto-calculated (Monthly × 13)</span>
                </label>
                <input
                  type="number"
                  readOnly
                  value={newMapping.annual_target}
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  This will create a KPI target mapping with default values (0). 
                  You can set actual targets in the Targets page.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddMappingModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;