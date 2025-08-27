import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Mail, Calendar } from 'lucide-react';
import { analystService } from '../services/analytService';
import { performanceService } from '../services/performanceService';
import type { Analyst, Role } from '../lib/supabase';
import toast from 'react-hot-toast';

const AnalystManagement: React.FC = () => {
  const [analysts, setAnalysts] = useState<Analyst[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnalyst, setEditingAnalyst] = useState<Analyst | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    hire_date: new Date().toISOString().split('T')[0],
    department: '',
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analystsData, rolesData] = await Promise.all([
        analystService.getAllAnalysts(),
        performanceService.getRoles()
      ]);
      setAnalysts(analystsData);
      setRoles(rolesData);
      
      // Set default department to first role if available
      if (rolesData.length > 0 && !formData.department) {
        setFormData(prev => ({ ...prev, department: rolesData[0].name }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAnalyst) {
        await analystService.updateAnalyst(editingAnalyst.id, formData);
        toast.success('Analyst updated successfully');
      } else {
        await analystService.createAnalyst(formData);
        toast.success('Analyst created successfully');
      }
      
      resetForm();
     loadData();
    } catch (error) {
      console.error('Error saving analyst:', error);
      toast.error('Failed to save analyst');
    }
  };

  const handleEdit = (analyst: Analyst) => {
    setEditingAnalyst(analyst);
    setFormData({
      name: analyst.name,
      email: analyst.email,
      hire_date: analyst.hire_date,
      department: analyst.department,
      status: analyst.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this analyst? This will also delete all their performance records.')) {
      return;
    }

    try {
      await analystService.deleteAnalyst(id);
      toast.success('Analyst deleted successfully');
     loadData();
    } catch (error) {
      console.error('Error deleting analyst:', error);
      toast.error('Failed to delete analyst');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      hire_date: new Date().toISOString().split('T')[0],
      department: roles.length > 0 ? roles[0].name : '',
      status: 'active'
    });
    setEditingAnalyst(null);
    setShowModal(false);
  };

  const filteredAnalysts = analysts.filter(analyst =>
    analyst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    analyst.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
       <h2 className="text-2xl font-bold text-gray-900">Member Management</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
        Add Member
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 border rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Analysts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAnalysts.map((analyst) => (
          <div key={analyst.id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{analyst.name}</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {analyst.email}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    Hired: {new Date(analyst.hire_date).toLocaleDateString()}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-sm text-gray-500">{analyst.department}</span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    analyst.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {analyst.status}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={() => handleEdit(analyst)}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(analyst.id)}
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredAnalysts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No members found</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingAnalyst ? 'Edit Member' : 'Add New Member'}
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
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hire Date</label>
                <input
                  type="date"
                  required
                  value={formData.hire_date}
                  onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                <select
                  required
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Designation</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.name}>{role.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
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
                  {editingAnalyst ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalystManagement;