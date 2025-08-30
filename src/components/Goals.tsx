import React, { useState, useEffect } from 'react';
import { Award, Plus, X, Edit, Trash2, Calendar, Users, FileText } from 'lucide-react';
import { analystService } from '../services/analytService';
import { goalService, type GoalWithAssignments, type UserGoal } from '../services/goalService';
import { toast } from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

interface TeamMember {
  id: string;
  name: string;
  designation: string;
  email: string;
}

const Goals: React.FC = () => {
  const [goals, setGoals] = useState<GoalWithAssignments[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [userGoals, setUserGoals] = useState<UserGoal[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalWithAssignments | null>(null);
  const { getUserName } = useAuth();
  const [createForm, setCreateForm] = useState({
    goal_name: '',
    description: '',
    deadline: '',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    assignedMembers: [] as string[]
  });
  const [editForm, setEditForm] = useState({
    goal_name: '',
    description: '',
    deadline: '',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
    assignedMembers: [] as string[]
  });
  const [recordForm, setRecordForm] = useState({
    goalId: '',
    teamMemberId: '',
    status: 'assigned' as 'assigned' | 'in_progress' | 'completed' | 'cancelled',
    notes: ''
  });
  const [editingRecord, setEditingRecord] = useState<{
    userGoalId: string;
    goalId: string;
    teamMemberId: string;
    status: string;
    notes: string;
  } | null>(null);

  useEffect(() => {
    loadGoals();
    loadTeamMembers();
    loadUserGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const goalsData = await goalService.getGoals();
      setGoals(goalsData);
    } catch (error) {
      console.error('Error loading goals:', error);
      toast.error('Failed to load goals');
    }
  };

  const loadTeamMembers = async () => {
    try {
      const members = await analystService.getAllAnalysts();
      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading team members:', error);
      toast.error('Failed to load team members');
    }
  };

  const loadUserGoals = async () => {
    try {
      const userGoalsData = await goalService.getUserGoals();
      setUserGoals(userGoalsData);
    } catch (error) {
      console.error('Error loading user goals:', error);
      // Don't show error toast for user goals as it's not critical
    }
  };

  const handleEditGoalRecord = (goalId: string, teamMemberId: string, currentStatus: string, currentNotes: string, userGoalId: string) => {
    setEditingRecord({
      userGoalId,
      goalId,
      teamMemberId,
      status: currentStatus,
      notes: currentNotes
    });
    setRecordForm({
      goalId,
      teamMemberId,
      status: currentStatus as any,
      notes: currentNotes
    });
    setShowRecordModal(true);
  };

  const handleUpdateGoalRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingRecord) {
        // Update existing record
        await goalService.updateUserGoalStatus(
          editingRecord.userGoalId,
          recordForm.status,
          recordForm.notes
        );
        toast.success('Goal record updated successfully!');
      } else {
        // This shouldn't happen in the new flow, but keeping for safety
        toast.error('No record selected for editing');
        return;
      }
      
      setRecordForm({
        goalId: '',
        teamMemberId: '',
        status: 'assigned',
        notes: ''
      });
      setEditingRecord(null);
      setShowRecordModal(false);
      loadGoals();
      loadUserGoals();
    } catch (error) {
      console.error('Error saving goal record:', error);
      toast.error('Failed to save goal record');
    }
  };

  // Auto-populate team members when goal is selected
  useEffect(() => {
    if (recordForm.goalId) {
      const selectedGoal = goals.find(goal => goal.id === recordForm.goalId);
      if (selectedGoal && selectedGoal.assigned_members && selectedGoal.assigned_members.length === 1) {
        // If only one member is assigned, auto-select them
        setRecordForm(prev => ({
          ...prev,
          teamMemberId: selectedGoal.assigned_members[0].id
        }));
      } else if (!selectedGoal?.assigned_members || selectedGoal.assigned_members.length === 0) {
        // If no members assigned, clear selection
        setRecordForm(prev => ({
          ...prev,
          teamMemberId: ''
        }));
      }
    }
  }, [recordForm.goalId, goals]);

  // Get available team members for the selected goal
  const getAvailableTeamMembers = () => {
    if (!recordForm.goalId) return [];
    
    const selectedGoal = goals.find(goal => goal.id === recordForm.goalId);
    return selectedGoal?.assigned_members || [];
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (new Date(createForm.deadline) <= new Date()) {
      toast.error('Deadline must be in the future');
      return;
    }

    try {
      await goalService.createGoal(createForm);
      
      // Reset form and close modal
      setCreateForm({ goal_name: '', description: '', deadline: '', assignedMembers: [] });
      setShowCreateModal(false);
      loadGoals();

      const assignmentText = createForm.assignedMembers.length > 0 
        ? ` and assigned to ${createForm.assignedMembers.length} team member${createForm.assignedMembers.length > 1 ? 's' : ''}`
        : '';
      toast.success(`Goal created successfully${assignmentText}!`);
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error('Failed to create goal');
    }
  };

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingGoal) return;
    
    if (new Date(editForm.deadline) <= new Date()) {
      toast.error('Deadline must be in the future');
      return;
    }

    try {
      await goalService.updateGoal(editingGoal.id, editForm);

      // Reset form and close modal
      setEditForm({ goal_name: '', description: '', deadline: '', assignedMembers: [] });
      setShowEditModal(false);
      setEditingGoal(null);
      loadGoals();

      toast.success('Goal updated successfully!');
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Failed to update goal');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (window.confirm('Are you sure you want to delete this goal?')) {
      try {
        await goalService.deleteGoal(goalId);
        loadGoals();
        toast.success('Goal deleted successfully!');
      } catch (error) {
        console.error('Error deleting goal:', error);
        toast.error('Failed to delete goal');
      }
    }
  };

  const handleEditGoal = (goal: GoalWithAssignments) => {
    setEditingGoal(goal);
    setEditForm({
      goal_name: goal.goal_name,
      description: goal.description || '',
      deadline: goal.deadline,
      priority: goal.priority || 'Medium',
      assignedMembers: goal.assigned_members?.map(member => member.id) || []
    });
    setShowEditModal(true);
  };

  const handleCreateGoalRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Find the user goal record to update
      const userGoal = await goalService.getUserGoalByGoalAndMember(recordForm.goalId, recordForm.teamMemberId);
      
      if (userGoal) {
        await goalService.updateUserGoalStatus(userGoal.id, recordForm.status, recordForm.notes);
        toast.success('Goal record updated successfully!');
      } else {
        toast.error('Goal assignment not found');
        return;
      }
      
      setRecordForm({
        goalId: '',
        teamMemberId: '',
        status: 'assigned',
        notes: ''
      });
      setShowRecordModal(false);
      loadGoals();
      loadUserGoals();
    } catch (error) {
      console.error('Error creating goal record:', error);
      toast.error('Failed to create goal record');
    }
  };

  const getGoalStatus = (goalId: string, teamMemberId: string) => {
    const goal = goals.find(g => g.id === goalId);
    const member = goal?.assigned_members?.find(m => m.id === teamMemberId);
    return member?.status || 'assigned';
  };

  const getGoalNotes = (goalId: string, teamMemberId: string) => {
    const goal = goals.find(g => g.id === goalId);
    const member = goal?.assigned_members?.find(m => m.id === teamMemberId);
    return member?.notes || '';
  };

  const getUserGoalId = (goalId: string, teamMemberId: string) => {
    const goal = goals.find(g => g.id === goalId);
    const member = goal?.assigned_members?.find(m => m.id === teamMemberId);
    return member?.user_goal_id || '';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const handleMemberToggle = (memberId: string) => {
    setCreateForm(prev => ({
      ...prev,
      assignedMembers: prev.assignedMembers.includes(memberId)
        ? prev.assignedMembers.filter(id => id !== memberId)
        : [...prev.assignedMembers, memberId]
    }));
  };

  const handleEditMemberToggle = (memberId: string) => {
    setEditForm(prev => ({
      ...prev,
      assignedMembers: prev.assignedMembers.includes(memberId)
        ? prev.assignedMembers.filter(id => id !== memberId)
        : [...prev.assignedMembers, memberId]
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDeadlineStatusColor = (deadline: string) => {
    const daysRemaining = getDaysRemaining(deadline);
    if (daysRemaining < 0) return 'text-red-600 bg-red-50';
    if (daysRemaining <= 7) return 'text-orange-600 bg-orange-50';
    if (daysRemaining <= 30) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getStatusText = (deadline: string) => {
    const daysRemaining = getDaysRemaining(deadline);
    if (daysRemaining < 0) return `${Math.abs(daysRemaining)} days overdue`;
    if (daysRemaining === 0) return 'Due today';
    if (daysRemaining === 1) return '1 day remaining';
    return `${daysRemaining} days remaining`;
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Award className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Goals Management</h1>
              <p className="text-gray-600">Set and track organizational goals</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Goal</span>
            </button>
            <button
              onClick={() => setShowRecordModal(true)}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span>Add Goal Record</span>
            </button>
          </div>
        </div>

        {/* Goals List */}
        {goals.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Goal</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Start Date</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Deadline</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Priority</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Complexity</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Assigned To</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Progress</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Comments</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {goals.map((goal, index) => (
                    <tr key={goal.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">{goal.goal_name}</div>
                        {goal.description && (
                          <div className="text-sm text-gray-500">{goal.description}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(goal.created_at)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(goal.deadline)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          goal.priority === 'High' ? 'bg-red-100 text-red-800' :
                          goal.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {goal.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {(() => {
                          const assignedDate = new Date(goal.created_at);
                          const deadline = new Date(goal.deadline);
                          const durationDays = Math.ceil((deadline.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24));
                          const complexity = durationDays <= 60 ? 'Simple' : durationDays <= 120 ? 'Medium' : 'Complex';
                          
                          return (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              complexity === 'Complex' ? 'bg-purple-100 text-purple-800' :
                              complexity === 'Medium' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {complexity} ({durationDays}d)
                            </span>
                          );
                        })()}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDeadlineStatusColor(goal.deadline)}`}>
                          {getStatusText(goal.deadline)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {goal.assigned_members && goal.assigned_members.length > 0 ? (
                          <div className="flex items-center space-x-1">
                            <Users className="w-4 h-4 text-gray-400" />
                            <div className="flex flex-col space-y-1">
                              {goal.assigned_members.slice(0, 2).map((member, idx) => (
                                <span key={idx} className="text-sm text-gray-700 font-medium">
                                  {member.name} ({member.designation})
                                </span>
                              ))}
                              {goal.assigned_members.length > 2 && (
                                <span className="text-xs text-gray-500">
                                  +{goal.assigned_members.length - 2} more
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Unassigned</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {goal.assigned_members && goal.assigned_members.length > 0 ? (
                          <div className="space-y-1">
                            {goal.assigned_members.map((member, idx) => {
                              const status = member.status;
                              return (
                                <div key={idx} className="flex items-center gap-2 group">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                                    {formatStatus(status)}
                                  </span>
                                  <button
                                    onClick={() => handleEditGoalRecord(goal.id, member.id, status, member.notes || '', member.user_goal_id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:text-blue-800 transition-all"
                                    title="Edit Progress"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No assignments</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {goal.assigned_members && goal.assigned_members.length > 0 ? (
                          <div className="space-y-1">
                            {goal.assigned_members.map((member, idx) => {
                              return (
                                <div key={idx} className="flex items-center gap-2 group">
                                  <span className="text-xs text-gray-700 max-w-xs truncate">
                                    {member.notes || 'No comment'}
                                  </span>
                                  <button
                                    onClick={() => handleEditGoalRecord(goal.id, member.id, member.status, member.notes || '', member.user_goal_id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-blue-600 hover:text-blue-800 transition-all"
                                    title="Edit Comment"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No assignments</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditGoal(goal)}
                            className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
                            title="Edit Goal"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="p-1 text-red-600 hover:text-red-800 transition-colors"
                            title="Delete Goal"
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
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
            <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Goals Yet</h3>
            <p className="text-gray-600 mb-6">Create your first organizational goal to get started</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create First Goal</span>
            </button>
          </div>
        )}

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
                    value={createForm.goal_name}
                    onChange={(e) => setCreateForm({ ...createForm, goal_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Complete Advanced SEO Certification"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={createForm.description}
                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="Brief description of the goal..."
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={createForm.priority}
                    onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value as 'High' | 'Medium' | 'Low' })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Complexity will be auto-calculated based on deadline duration
                  </p>
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
                    setEditForm({ goal_name: '', description: '', deadline: '', assignedMembers: [] });
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
                    value={editForm.goal_name}
                    onChange={(e) => setEditForm({ ...editForm, goal_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Complete Advanced SEO Certification"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={3}
                    placeholder="Brief description of the goal..."
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priority <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as 'High' | 'Medium' | 'Low' })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Complexity will be auto-calculated based on deadline duration
                  </p>
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
                      setEditForm({ goal_name: '', description: '', deadline: '', assignedMembers: [] });
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

        {/* Add Goal Record Modal */}
        {showRecordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingRecord ? 'Edit Goal Record' : 'Add Goal Record'}
                </h3>
                <button
                  onClick={() => {
                    setShowRecordModal(false);
                    setRecordForm({
                      goalId: '',
                      teamMemberId: '',
                      status: 'assigned',
                      notes: ''
                    });
                    setEditingRecord(null);
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={editingRecord ? handleUpdateGoalRecord : handleCreateGoalRecord} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Goal <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={recordForm.goalId}
                    onChange={(e) => setRecordForm({ ...recordForm, goalId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={!!editingRecord}
                  >
                    <option value="">Select a goal...</option>
                    {goals.map((goal) => (
                      <option key={goal.id} value={goal.id}>{goal.goal_name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Team Member <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={recordForm.teamMemberId}
                    onChange={(e) => setRecordForm({ ...recordForm, teamMemberId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    disabled={!recordForm.goalId || !!editingRecord}
                  >
                    <option value="">
                      {!recordForm.goalId 
                        ? "Select a goal first..." 
                        : getAvailableTeamMembers().length === 0 
                          ? "No members assigned to this goal"
                          : "Select team member..."
                      }
                    </option>
                    {getAvailableTeamMembers().map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.designation})
                      </option>
                    ))}
                  </select>
                  {recordForm.goalId && getAvailableTeamMembers().length === 0 && (
                    <p className="text-sm text-amber-600 mt-1">
                      This goal has no assigned members. Please assign members to the goal first.
                    </p>
                  )}
                  {recordForm.goalId && getAvailableTeamMembers().length > 0 && (
                    <p className="text-sm text-blue-600 mt-1">
                      {getAvailableTeamMembers().length} member{getAvailableTeamMembers().length > 1 ? 's' : ''} assigned to this goal
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={recordForm.status}
                    onChange={(e) => setRecordForm({ ...recordForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="assigned">Assigned</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Comment
                  </label>
                  <textarea
                    value={recordForm.notes}
                    onChange={(e) => setRecordForm({ ...recordForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    rows={3}
                    placeholder="Add a comment about this status update..."
                  />
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRecordModal(false);
                      setEditingRecord(null);
                      setRecordForm({
                        goalId: '',
                        teamMemberId: '',
                        status: 'assigned',
                        notes: ''
                      });
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {editingRecord ? 'Update Record' : 'Create Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Goals;