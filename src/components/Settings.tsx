import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Users, 
  Briefcase, 
  Target, 
  Link, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Search,
  Filter,
  BookOpen,
  BarChart3,
  AlertTriangle,
  Shield
} from 'lucide-react';
import { performanceService } from '../services/performanceService';
import { analystService } from '../services/analytService';
import type { Analyst, Role, KPIDefinition, KPITarget } from '../lib/supabase';
import toast from 'react-hot-toast';

interface KPIMapping {
  id: string;
  kpi_id: string;
  role_id: string;
  kpi_name: string;
  role_name: string;
  kpi_display_name: string;
}

interface MemberMapping {
  id: string;
  member_id: string;
  role_id: string;
  member_name: string;
  role_name: string;
  member_email: string;
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('instructions');
  const [showDataCleanupModal, setShowDataCleanupModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Set Instructions as default tab
  useEffect(() => {
    setActiveTab('instructions');
  }, []);
  
  // Data states
  const [members, setMembers] = useState<Analyst[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [kpis, setKPIs] = useState<KPIDefinition[]>([]);
  const [kpiMappings, setKPIMappings] = useState<KPIMapping[]>([]);
  const [memberMappings, setMemberMappings] = useState<MemberMapping[]>([]);
  
  // Modal states
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showKPIModal, setShowKPIModal] = useState(false);
  const [showKPIMappingModal, setShowKPIMappingModal] = useState(false);
  
  // Edit states
  const [editingMember, setEditingMember] = useState<Analyst | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingKPI, setEditingKPI] = useState<KPIDefinition | null>(null);
  const [editingKPIMapping, setEditingKPIMapping] = useState<KPIMapping | null>(null);
  
