import React, { useState, useEffect } from 'react';
import { Plus, Edit, Save, X, Trash2, Search, Filter, Target } from 'lucide-react';
import { performanceService } from '../services/performanceService';
import type { KPITarget, Role, KPIDefinition } from '../lib/supabase';
import toast from 'react-hot-toast';

interface UnifiedTargetRecord {
  id: string;
  role: string;
  kpi_name: string;
  kpi_display_name: string;
  monthly_target: number;
  annual_target: number;
  created_at: string;
}

const UnifiedTargets: React.FC = () => {
  const [targets, setTargets] = useState<KPITarget[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [kpiDefinitions, setKPIDefinitions] = useState<KPIDefinition[]>([]);
  const [unifiedRecords, setUnifiedRecords] = useState<UnifiedTargetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [kpiFilter, setKpiFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [editValues, setEditValues] = useState<{
    monthly_target: number;
    annual_target: number;
  }>({
    monthly_target: 0,
    annual_target: 0
  });

  const [newRecord, setNewRecord] = useState({
    role: '',
    kpi_name: '',
    monthly_target: 0,
    annual_target: 0
  });

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    createUnifiedRecords();
  }, [targets, roles, kpiDefinitions]);

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
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const createUnifiedRecords = () => {
    const records: UnifiedTargetRecord[] = targets.map(target => {
      const kpiDef = kpiDefinitions.find(kpi => kpi.name === target.kpi_name);
      const kpiName = target.kpi_name || 'unknown_kpi';
      return {
        id: target.id,
        role: target.designation || 'Unknown Role',
        kpi_name: target.kpi_name,
        kpi_display_name: kpiDef?.display_name || formatKPIName(kpiName),
        monthly_target: target.monthly_target,
        annual_target: target.annual_target,
        created_at: target.created_at
      };
    });
    
    setUnifiedRecords(records);
  };

  const formatKPIName = (name: string) => {
    return name.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleEdit = (record: UnifiedTargetRecord) => {
    setEditingId(record.id);
    setEditValues({
      monthly_target: record.monthly_target,
      annual_target: record.annual_target
    });
  };

  const handleSave = async (record: UnifiedTargetRecord) => {
    try {
      await performanceService.createOrUpdateKPITarget({
        kpi_name: record.kpi_name,
        role: record.role,
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

  const handleDelete = async (id: string, role: string, kpiName: string) => {
    if (!confirm(`Are you sure you want to delete the target for ${kpiName} in ${role}?`)) {
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

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if this combination already exists
    const existingRecord = targets.find(
      t => t.role === newRecord.role && t.kpi_name === newRecord.kpi_name
    );
    
    if (existingRecord) {
      toast.error(`Target for ${newRecord.kpi_name} in ${newRecord.role} already exists`);
      return;
    }

    try {
      await performanceService.createOrUpdateKPITarget(newRecord);
      toast.success('Target added successfully');
      setShowAddModal(false);
      setNewRecord({
        role: '',
        kpi_name: '',
        monthly_target: 0,
        annual_target: 0
      });
      loadAllData();
    } catch (error) {
      console.error('Error adding target:', error);
      toast.error('Failed to add target');
    }
  };

  const handleMonthlyTargetChange = (monthlyValue: number, isNewRecord: boolean = false) => {
    const annualValue = monthlyValue * 13; // 13 months for annual cycle
    
    if (isNewRecord) {
      setNewRecord({
        ...newRecord,
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

  const getAvailableKPIs = () => {
    if (!newRecord.role) return [];
    
    // Get KPIs that don't already have targets for the selected role
    const existingKPIsForRole = targets
      .filter(t => t.role === newRecord.role)
      .map(t => t.kpi_name);
    
    return kpiDefinitions.filter(kpi => !existingKPIsForRole.includes(kpi.name));
  };

  const filteredRecords = unifiedRecords.filter(record => {
    const matchesSearch = 
      (record.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.kpi_display_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.kpi_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRoleFilter = !roleFilter || record.role === roleFilter;
    const matchesKPIFilter = !kpiFilter || record.kpi_name === kpiFilter;
    
    return matchesSearch && matchesRoleFilter && matchesKPIFilter;
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Target className="w-8 h-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Targets Management</h2>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Target
        </button>
      </div>

      {/* Description */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800">
          Manage all KPI targets across different roles. Set monthly targets and annual targets will auto-calculate (13 months cycle).
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search roles or KPIs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Roles</option>
              {roles.map((role) => (
                <option key={role.id} value={role.name}>{role.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <select
              value={kpiFilter}
              onChange={(e) => setKpiFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All KPIs</option>
              {kpiDefinitions.map((kpi) => (
                <option key={kpi.id} value={kpi.name}>{kpi.display_name || formatKPIName(kpi.name)}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              {filteredRecords.length} of {unifiedRecords.length} records
            </span>
          </div>
        </div>
      </div>

      {/* Targets Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KPI</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Target</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Annual Target (13 months)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      {record.role}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{record.kpi_display_name}</div>
                      <div className="text-xs text-gray-500">{record.kpi_name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingId === record.id ? (
                      <input
                        type="number"
                        value={editValues.monthly_target}
                        onChange={(e) => handleMonthlyTargetChange(parseInt(e.target.value) || 0, false)}
                        className="w-24 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <span className="font-semibold text-blue-600">
                        {record.monthly_target.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingId === record.id ? (
                      <input
                        type="number"
                        value={editValues.annual_target}
                        onChange={(e) => setEditValues({
                          ...editValues,
                          annual_target: parseInt(e.target.value) || 0
                        })}
                        className="w-28 px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Auto-calculated"
                      />
                    ) : (
                      <span className="font-semibold text-green-600">
                        {record.annual_target.toLocaleString()}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {editingId === record.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSave(record)}
                          className="p-1 text-green-600 hover:text-green-800 transition-colors"
                          title="Save"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(record)}
                          className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id, record.role, record.kpi_display_name)}
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

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No targets found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || roleFilter || kpiFilter 
                ? 'No targets match your current filters.' 
                : 'No KPI targets have been set yet.'
              }
            </p>
            {!searchTerm && !roleFilter && !kpiFilter && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add First Target
              </button>
            )}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Targets</p>
              <p className="text-3xl font-bold text-gray-900">{unifiedRecords.length}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-full">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Roles</p>
              <p className="text-3xl font-bold text-gray-900">{roles.length}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-full">
              <div className="w-6 h-6 bg-green-600 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available KPIs</p>
              <p className="text-3xl font-bold text-gray-900">{kpiDefinitions.length}</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-full">
              <div className="w-6 h-6 bg-purple-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Target Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Target</h3>
            
            <form onSubmit={handleAddRecord} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Choose Role</label>
                <select
                  required
                  value={newRecord.role}
                  onChange={(e) => setNewRecord({ ...newRecord, role: e.target.value, kpi_name: '' })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">KPI Name</label>
                <select
                  required
                  value={newRecord.kpi_name}
                  onChange={(e) => setNewRecord({ ...newRecord, kpi_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!newRecord.role}
                >
                  <option value="">Choose KPI Name</option>
                  {getAvailableKPIs().map((kpi) => (
                    <option key={kpi.id} value={kpi.name}>
                      {kpi.display_name || formatKPIName(kpi.name)}
                    </option>
                  ))}
                </select>
                {!newRecord.role && (
                  <p className="text-sm text-gray-500 mt-1">Please choose a role first</p>
                )}
                {newRecord.role && getAvailableKPIs().length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">All KPIs already have targets for this role</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target (Month)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newRecord.monthly_target}
                  onChange={(e) => handleMonthlyTargetChange(parseInt(e.target.value) || 0, true)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter monthly target"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year Auto Calculates
                  <span className="text-xs text-gray-500 ml-1">- Automatically calculated (13 months)</span>
                </label>
                <input
                  type="number"
                  readOnly
                  min="0"
                  value={newRecord.annual_target}
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  placeholder="Auto-calculated from monthly target (Monthly × 13)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Annual target = Monthly target × 13 months
                </p>
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
                  disabled={!newRecord.role || !newRecord.kpi_name}
                >
                  Add Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UnifiedTargets;