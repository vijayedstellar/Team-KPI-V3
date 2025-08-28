import React, { useState, useEffect } from 'react';
import { Target, Edit, Save, X, Plus, Trash2, Settings, Users } from 'lucide-react';
import { performanceService } from '../services/performanceService';
import type { KPITarget, Role, KPIDefinition } from '../lib/supabase';
import toast from 'react-hot-toast';

const TargetManagement: React.FC = () => {
  const [targets, setTargets] = useState<KPITarget[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [kpiDefinitions, setKPIDefinitions] = useState<KPIDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('SEO Analyst');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showKPIModal, setShowKPIModal] = useState(false);
  const [editValues, setEditValues] = useState<{ monthly_target: number; annual_target: number }>({
    monthly_target: 0,
    annual_target: 0
  });
  const [newTarget, setNewTarget] = useState({
    kpi_name: '',
    monthly_target: 0,
    annual_target: 0,
    role: 'SEO Analyst'
  });
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    is_active: true
  });
  const [newKPI, setNewKPI] = useState({
    name: '',
    display_name: '',
    description: '',
    unit: 'count',
    is_active: true,
    assignedRoles: [] as string[]
  });

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [targetsData, rolesData, kpiData] = await Promise.all([
        performanceService.getKPITargets(),
        performanceService.getRoles(),
        performanceService.getKPIDefinitions()
      ]);
      
      setTargets(targetsData);
      setRoles(rolesData);
      setKPIDefinitions(kpiData);
      
      // Set first role as active tab if available
      if (rolesData.length > 0 && !rolesData.find(r => r.name === activeTab)) {
        setActiveTab(rolesData[0].name);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (target: KPITarget) => {
    setEditingId(target.id);
    setEditValues({
      monthly_target: target.monthly_target,
      annual_target: target.annual_target
    });
  };

  const handleSave = async (target: KPITarget) => {
    try {
      await performanceService.createOrUpdateKPITarget({
        kpi_name: target.kpi_name,
        role: target.role,
        monthly_target: editValues.monthly_target,
        annual_target: editValues.annual_target
      });
      toast.success('Target updated successfully');
      setEditingId(null);
      loadAllData();
    } catch (error) {
      console.error('Error updating target:', error);
      toast.error('Failed to update target');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditValues({ monthly_target: 0, annual_target: 0 });
  };

  const handleAddTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await performanceService.createOrUpdateKPITarget(newTarget);
      toast.success('Target added successfully');
      setShowAddModal(false);
      setNewTarget({
        kpi_name: '',
        monthly_target: 0,
        annual_target: 0,
        role: activeTab
      });
      loadAllData();
    } catch (error) {
      console.error('Error adding target:', error);
      toast.error('Failed to add target');
    }
  };

  const handleDeleteTarget = async (id: string) => {
    if (!confirm('Are you sure you want to delete this target?')) {
      return;
    }

    try {
      await performanceService.deleteKPITarget(id);
      toast.success('Target deleted successfully');
      loadAllData();
    } catch (error) {
      console.error('Error deleting target:', error);
      toast.error('Failed to delete target');
    }
  };

  // Auto-calculate annual target when monthly target changes
  const handleMonthlyTargetChange = (monthlyValue: number, isNewTarget: boolean = false) => {
    const annualValue = monthlyValue * 13; // 13 months for annual cycle
    
    if (isNewTarget) {
      setNewTarget({
        ...newTarget,
        monthly_target: monthlyValue,
        annual_target: annualValue
      });
    } else {
      setEditValues({
        ...editValues,
        monthly_target: monthlyValue,
        annual_target: annualValue
      });
    }
  };

  const handleAddRole = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if role with same name already exists
    const existingRole = roles.find(role => 
      role.name.toLowerCase().trim() === newRole.name.toLowerCase().trim()
    );
    
    if (existingRole) {
      toast.error(`Role "${newRole.name}" already exists. Please choose a different name.`);
      return;
    }
    
    try {
      await performanceService.createRole(newRole);
      toast.success('Role added successfully');
      setShowRoleModal(false);
      setNewRole({ name: '', description: '', is_active: true });
      loadAllData();
    } catch (error) {
      console.error('Error adding role:', error);
      
      // Check if it's a duplicate key constraint violation
      if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint "roles_name_key"')) {
        toast.error(`Role "${newRole.name}" already exists. Please choose a different name.`);
      } else {
        toast.error('Failed to add role');
      }
    }
  };

  const handleAddKPI = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least one role is selected
    if (!newKPI.assignedRoles || newKPI.assignedRoles.length === 0) {
      toast.error('Please select at least one role for this KPI');
      return;
    }
    
    // Check if KPI with same internal name already exists
    const existingKPI = kpiDefinitions.find(kpi => 
      kpi.name.toLowerCase().trim() === newKPI.name.toLowerCase().trim()
    );
    
    if (existingKPI) {
      toast.error(`KPI with name "${newKPI.name}" already exists. Please choose a different display name.`);
      return;
    }
    
    try {
      // Separate assignedRoles from KPI definition data
      const { assignedRoles, ...kpiData } = newKPI;
      
      // Create the KPI definition first
      await performanceService.createKPIDefinition(kpiData);
      
      // Create KPI targets for each assigned role with default values
      for (const roleName of assignedRoles) {
        await performanceService.createOrUpdateKPITarget({
          kpi_name: kpiData.name,
          role: roleName,
          monthly_target: 0,
          annual_target: 0
        });
      }
      
      toast.success('KPI added successfully');
      setShowKPIModal(false);
      setNewKPI({ 
        name: '', 
        display_name: '', 
        description: '', 
        unit: 'count', 
        is_active: true,
        assignedRoles: []
      });
      loadAllData();
    } catch (error) {
      console.error('Error adding KPI:', error);
      toast.error('Failed to add KPI');
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"? This will also remove all associated targets.`)) {
      return;
    }

    try {
      await performanceService.deleteRole(roleId);
      toast.success('Role deleted successfully');
      
      // If the deleted role was the active tab, switch to the first available role
      if (activeTab === roleName) {
        const remainingRoles = roles.filter(r => r.id !== roleId);
        if (remainingRoles.length > 0) {
          setActiveTab(remainingRoles[0].name);
        }
      }
      
      loadAllData();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role');
    }
  };

  const formatKPIName = (name: string) => {
    const kpiDef = kpiDefinitions.find(kpi => kpi.name === name);
    return kpiDef ? kpiDef.display_name : name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const getTargetsForRole = (role: string) => {
    // Return the actual KPITarget objects for this role
    return targets.filter(target => target.role === role);
  };

  // Get available KPI definitions that don't have targets for the selected role yet
  const getAvailableKPIsForRole = (roleName: string) => {
    if (!roleName) return [];
    
    console.log('getAvailableKPIsForRole called with role:', roleName);
    console.log('All targets:', targets.length, targets);
    console.log('All KPI definitions:', kpiDefinitions.length, kpiDefinitions);
    
    // Get existing targets for this role
    const roleTargets = targets.filter(target => target.role === roleName);
    console.log('Existing targets for role:', roleTargets);
    const existingKPINames = roleTargets.map(target => target.kpi_name);
    console.log('Existing KPI names for role:', existingKPINames);
    
    // Get all KPIs that have targets for ANY role (to understand the intended role mapping)
    const allTargetedKPIs = targets.map(target => ({ kpi: target.kpi_name, role: target.role }));
    console.log('All targeted KPIs with roles:', allTargetedKPIs);
    
    // For each KPI definition, check if it should be available for this role
    const availableKPIs = kpiDefinitions.filter(kpi => {
      // For editing existing targets, we want to show KPIs that already have targets for this role
      // For adding new targets, we want to show KPIs that don't have targets yet
      
      // Check if this KPI already has a target for the current role
      const existingTargetForRole = roleTargets.find(target => target.kpi_name === kpi.name);
      
      // If we're in "add mode", show KPIs that don't have targets for this role
      // If we're in "edit mode", we would show existing KPIs (but this is add mode)
      const shouldBeAvailable = !existingTargetForRole;
      
      console.log(`  - KPI "${kpi.name}" (${kpi.display_name}):`, {
        existingTargetForRole: existingTargetForRole ? 
          `exists (monthly: ${existingTargetForRole.monthly_target}, annual: ${existingTargetForRole.annual_target})` : 
          'none',
        shouldBeAvailable
      });
      
      // Only show KPI if:
      // 1. It doesn't have a target for the current role AND
      // 2. It doesn't have a target for any other role (meaning it's truly available)
      return shouldBeAvailable;
    });
    
    console.log('Available KPIs for role:', availableKPIs);
    console.log('KPI filtering check:');
    allTargetedKPIs.forEach(targeted => {
      console.log(`  - KPI "${targeted.kpi}" is assigned to role: ${targeted.role}`);
    });
    
    return availableKPIs;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentRoleTargets = getTargetsForRole(activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Target Management</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRoleModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Users className="w-4 h-4" />
            Add Role
          </button>
          <button
            onClick={() => setShowKPIModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Add KPI
          </button>
          <button
            onClick={() => {
              setNewTarget({ ...newTarget, role: activeTab });
              setShowAddModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Target
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">
          Manage KPI targets for different roles. These targets are used to calculate achievement rates and performance metrics across the dashboard.
        </p>
      </div>

      {/* Role Tabs */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b">
          <div className="flex items-center justify-between px-6">
            <nav className="flex space-x-8" aria-label="Tabs">
            {roles.map((role) => (
              <button
                key={role.id}
                onClick={() => setActiveTab(role.name)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === role.name
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {role.name}
                <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                  {getTargetsForRole(role.name).length}
                </span>
              </button>
            ))}
            </nav>
            
            {/* Role Management Dropdown */}
            {roles.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => {
                    const currentRole = roles.find(r => r.name === activeTab);
                    if (currentRole && confirm(`Are you sure you want to delete the role "${activeTab}"? This will also remove all associated targets.`)) {
                      handleDeleteRole(currentRole.id, currentRole.name);
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  title={`Delete ${activeTab} role`}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Role
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Targets Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KPI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Annual Target (13 months)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentRoleTargets.map((target) => (
                <tr key={target.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {formatKPIName(target.kpi_name)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingId === target.id ? (
                      <input
                        type="number"
                        value={editValues.monthly_target}
                        onChange={(e) => handleMonthlyTargetChange(parseInt(e.target.value) || 0, false)}
                        className="w-20 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      target.monthly_target.toLocaleString()
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingId === target.id ? (
                      <input
                        type="number"
                        value={editValues.annual_target}
                        onChange={(e) => setEditValues({
                          ...editValues,
                          annual_target: parseInt(e.target.value) || 0
                        })}
                        className="w-24 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Auto-calculated"
                      />
                    ) : (
                      target.annual_target.toLocaleString()
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingId === target.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSave(target)}
                          className="p-1 text-green-600 hover:text-green-800 transition-colors"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(target)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTarget(target.id)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors"
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

        {currentRoleTargets.length === 0 && (
          <div className="text-center py-12">
            <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No targets found</h3>
            <p className="text-gray-500 mb-4">
              No KPI targets have been set for {activeTab} yet.
            </p>
            <button
              onClick={() => {
                setNewTarget({ ...newTarget, role: activeTab });
                setShowAddModal(true);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add First Target
            </button>
          </div>
        )}
      </div>

      {/* Quarterly Milestones */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Quarterly Performance Milestones for {activeTab}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Q1 (Sep-Nov 2025)</h4>
            <p className="text-sm text-blue-700">Foundation Building</p>
            <ul className="mt-2 text-xs text-blue-600 space-y-1">
              <li>• Establish role-specific processes</li>
              <li>• Build initial workflows</li>
              <li>• Set baseline metrics</li>
            </ul>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Q2 (Dec 2025-Feb 2026)</h4>
            <p className="text-sm text-green-700">Process Optimization</p>
            <ul className="mt-2 text-xs text-green-600 space-y-1">
              <li>• Refine role-specific strategies</li>
              <li>• Improve efficiency metrics</li>
              <li>• Scale successful approaches</li>
            </ul>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="font-semibold text-purple-800 mb-2">Q3 (Mar-May 2026)</h4>
            <p className="text-sm text-purple-700">Scaling Success</p>
            <ul className="mt-2 text-xs text-purple-600 space-y-1">
              <li>• Automate routine tasks</li>
              <li>• Focus on high-impact activities</li>
              <li>• Cross-role collaboration</li>
            </ul>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h4 className="font-semibold text-orange-800 mb-2">Q4 (Jun-Aug 2026)</h4>
            <p className="text-sm text-orange-700">Excellence Achievement</p>
            <ul className="mt-2 text-xs text-orange-600 space-y-1">
              <li>• Maintain quality standards</li>
              <li>• Achieve premium results</li>
              <li>• Document best practices</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Add Target Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Add New Target
            </h3>
            
            <form onSubmit={handleAddTarget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  required
                  value={newTarget.role}
                  onChange={(e) => setNewTarget({ ...newTarget, role: e.target.value, kpi_name: '' })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">KPI Name</label>
                <select
                  required
                  value={newTarget.kpi_name}
                  onChange={(e) => setNewTarget({ ...newTarget, kpi_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!newTarget.role}
                >
                  <option value="">Select KPI</option>
                  {newTarget.role && getAvailableKPIsForRole(newTarget.role).map((kpi) => (
                    <option key={kpi.id} value={kpi.name}>{kpi.display_name || kpi.name}</option>
                  ))}
                </select>
                {!newTarget.role && (
                  <p className="text-sm text-gray-500 mt-1">
                    Please select a role first to see available KPIs.
                  </p>
                )}
                {newTarget.role && getAvailableKPIsForRole(newTarget.role).length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    All available KPIs already have targets for this role. Create new KPIs to add more targets.
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Target</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newTarget.monthly_target}
                  onChange={(e) => handleMonthlyTargetChange(parseInt(e.target.value) || 0, true)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annual Target (13 months) 
                  <span className="text-xs text-gray-500 ml-1">- Auto-calculated, editable</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={newTarget.annual_target}
                  onChange={(e) => setNewTarget({ ...newTarget, annual_target: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Auto-calculated, but you can edit"
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Role</h3>
            
            <form onSubmit={handleAddRole} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role Name</label>
                <input
                  type="text"
                  required
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., SEO Manager"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Brief description of the role..."
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Role
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
            
            <form onSubmit={handleAddKPI} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={newKPI.display_name}
                  onChange={(e) => {
                    const displayName = e.target.value;
                    const internalName = displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                    setNewKPI({
                      ...newKPI, 
                      display_name: displayName,
                      name: internalName
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Social Media Posts"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">KPI Name (Internal)</label>
                <input
                  type="text"
                  required
                  value={newKPI.name}
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Auto-generated from display name"
                  style={{ backgroundColor: '#f9fafb', color: '#6b7280' }}
                />
                <p className="text-xs text-gray-500 mt-1">Auto-generated from display name</p>
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
                  value="count"
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  placeholder="All KPIs use numeric count"
                />
                <p className="text-xs text-gray-500 mt-1">All KPIs are measured as numeric counts</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to Roles <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                  {roles.map((role) => (
                    <label key={role.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newKPI.assignedRoles?.includes(role.name) || false}
                        onChange={(e) => {
                          const currentRoles = newKPI.assignedRoles || [];
                          if (e.target.checked) {
                            setNewKPI({
                              ...newKPI,
                              assignedRoles: [...currentRoles, role.name]
                            });
                          } else {
                            setNewKPI({
                              ...newKPI,
                              assignedRoles: currentRoles.filter(r => r !== role.name)
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{role.name}</span>
                    </label>
                  ))}
                </div>
                {(!newKPI.assignedRoles || newKPI.assignedRoles.length === 0) && (
                  <p className="text-sm text-red-600 mt-1">Please select at least one role</p>
                )}
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
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Add KPI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TargetManagement;