  // Form states
  const [memberForm, setMemberForm] = useState({
    name: '',
    email: '',
    hire_date: new Date().toISOString().split('T')[0],
    department: '',
    status: 'active' as 'active' | 'inactive'
  });
  
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    is_active: true
  });
  
  const [kpiForm, setKPIForm] = useState({
    name: '',
    display_name: '',
    description: '',
    unit: 'count',
    is_active: true
  });
  
  const [kpiMappingForm, setKPIMappingForm] = useState({
    kpi_id: '',
    role_id: ''
  });
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [membersData, rolesData, kpisData, targetsData] = await Promise.all([
        analystService.getAllAnalysts(),
        performanceService.getRoles(),
        performanceService.getKPIDefinitions(),
        performanceService.getKPITargets()
      ]);
      
      setMembers(membersData);
      setRoles(rolesData);
      setKPIs(kpisData);
      
      // Create KPI mappings from targets
      const kpiMappings: KPIMapping[] = targetsData.map(target => {
        const kpi = kpisData.find(k => k.name === target.kpi_name);
        const role = rolesData.find(r => r.name === target.role);
        return {
          id: target.id,
          kpi_id: kpi?.id || '',
          role_id: role?.id || '',
          kpi_name: target.kpi_name,
          role_name: target.role,
          kpi_display_name: kpi?.display_name || target.kpi_name
        };
      });
      setKPIMappings(kpiMappings);
      
      // Create member mappings
      const memberMappings: MemberMapping[] = membersData.map(member => {
        const role = rolesData.find(r => r.name === member.department);
        return {
          id: member.id,
          member_id: member.id,
          role_id: role?.id || '',
          member_name: member.name,
          role_name: member.department,
          member_email: member.email
        };
      });
      setMemberMappings(memberMappings);
      
    } catch (error) {
      console.error('Error loading settings data:', error);
      toast.error('Failed to load settings data');
    } finally {
      setLoading(false);
    }
  };

  // Member CRUD operations
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMember) {
        await analystService.updateAnalyst(editingMember.id, memberForm);
        toast.success('Member updated successfully');
      } else {
        await analystService.createAnalyst(memberForm);
        toast.success('Member created successfully');
      }
      resetMemberForm();
      loadAllData();
    } catch (error) {
      console.error('Error saving member:', error);
      toast.error('Failed to save member');
    }
  };

  const handleEditMember = (member: Analyst) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name,
      email: member.email,
      hire_date: member.hire_date,
      department: member.department,
      status: member.status
    });
    setShowMemberModal(true);
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    
    try {
      await analystService.deleteAnalyst(id);
      toast.success('Member deleted successfully');
      loadAllData();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Failed to delete member');
    }
  };

  const resetMemberForm = () => {
    setMemberForm({
      name: '',
      email: '',
      hire_date: new Date().toISOString().split('T')[0],
      department: '',
      status: 'active'
    });
    setEditingMember(null);
    setShowMemberModal(false);
  };

  // Role CRUD operations
  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await performanceService.updateRole(editingRole.id, roleForm);
        toast.success('Designation updated successfully');
      } else {
        await performanceService.createRole(roleForm);
        toast.success('Designation created successfully');
      }
      resetRoleForm();
      loadAllData();
    } catch (error) {
      console.error('Error saving role:', error);
      toast.error('Failed to save designation');
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || '',
      is_active: role.is_active
    });
    setShowRoleModal(true);
  };

  const handleDeleteRole = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will affect all related mappings.`)) return;
    
    try {
      await performanceService.deleteRole(id);
      toast.success('Designation deleted successfully');
      loadAllData();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete designation');
    }
  };

  const resetRoleForm = () => {
    setRoleForm({
      name: '',
      description: '',
      is_active: true
    });
    setEditingRole(null);
    setShowRoleModal(false);
  };

  // KPI CRUD operations
  const handleSaveKPI = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingKPI) {
        await performanceService.updateKPIDefinition(editingKPI.id, kpiForm);
        toast.success('KPI updated successfully');
      } else {
        await performanceService.createKPIDefinition(kpiForm);
        toast.success('KPI created successfully');
      }
      resetKPIForm();
      loadAllData();
    } catch (error) {
      console.error('Error saving KPI:', error);
      toast.error('Failed to save KPI');
    }
  };

  const handleEditKPI = (kpi: KPIDefinition) => {
    setEditingKPI(kpi);
    setKPIForm({
      name: kpi.name,
      display_name: kpi.display_name,
      description: kpi.description || '',
      unit: kpi.unit,
      is_active: kpi.is_active
    });
    setShowKPIModal(true);
  };

  const handleDeleteKPI = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will affect all related mappings.`)) return;
    
    try {
      await performanceService.deleteKPIDefinition(id);
      toast.success('KPI deleted successfully');
      loadAllData();
    } catch (error) {
      console.error('Error deleting KPI:', error);
      toast.error('Failed to delete KPI');
    }
  };

  const resetKPIForm = () => {
    setKPIForm({
      name: '',
      display_name: '',
      description: '',
      unit: 'count',
      is_active: true
    });
    setEditingKPI(null);
    setShowKPIModal(false);
  };

  // KPI Mapping operations
  const handleEditKPIMapping = (mapping: KPIMapping) => {
    const kpi = kpis.find(k => k.name === mapping.kpi_name);
    const role = roles.find(r => r.name === mapping.role_name);
    
    setEditingKPIMapping(mapping);
    setKPIMappingForm({
      kpi_id: kpi?.id || '',
      role_id: role?.id || ''
    });
    setShowKPIMappingModal(true);
  };

  const handleSaveKPIMapping = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const kpi = kpis.find(k => k.id === kpiMappingForm.kpi_id);
      const role = roles.find(r => r.id === kpiMappingForm.role_id);
      
      if (!kpi || !role) {
        toast.error('Invalid KPI or Role selection');
        return;
      }

      if (editingKPIMapping) {
        // Update existing mapping by deleting old and creating new
        await performanceService.deleteKPITarget(editingKPIMapping.id);
        await performanceService.createOrUpdateKPITarget({
          kpi_name: kpi.name,
          role: role.name,
          monthly_target: 0,
          annual_target: 0
        });
        toast.success('KPI mapping updated successfully');
      } else {
        await performanceService.createOrUpdateKPITarget({
          kpi_name: kpi.name,
          role: role.name,
          monthly_target: 0,
          annual_target: 0
        });
        toast.success('KPI mapping created successfully');
      }
      
      setEditingKPIMapping(null);
      setKPIMappingForm({ kpi_id: '', role_id: '' });
      setShowKPIMappingModal(false);
      loadAllData();
    } catch (error) {
      console.error('Error saving KPI mapping:', error);
      toast.error('Failed to save KPI mapping');
    }
  };

  const handleDeleteKPIMapping = async (id: string, kpiName: string, roleName: string) => {
    if (!confirm(`Are you sure you want to remove ${kpiName} from ${roleName}?`)) return;
    
    try {
      await performanceService.deleteKPITarget(id);
      toast.success('KPI mapping removed successfully');
      loadAllData();
    } catch (error) {
      console.error('Error deleting KPI mapping:', error);
      toast.error('Failed to remove KPI mapping');
    }
  };

  const tabs = [
    { id: 'instructions', label: 'Instructions', icon: BookOpen },
    { id: 'team-members', label: 'Team Members', icon: Users },
    { id: 'designations', label: 'Designations', icon: Briefcase },
    { id: 'kpis', label: 'KPIs', icon: BarChart3 },
    { id: 'kpi-mappings', label: 'KPI Mappings', icon: Link }
  ];

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredKPIs = kpis.filter(kpi =>
    kpi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    kpi.display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (kpi.description && kpi.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredKPIMappings = kpiMappings.filter(mapping => {
    const matchesSearch = 
      mapping.kpi_display_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mapping.role_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRoleFilter = !roleFilter || mapping.role_name === roleFilter;
    return matchesSearch && matchesRoleFilter;
  });

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

      {/* Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">
          Manage team members, designations, KPIs, and their mappings. All data is stored in and fetched from Supabase.
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => {
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

        {/* Instructions Tab Content */}
        {activeTab === 'instructions' && (
          <div className="p-6">
            <div className="max-w-4xl mx-auto space-y-8">
              {/* Header */}
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <BookOpen className="w-8 h-8 text-blue-600" />
                  <h2 className="text-3xl font-bold text-gray-900">Setup Instructions</h2>
                </div>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Follow these steps in order to properly set up your KPI tracking system and avoid data conflicts.
                </p>
              </div>

              {/* Data Cleanup Section */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                  <h3 className="text-xl font-semibold text-red-800">Start Fresh (Optional)</h3>
                </div>
                <p className="text-red-700 mb-4">
                  If you want to delete all existing settings data and start fresh, use the cleanup option below. 
                  This will remove all team members, designations, KPIs, targets, and performance records while preserving your admin access.
                </p>
                <button
                  onClick={() => setShowDataCleanupModal(true)}
                  className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 font-semibold"
                >
                  <Trash2 className="w-5 h-5" />
                  Clean All Settings Data
                </button>
              </div>

              {/* Setup Steps */}
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900 text-center">5-Step Setup Process</h3>
                
                {/* Step 1: Designations */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                    <Briefcase className="w-6 h-6 text-blue-600" />
                    <h4 className="text-xl font-semibold text-blue-800">Create Designations First</h4>
                    <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">REQUIRED</span>
                  </div>
                  <p className="text-blue-700 mb-4">
                    Start by creating job roles/positions. These are referenced by team members and KPI targets.
                  </p>
                  <div className="bg-white p-4 rounded border border-blue-200">
                    <p className="font-semibold text-gray-800 mb-2">Examples:</p>
                    <div className="flex flex-wrap gap-2">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">SEO Analyst</span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">SEO Specialist</span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Content Writer</span>
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Link Building Specialist</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('designations')}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Go to Designations →
                  </button>
                </div>

                {/* Step 2: KPIs */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                    <BarChart3 className="w-6 h-6 text-green-600" />
                    <h4 className="text-xl font-semibold text-green-800">Create KPI Definitions Second</h4>
                    <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">REQUIRED</span>
                  </div>
                  <p className="text-green-700 mb-4">
                    Define the performance metrics you want to track. Internal names are auto-generated to prevent conflicts.
                  </p>
                  <div className="bg-white p-4 rounded border border-green-200">
                    <p className="font-semibold text-gray-800 mb-2">Examples:</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Display Name: "Monthly Outreaches"</span>
                        <span className="text-gray-500 text-sm">→ Internal: "monthly_outreaches"</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Display Name: "Live Links"</span>
                        <span className="text-gray-500 text-sm">→ Internal: "live_links"</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Display Name: "High DA Backlinks (90+)"</span>
                        <span className="text-gray-500 text-sm">→ Internal: "high_da_backlinks_90"</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('kpis')}
                    className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Go to KPIs →
                  </button>
                </div>

                {/* Step 3: KPI Mappings */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                    <Link className="w-6 h-6 text-purple-600" />
                    <h4 className="text-xl font-semibold text-purple-800">Create KPI Mappings Third</h4>
                    <span className="bg-purple-100 text-purple-800 text-xs font-semibold px-2 py-1 rounded-full">REQUIRED</span>
                  </div>
                  <p className="text-purple-700 mb-4">
                    Link KPIs to designations to define which metrics each role should track. Prevents duplicate combinations.
                  </p>
                  <div className="bg-white p-4 rounded border border-purple-200">
                    <p className="font-semibold text-gray-800 mb-2">Example Mapping:</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">SEO Analyst</span>
                        <span className="text-gray-500">→</span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Monthly Outreaches</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">SEO Analyst</span>
                        <span className="text-gray-500">→</span>
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Live Links</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('kpi-mappings')}
                    className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Go to KPI Mappings →
                  </button>
                </div>

                {/* Step 4: Targets */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-orange-600 text-white rounded-full flex items-center justify-center font-bold">4</div>
                    <Target className="w-6 h-6 text-orange-600" />
                    <h4 className="text-xl font-semibold text-orange-800">Set Targets Fourth</h4>
                    <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded-full">RECOMMENDED</span>
                  </div>
                  <p className="text-orange-700 mb-4">
                    Set monthly target values for each KPI-designation combination. Annual targets auto-calculate (monthly × 13).
                  </p>
                  <div className="bg-white p-4 rounded border border-orange-200">
                    <p className="font-semibold text-gray-800 mb-2">Example Targets:</p>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">SEO Analyst → Monthly Outreaches</span>
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">525/month → 6,825/year</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">SEO Analyst → Live Links</span>
                        <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">15/month → 195/year</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-orange-600 mt-2">
                    💡 Tip: Use the main Targets page for easier target management across all roles.
                  </p>
                </div>

                {/* Step 5: Team Members */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">5</div>
                    <Users className="w-6 h-6 text-indigo-600" />
                    <h4 className="text-xl font-semibold text-indigo-800">Create Team Members Last</h4>
                    <span className="bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-1 rounded-full">FINAL STEP</span>
                  </div>
                  <p className="text-indigo-700 mb-4">
                    Add team members and assign them to existing designations. Email addresses must be unique.
                  </p>
                  <div className="bg-white p-4 rounded border border-indigo-200">
                    <p className="font-semibold text-gray-800 mb-2">Required Information:</p>
                    <ul className="space-y-1 text-gray-700">
                      <li>• Full Name</li>
                      <li>• Email Address (unique)</li>
                      <li>• Hire Date</li>
                      <li>• Designation (must exist from Step 1)</li>
                      <li>• Status (Active/Inactive)</li>
                    </ul>
                  </div>
                  <button
                    onClick={() => setActiveTab('team-members')}
                    className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Go to Team Members →
                  </button>
                </div>
              </div>

              {/* Built-in Protections */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Shield className="w-6 h-6 text-gray-600" />
                  <h3 className="text-xl font-semibold text-gray-800">Built-in Error Prevention</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Duplicate Prevention:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Unique designation names</li>
                      <li>• Unique KPI internal names</li>
                      <li>• Unique email addresses</li>
                      <li>• Unique KPI-designation combinations</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Data Integrity:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Auto-generated internal names</li>
                      <li>• Foreign key constraints</li>
                      <li>• Required field validation</li>
                      <li>• Cascade delete protection</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Quick Start */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 text-center">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Ready to Get Started?</h3>
                <p className="text-gray-600 mb-6">
                  Follow the 5-step process above to set up your KPI tracking system properly.
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setActiveTab('designations')}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Start with Step 1: Designations
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        {activeTab !== 'instructions' && (
          <div className="p-6 border-b bg-gray-50">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={`Search ${tabs.find(t => t.id === activeTab)?.label.toLowerCase()}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {activeTab === 'kpi-mappings' && (
                <div className="flex gap-2">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Designations</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.name}>{role.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <button
                onClick={() => {
                  if (activeTab === 'team-members') setShowMemberModal(true);
                  else if (activeTab === 'designations') setShowRoleModal(true);
                  else if (activeTab === 'kpis') setShowKPIModal(true);
                  else if (activeTab === 'kpi-mappings') setShowKPIMappingModal(true);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                Add {tabs.find(t => t.id === activeTab)?.label.slice(0, -1)}
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {/* Team Members Tab */}
          {activeTab === 'team-members' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mapped KPIs</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hire Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{member.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{member.department}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {(() => {
                          const memberKPIs = kpiMappings.filter(mapping => mapping.role_name === member.department);
                          if (memberKPIs.length === 0) {
                            return <span className="text-gray-400 italic">No KPIs assigned</span>;
                          }
                          return (
                            <div className="flex flex-wrap gap-1">
                              {memberKPIs.map((mapping, index) => (
                                <span key={mapping.id}>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {mapping.kpi_display_name}
                                  </span>
                                  {index < memberKPIs.length - 1 && <span className="text-gray-400 mx-1">,</span>}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
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
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditMember(member)}
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id, member.name)}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredMembers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No team members found</p>
                </div>
              )}
            </div>
          )}

          {/* Designations Tab */}
          {activeTab === 'designations' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mapped KPIs</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRoles.map((role) => (
                    <tr key={role.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{role.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{role.description || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {(() => {
                          const roleMappings = kpiMappings.filter(mapping => mapping.role_name === role.name);
                          if (roleMappings.length === 0) {
                            return <span className="text-gray-400 italic">No KPIs mapped</span>;
                          }
                          return (
                            <div className="flex flex-wrap gap-1">
                              {roleMappings.map((mapping, index) => (
                                <span key={mapping.id}>
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {mapping.kpi_display_name}
                                  </span>
                                  {index < roleMappings.length - 1 && <span className="text-gray-400 mx-1">,</span>}
                                </span>
                              ))}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          role.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {role.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditRole(role)}
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRole(role.id, role.name)}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredRoles.length === 0 && (
                <div className="text-center py-12">
                  <Briefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No designations found</p>
                </div>
              )}
            </div>
          )}

          {/* KPIs Tab */}
          {activeTab === 'kpis' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Display Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Internal Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredKPIs.map((kpi) => (
                    <tr key={kpi.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{kpi.display_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{kpi.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{kpi.description || '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{kpi.unit}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          kpi.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {kpi.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditKPI(kpi)}
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteKPI(kpi.id, kpi.display_name)}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredKPIs.length === 0 && (
                <div className="text-center py-12">
                  <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No KPIs found</p>
                </div>
              )}
            </div>
          )}

          {/* KPI Mappings Tab */}
          {activeTab === 'kpi-mappings' && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KPI</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Internal Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredKPIMappings.map((mapping) => (
                    <tr key={mapping.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                          {mapping.role_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{mapping.kpi_display_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{mapping.kpi_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditKPIMapping(mapping)}
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteKPIMapping(mapping.id, mapping.kpi_display_name, mapping.role_name)}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredKPIMappings.length === 0 && (
                <div className="text-center py-12">
                  <Link className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No KPI mappings found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingMember ? 'Edit Team Member' : 'Add Team Member'}
            </h3>
            
            <form onSubmit={handleSaveMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={memberForm.name}
                  onChange={(e) => setMemberForm({ ...memberForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={memberForm.email}
                  onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <select
                  required
                  value={memberForm.department}
                  onChange={(e) => setMemberForm({ ...memberForm, department: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Designation</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                <input
                  type="date"
                  required
                  value={memberForm.hire_date}
                  onChange={(e) => setMemberForm({ ...memberForm, hire_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={memberForm.status}
                  onChange={(e) => setMemberForm({ ...memberForm, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={resetMemberForm}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingMember ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingRole ? 'Edit Designation' : 'Add Designation'}
            </h3>
            
            <form onSubmit={handleSaveRole} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., SEO Manager"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Brief description of the designation..."
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={roleForm.is_active}
                  onChange={(e) => setRoleForm({ ...roleForm, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={resetRoleForm}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingRole ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Modal */}
      {showKPIModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingKPI ? 'Edit KPI' : 'Add KPI'}
            </h3>
            
            <form onSubmit={handleSaveKPI} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={kpiForm.display_name}
                  onChange={(e) => {
                    const displayName = e.target.value;
                    const internalName = displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                    setKPIForm({
                      ...kpiForm, 
                      display_name: displayName,
                      name: internalName
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Social Media Posts"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Internal Name</label>
                <input
                  type="text"
                  required
                  value={kpiForm.name}
                  readOnly={!editingKPI}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 text-gray-600"
                  placeholder="Auto-generated from display name"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {editingKPI ? 'Can be edited for existing KPIs' : 'Auto-generated from display name'}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={kpiForm.description}
                  onChange={(e) => setKPIForm({ ...kpiForm, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Brief description of what this KPI measures..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <input
                  type="text"
                  value="count"
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  placeholder="All KPIs use numeric count"
                />
                <p className="text-xs text-gray-500 mt-1">All KPIs are measured as numeric counts</p>
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="kpi_is_active"
                  checked={kpiForm.is_active}
                  onChange={(e) => setKPIForm({ ...kpiForm, is_active: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="kpi_is_active" className="text-sm text-gray-700">Active</label>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={resetKPIForm}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingKPI ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KPI Mapping Modal */}
      {showKPIMappingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingKPIMapping ? 'Edit KPI Mapping' : 'Add KPI Mapping'}
            </h3>
            
            <form onSubmit={handleSaveKPIMapping} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <select
                  required
                  value={kpiMappingForm.role_id}
                  onChange={(e) => setKPIMappingForm({ ...kpiMappingForm, role_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Designation</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">KPI</label>
                <select
                  required
                  value={kpiMappingForm.kpi_id}
                  onChange={(e) => setKPIMappingForm({ ...kpiMappingForm, kpi_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select KPI</option>
                  {kpis.map((kpi) => (
                    <option key={kpi.id} value={kpi.id}>{kpi.display_name}</option>
                  ))}
                </select>
              </div>
              
              {!editingKPIMapping && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    This will create a KPI target mapping with default values (0). You can set actual targets in the Targets page.
                  </p>
                </div>
              )}
              
              {editingKPIMapping && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    Editing this mapping will update the KPI assignment for this designation.
                  </p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setEditingKPIMapping(null);
                    setKPIMappingForm({ kpi_id: '', role_id: '' });
                    setShowKPIMappingModal(false);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingKPIMapping ? 'Update Mapping' : 'Create Mapping'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Data Cleanup Modal */}
      {showDataCleanupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900">Clean All Settings Data</h3>
            </div>
            
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800 mb-2">
                  <strong>⚠️ This action will permanently delete:</strong>
                </p>
                <ul className="text-sm text-red-700 space-y-1 ml-4">
                  <li>• All performance records</li>
                  <li>• All KPI targets</li>
                  <li>• All team members</li>
                  <li>• All KPI definitions</li>
                  <li>• All designations</li>
                </ul>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>✅ This action will preserve:</strong>
                </p>
                <ul className="text-sm text-green-700 space-y-1 ml-4">
                  <li>• Admin user accounts</li>
                  <li>• Database schema</li>
                  <li>• Application functionality</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>📋 To execute this cleanup:</strong>
                </p>
                <ol className="text-sm text-blue-700 space-y-1 ml-4 list-decimal">
                  <li>Go to your Supabase project dashboard</li>
                  <li>Navigate to SQL Editor</li>
                  <li>Run the cleanup migration script</li>
                  <li>Return here to create fresh data</li>
                </ol>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-800 font-medium mb-2">SQL Migration Script:</p>
                <code className="text-xs text-gray-600 bg-white p-2 rounded border block">
                  supabase/migrations/20250826150000_clean_all_settings_data.sql
                </code>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setShowDataCleanupModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDataCleanupModal(false);
                  toast.info('Please run the SQL migration in your Supabase dashboard to clean the data.');
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;