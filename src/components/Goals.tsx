
import React, { useState, useEffect } from 'react';
import { Plus, Calendar, User, Target, Award, Edit, Trash2, X } from 'lucide-react';
import { analystService } from '../services/analytService';
import type { TeamMember } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Goal {
  id: string;
  name: string;
  start_date: string;
  deadline: string;
  created_at: string;
}

interface GoalAssignment {
  id: string;
  goal_id: string;
  team_member_id: string;
  assigned_date: string;
  status: 'assigned' | 'in_progress' | 'completed';
}

const Goals: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [assignments, setAssignments] = useState<GoalAssignment[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  
  const [createForm, setCreateForm] = useState({
    name: '',
    start_date: '',
    deadline: '',
    assignedMembers: [] as string[]
  });

  const [editForm, setEditForm] = useState({
    name: '',
    start_date: '',
    deadline: '',
    assignedMembers: [] as string[]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load team members from API
      const members = await analystService.getAllAnalysts();
      setTeamMembers(members);
      
      // Load goals and assignments from localStorage
      const storedGoals = localStorage.getItem('goals');
      const storedAssignments = localStorage.getItem('goal_assignments');
      
      if (storedGoals) {
        setGoals(JSON.parse(storedGoals));
      }
      
      if (storedAssignments) {
        setAssignments(JSON.parse(storedAssignments));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createForm.name.trim()) {
      toast.error('Goal name is required');
      return;
    }
    
    if (!createForm.deadline) {
      toast.error('Deadline is required');
      return;
    }

    if (!createForm.start_date) {
      toast.error('Start date is required');
      return;
    }

    const newGoal: Goal = {
      id: `goal-${Date.now()}`,
      name: createForm.name.trim(),
      start_date: createForm.start_date,
      deadline: createForm.deadline,
      created_at: new Date().toISOString()
    };

    const updatedGoals = [...goals, newGoal];
    setGoals(updatedGoals);
    localStorage.setItem('goals', JSON.stringify(updatedGoals));
    
    // Create assignments for selected team members
    if (createForm.assignedMembers.length > 0) {
      const newAssignments: GoalAssignment[] = createForm.assignedMembers.map(memberId => ({
        id: `assignment-${Date.now()}-${memberId}`,
        goal_id: newGoal.id,
        team_member_id: memberId,
        assigned_date: new Date().toISOString(),
        status: 'assigned'
      }));
      
      const updatedAssignments = [...assignments, ...newAssignments];
      setAssignments(updatedAssignments);
      localStorage.setItem('goal_assignments', JSON.stringify(updatedAssignments));
      
      toast.success(`Goal created and assigned to ${createForm.assignedMembers.length} team member${createForm.assignedMembers.length > 1 ? 's' : ''}`);
    } else {
      toast.success('Goal created successfully');
    }
    
    setCreateForm({ name: '', start_date: '', deadline: '', assignedMembers: [] });
    setShowCreateModal(false);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    const goalAssignments = assignments.filter(a => a.goal_id === goal.id);
    setEditForm({
      name: goal.name,
      start_date: goal.start_date,
      deadline: goal.deadline,
      assignedMembers: goalAssignments.map(a => a.team_member_id)
    });
    setShowEditModal(true);
  };

  const handleUpdateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editForm.name.trim()) {
      toast.error('Goal name is required');
      return;
    }
    
    if (!editForm.deadline) {
      toast.error('Deadline is required');
      return;
    }

    if (!editForm.start_date) {
      toast.error('Start date is required');
      return;
    }

    if (!editingGoal) return;

    // Update the goal
    const updatedGoals = goals.map(goal => 
      goal.id === editingGoal.id 
        ? { ...goal, name: editForm.name.trim(), start_date: editForm.start_date, deadline: editForm.deadline }
        : goal
    );
    setGoals(updatedGoals);
    localStorage.setItem('goals', JSON.stringify(updatedGoals));

    // Update assignments - remove old ones and add new ones
    const oldAssignments = assignments.filter(a => a.goal_id !== editingGoal.id);
    const newAssignments: GoalAssignment[] = editForm.assignedMembers.map(memberId => ({
      id: `assignment-${Date.now()}-${memberId}`,
      goal_id: editingGoal.id,
      team_member_id: memberId,
      assigned_date: new Date().toISOString(),
      status: 'assigned'
    }));
    
    const updatedAssignments = [...oldAssignments, ...newAssignments];
    setAssignments(updatedAssignments);
    localStorage.setItem('goal_assignments', JSON.stringify(updatedAssignments));
    
    toast.success('Goal updated successfully');
    setEditForm({ name: '', start_date: '', deadline: '', assignedMembers: [] });
    setEditingGoal(null);
    setShowEditModal(false);
  };

  const handleEditMemberToggle = (memberId: string) => {
    setEditForm(prev => ({
      ...prev,
      assignedMembers: prev.assignedMembers.includes(memberId)
        ? prev.assignedMembers.filter(id => id !== memberId)
        : [...prev.assignedMembers, memberId]
    }));
  };
  const handleDeleteGoal = (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal? This will also remove all assignments.')) {
      return;
    }

    // Remove goal and its assignments
    const updatedGoals = goals.filter(g => g.id !== goalId);
    const updatedAssignments = assignments.filter(a => a.goal_id !== goalId);
    
    setGoals(updatedGoals);
    setAssignments(updatedAssignments);
    
    localStorage.setItem('goals', JSON.stringify(updatedGoals));
    localStorage.setItem('goal_assignments', JSON.stringify(updatedAssignments));
    
    toast.success('Goal deleted successfully');
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) {
      return;
    }

    const updatedAssignments = assignments.filter(a => a.id !== assignmentId);
    setAssignments(updatedAssignments);
    localStorage.setItem('goal_assignments', JSON.stringify(updatedAssignments));
    
    toast.success('Assignment removed successfully');
  };

  const getGoalAssignments = (goalId: string) => {
    return assignments.filter(a => a.goal_id === goalId);
  };

  const getTeamMemberName = (teamMemberId: string) => {
    const member = teamMembers.find(m => m.id === teamMemberId);
    return member?.name || 'Unknown';
  };

  const handleMemberToggle = (memberId: string) => {
    setCreateForm(prev => ({
      ...prev,
      assignedMembers: prev.assignedMembers.includes(memberId)
        ? prev.assignedMembers.filter(id => id !== memberId)
        : [...prev.assignedMembers, memberId]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Award className="w-8 h-8 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">Goals Management</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Goal
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <p className="text-purple-800">
          Create organizational goals and assign them to team members. Data is stored locally in your browser.
        </p>
      </div>

      {/* Goals and Assignments Table */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Goals and Assignments ({goals.length} goals, {assignments.length} assignments)
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Goal Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {goals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No goals created</h3>
                    <p className="text-gray-500 mb-4">Create your first goal to get started</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Create First Goal
                    </button>
                  </td>
                </tr>
              ) : (
                goals.map((goal) => {
                  const goalAssignments = getGoalAssignments(goal.id);
                  const isOverdue = new Date(goal.deadline) < new Date();
                  
                  if (goalAssignments.length === 0) {
                    // Show goal without assignments
                    return (
                      <tr key={goal.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-gray-900">{goal.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span className="text-gray-900">
                              {new Date(goal.start_date).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}>
                              {new Date(goal.deadline).toLocaleDateString()}
                            </span>
                            {isOverdue && <span className="text-red-600 text-xs">(Overdue)</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-gray-500 italic">Not assigned</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            UNASSIGNED
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete Goal"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  }
                  
                  // Show goal with each assignment as separate rows
                  return goalAssignments.map((assignment, index) => {
                    const member = teamMembers.find(m => m.id === assignment.team_member_id);
                    
                    return (
                      <tr key={`${goal.id}-${assignment.id}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {index === 0 ? (
                            <div className="font-semibold text-gray-900">{goal.name}</div>
                          ) : (
                            <div className="text-gray-400 text-sm">↳ Same goal</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {index === 0 ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span className="text-gray-900">
                                {new Date(goal.start_date).toLocaleDateString()}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {index === 0 ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}>
                                {new Date(goal.deadline).toLocaleDateString()}
                              </span>
                              {isOverdue && <span className="text-red-600 text-xs">(Overdue)</span>}
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-blue-600" />
                            <div>
                              <div className="font-medium text-gray-900">{member?.name || 'Unknown Member'}</div>
                              <div className="text-sm text-gray-500">{member?.designation || 'Unknown'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                            assignment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {assignment.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex space-x-2">
                            {index === 0 && (
                              <button
                                onClick={() => handleDeleteGoal(goal.id)}
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete Goal"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                            {index === 0 && (
                              <button
                                onClick={() => handleEditGoal(goal)}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                title="Edit Goal"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteAssignment(assignment.id)}
                              className="p-1 text-gray-400 hover:text-orange-600 transition-colors"
                              title="Remove Assignment"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })
              )}
            </tbody>
          </table>
        </div>
        
        {goals.length === 0 && (
          <div className="p-6">
            <div className="text-center py-8">
              <Target className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No goals created</h3>
              <p className="text-gray-500 mb-4">Create your first goal to get started</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create First Goal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Goal Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Goal</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Complete Advanced SEO Certification"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={createForm.start_date}
                  onChange={(e) => setCreateForm({ ...createForm, start_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={createForm.deadline}
                  onChange={(e) => setCreateForm({ ...createForm, deadline: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to Team Members (Optional)
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                  {teamMembers.map((member) => (
                    <label key={member.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={createForm.assignedMembers.includes(member.id)}
                        onChange={() => handleMemberToggle(member.id)}
                        className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-700">{member.name}</span>
                        <span className="text-xs text-gray-500 ml-2">({member.designation})</span>
                      </div>
                    </label>
                  ))}
                </div>
                {createForm.assignedMembers.length > 0 && (
                  <p className="text-sm text-purple-600 mt-1">
                    {createForm.assignedMembers.length} team member{createForm.assignedMembers.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>

      {/* Edit Goal Modal */}
      {showEditModal && editingGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Edit Goal</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingGoal(null);
                  setEditForm({ name: '', start_date: '', deadline: '', assignedMembers: [] });
                }}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateGoal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Goal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Complete Advanced SEO Certification"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={editForm.start_date}
                  onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={editForm.deadline}
                  onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assign to Team Members (Optional)
                </label>
                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3 bg-gray-50">
                  {teamMembers.map((member) => (
                    <label key={member.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={editForm.assignedMembers.includes(member.id)}
                        onChange={() => handleEditMemberToggle(member.id)}
                        className="mr-3 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-700">{member.name}</span>
                        <span className="text-xs text-gray-500 ml-2">({member.designation})</span>
                      </div>
                    </label>
                  ))}
                </div>
                {editForm.assignedMembers.length > 0 && (
                  <p className="text-sm text-purple-600 mt-1">
                    {editForm.assignedMembers.length} team member{editForm.assignedMembers.length > 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingGoal(null);
                    setEditForm({ name: '', start_date: '', deadline: '', assignedMembers: [] });
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Update Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Goals;