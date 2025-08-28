import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { performanceService } from '../../services/performanceService';
import type { Designation } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface DesignationsTabProps {
  designations: Designation[];
  onDesignationsChange: () => void;
}

const DesignationsTab: React.FC<DesignationsTabProps> = ({ designations, onDesignationsChange }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<Designation | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDesignation) {
        await performanceService.updateRole(editingDesignation.id, formData);
        toast.success('Designation updated successfully');
      } else {
        await performanceService.createRole({ ...formData, is_active: true });
        toast.success('Designation created successfully');
      }
      resetForm();
      onDesignationsChange();
    } catch (error) {
      console.error('Error saving designation:', error);
      toast.error('Failed to save designation');
    }
  };

  const handleEdit = (designation: Designation) => {
    setEditingDesignation(designation);
    setFormData({
      name: designation.name,
      description: designation.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This will also remove all associated KPI targets.`)) {
      return;
    }

    try {
      await performanceService.deleteRole(id);
      toast.success('Designation deleted successfully');
      onDesignationsChange();
    } catch (error) {
      console.error('Error deleting designation:', error);
      toast.error('Failed to delete designation');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingDesignation(null);
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Manage Designations</h3>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Designation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {designations.map((designation) => (
          <div key={designation.id} className="bg-white border rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">{designation.name}</h4>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(designation)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(designation.id, designation.name)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">{designation.description || 'No description provided'}</p>
          </div>
        ))}
      </div>

      {designations.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No designations found</h3>
          <p className="text-gray-500 mb-4">Create your first designation to get started</p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add First Designation
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingDesignation ? 'Edit Designation' : 'Add New Designation'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., SEO Analyst"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Brief description of this designation..."
                />
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
                  {editingDesignation ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignationsTab;