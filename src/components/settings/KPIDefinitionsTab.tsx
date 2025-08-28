import React, { useState } from 'react';
import { Plus, Edit, Trash2, Target, Filter, X } from 'lucide-react';
import { performanceService } from '../../services/performanceService';
import type { KPIDefinition, KPIDesignationMapping } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface KPIDefinitionsTabProps {
  kpiDefinitions: KPIDefinition[];
  onKPIDefinitionsChange: () => void;
}

const KPIDefinitionsTab: React.FC<KPIDefinitionsTabProps> = ({ kpiDefinitions, onKPIDefinitionsChange }) => {
  const [kpiDesignationMappings, setKpiDesignationMappings] = useState<KPIDesignationMapping[]>([]);
  const [selectedDesignation, setSelectedDesignation] = useState<string>('');
  const [availableDesignations, setAvailableDesignations] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingKPI, setEditingKPI] = useState<KPIDefinition | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    unit: 'count'
  });

  // Load KPI designation mappings and available designations
  React.useEffect(() => {
    loadKPIDesignationMappings();
  }, []);

  const loadKPIDesignationMappings = async () => {
    try {
      const mappings = await performanceService.getKPIDesignationMappings();
      setKpiDesignationMappings(mappings);
      
      // Get unique designations from mappings
      const designations = [...new Set(mappings.map(m => m.designation_name))].sort();
      setAvailableDesignations(designations);
    } catch (error) {
      console.error('Error loading KPI designation mappings:', error);
    }
  };

  // Filter KPIs based on selected designation
  const getFilteredKPIs = () => {
    if (!selectedDesignation) {
      return kpiDefinitions;
    }
    
    // Get KPIs that are mapped to the selected designation
    const mappedKPINames = kpiDesignationMappings
      .filter(mapping => mapping.designation_name === selectedDesignation)
      .map(mapping => mapping.kpi_name);
    
    return kpiDefinitions.filter(kpi => mappedKPINames.includes(kpi.name));
  };

  const filteredKPIs = getFilteredKPIs();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingKPI) {
        await performanceService.updateKPIDefinition(editingKPI.id, formData);
        toast.success('KPI updated successfully');
      } else {
        await performanceService.createKPIDefinition({ ...formData, is_active: true });
        toast.success('KPI created successfully');
      }
      resetForm();
      onKPIDefinitionsChange();
    } catch (error) {
      console.error('Error saving KPI:', error);
      toast.error('Failed to save KPI');
    }
  };

  const handleEdit = (kpi: KPIDefinition) => {
    setEditingKPI(kpi);
    setFormData({
      name: kpi.name,
      display_name: kpi.display_name,
      description: kpi.description || '',
      unit: kpi.unit
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will remove the KPI from all performance records.`)) {
      return;
    }

    try {
      await performanceService.deleteKPIDefinition(id);
      toast.success('KPI deleted successfully');
      onKPIDefinitionsChange();
    } catch (error) {
      console.error('Error deleting KPI:', error);
      toast.error('Failed to delete KPI');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', display_name: '', description: '', unit: 'count' });
    setEditingKPI(null);
    setShowModal(false);
  };

  const handleDisplayNameChange = (displayName: string) => {
    const internalName = displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    setFormData({
      ...formData,
      display_name: displayName,
      name: internalName
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Manage KPI Definitions</h3>
          <p className="text-sm text-gray-600 mt-1">
            {selectedDesignation 
              ? `Showing KPIs for ${selectedDesignation} (${filteredKPIs.length} of ${kpiDefinitions.length})`
              : `Showing all KPIs (${kpiDefinitions.length})`
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add KPI
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500" />
            <label className="text-sm font-medium text-gray-700">Filter by Designation:</label>
          </div>
          
          <div className="flex items-center gap-2 flex-1">
            <select
              value={selectedDesignation}
              onChange={(e) => setSelectedDesignation(e.target.value)}
              className="flex-1 sm:max-w-xs px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <option value="">All Designations</option>
              {availableDesignations.map((designation) => (
                <option key={designation} value={designation}>{designation}</option>
              ))}
            </select>
            
            {selectedDesignation && (
              <button
                onClick={() => setSelectedDesignation('')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear filter"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            {filteredKPIs.length} KPI{filteredKPIs.length !== 1 ? 's' : ''} found
          </div>
        </div>
        
        {selectedDesignation && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Filtered by:</strong> {selectedDesignation} designation
              <span className="ml-2 text-blue-600">
                ({filteredKPIs.length} KPIs assigned to this designation)
              </span>
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredKPIs.map((kpi) => (
          <div key={kpi.id} className="bg-white border rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">{kpi.display_name}</h4>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(kpi)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(kpi.id, kpi.display_name)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-gray-500">Internal: {kpi.name}</p>
              <p className="text-sm text-gray-600">{kpi.description || 'No description provided'}</p>
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                Unit: {kpi.unit}
              </span>
              {/* Show which designations this KPI is mapped to */}
              <div className="mt-2">
                <div className="flex flex-wrap gap-1">
                  {kpiDesignationMappings
                    .filter(mapping => mapping.kpi_name === kpi.name)
                    .map(mapping => (
                      <span 
                        key={mapping.id}
                        className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                      >
                        {mapping.designation_name}
                      </span>
                    ))
                  }
                  {kpiDesignationMappings.filter(mapping => mapping.kpi_name === kpi.name).length === 0 && (
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                      No designations assigned
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredKPIs.length === 0 && selectedDesignation && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No KPIs found for {selectedDesignation}</h3>
          <p className="text-gray-500 mb-4">
            No KPIs are currently mapped to the {selectedDesignation} designation.
          </p>
          <div className="space-y-2">
            <button
              onClick={() => setSelectedDesignation('')}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors mr-2"
            >
              View All KPIs
            </button>
            <p className="text-sm text-gray-500">
              Go to <strong>KPI Mappings</strong> tab to assign KPIs to this designation
            </p>
          </div>
        </div>
      )}

      {kpiDefinitions.length === 0 && !selectedDesignation && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No KPIs found</h3>
          <p className="text-gray-500 mb-4">Create your first KPI to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add First KPI
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingKPI ? 'Edit KPI' : 'Add New KPI'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={formData.display_name}
                  onChange={(e) => handleDisplayNameChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Monthly Outreaches"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Internal Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  readOnly
                  className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  placeholder="Auto-generated from display name"
                />
                <p className="text-xs text-gray-500 mt-1">Auto-generated from display name</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Brief description of what this KPI measures..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="count">Count (Numeric)</option>
                  <option value="delivered">Delivered/Not Delivered</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {formData.unit === 'delivered' 
                    ? 'Boolean KPI: Track completion status (Delivered/Not Delivered)'
                    : 'Numeric KPI: Track quantities and counts'
                  }
                </p>
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
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingKPI ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPIDefinitionsTab;