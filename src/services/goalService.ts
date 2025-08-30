import { supabase } from '../lib/supabase';

export interface Goal {
  id: string;
  goal_name: string;
  internal_name: string;
  description?: string;
  deadline: string;
  priority?: 'High' | 'Medium' | 'Low';
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface UserGoal {
  id: string;
  goal_id: string;
  team_member_id: string;
  assigned_date: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  created_at: string;
  updated_at: string;
  goals?: Goal;
  team_members?: {
    id: string;
    name: string;
    designation: string;
    email: string;
  };
}

export interface GoalWithAssignments extends Goal {
  assigned_members: Array<{
    id: string;
    name: string;
    designation: string;
    email: string;
    status: string;
    notes?: string;
    user_goal_id: string;
  }>;
}

export const goalService = {
  // Goal management
  async getGoals(deadlineFilter?: {
    startMonth: number;
    startYear: number;
    endMonth: number;
    endYear: number;
  }): Promise<GoalWithAssignments[]> {
    try {
      // Get all user_goals with team member details
      let query = supabase
        .from('user_goals')
        .select(`
          *,
          team_members!inner (
            id,
            name,
            designation,
            email
          )
        `)
        .order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) {
        throw error;
      }

      // Group user_goals by goal_id to create goal objects
      console.log('Raw user_goals data:', data?.length || 0);
      
      const goalGroups: { [key: string]: any[] } = {};
      
      (data || []).forEach(userGoal => {
        if (!goalGroups[userGoal.goal_id]) {
          goalGroups[userGoal.goal_id] = [];
        }
        goalGroups[userGoal.goal_id].push(userGoal);
      });

      console.log('Grouped goals:', Object.keys(goalGroups).length);

      // Transform grouped data into GoalWithAssignments format
      const goalsWithAssignments: GoalWithAssignments[] = Object.entries(goalGroups).map(([goalId, userGoals]) => {
        const firstUserGoal = userGoals[0];
        
        return {
          id: goalId,
          goal_name: goalId.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '), // Convert internal_name back to display name
          internal_name: goalId,
          description: '', // We don't have description in user_goals, so empty for now
          deadline: this.getGoalDeadlineFromStorage(goalId) || firstUserGoal.assigned_date, // Try to get real deadline
          is_active: true,
          created_at: firstUserGoal.created_at,
          updated_at: firstUserGoal.updated_at,
          assigned_members: userGoals.map(userGoal => ({
            id: userGoal.team_members.id,
            name: userGoal.team_members.name,
            designation: userGoal.team_members.designation,
            email: userGoal.team_members.email,
            status: userGoal.status,
            notes: userGoal.notes,
            user_goal_id: userGoal.id
          }))
        };
      });

      console.log('Goals before deadline filtering:', goalsWithAssignments.length);
      
      // Apply deadline filtering if provided
      if (deadlineFilter) {
        const periodStart = new Date(deadlineFilter.startYear, deadlineFilter.startMonth - 1, 1);
        const periodEnd = new Date(deadlineFilter.endYear, deadlineFilter.endMonth, 0, 23, 59, 59);
        
        console.log('Deadline filtering period:', {
          start: periodStart.toISOString(),
          end: periodEnd.toISOString()
        });
        
        const filteredGoals = goalsWithAssignments.filter(goal => {
          const goalDeadline = new Date(goal.deadline + (goal.deadline.includes('T') ? '' : 'T00:00:00'));
          const isInPeriod = goalDeadline >= periodStart && goalDeadline <= periodEnd;
          
          console.log('Goal deadline check:', {
            goalName: goal.goal_name,
            deadline: goal.deadline,
            parsedDeadline: goalDeadline.toISOString(),
            periodStart: periodStart.toISOString(),
            periodEnd: periodEnd.toISOString(),
            isInPeriod
          });
          
          return isInPeriod;
        });
        
        console.log('Goals after deadline filtering:', filteredGoals.length);
        return filteredGoals;
      }
      
      return goalsWithAssignments;
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
  },

  async createGoal(goalData: {
    goal_name: string;
    description?: string;
    deadline: string;
    priority?: 'High' | 'Medium' | 'Low';
    assignedMembers: string[];
  }): Promise<Goal> {
    try {
      // Since goals table might not exist, we'll work directly with user_goals
      // and use goal_name as the identifier
      const goalId = goalData.goal_name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

      // Create user goal assignments
      if (goalData.assignedMembers.length > 0) {
        const userGoals = goalData.assignedMembers.map(memberId => ({
          goal_id: goalId,
          team_member_id: memberId,
          assigned_date: new Date().toISOString().split('T')[0],
          status: 'assigned' as const,
          notes: ''
        }));

        const { error: assignmentError } = await supabase
          .from('user_goals')
          .insert(userGoals);

        if (assignmentError) {
          throw assignmentError;
        }
      }

      // Return a goal object for consistency
      return {
        id: goalId,
        goal_name: goalData.goal_name,
        internal_name: goalId,
        description: goalData.description,
        deadline: goalData.deadline,
        priority: goalData.priority || 'Medium',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  },

  async updateGoal(goalId: string, goalData: {
    goal_name: string;
    description?: string;
    deadline: string;
    priority?: 'High' | 'Medium' | 'Low';
    assignedMembers: string[];
  }): Promise<Goal> {
    try {
      // Since we're working with user_goals directly, we need to update all related records
      const newGoalId = goalData.goal_name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

      // Delete existing assignments
      const { error: deleteError } = await supabase
        .from('user_goals')
        .delete()
        .eq('goal_id', goalId);

      if (deleteError) {
        throw deleteError;
      }

      // Create new assignments
      if (goalData.assignedMembers.length > 0) {
        const userGoals = goalData.assignedMembers.map(memberId => ({
          goal_id: newGoalId,
          team_member_id: memberId,
          assigned_date: new Date().toISOString().split('T')[0],
          status: 'assigned' as const,
          notes: ''
        }));

        const { error: assignmentError } = await supabase
          .from('user_goals')
          .insert(userGoals);

        if (assignmentError) {
          throw assignmentError;
        }
      }

      // Return updated goal object
      return {
        id: newGoalId,
        goal_name: goalData.goal_name,
        internal_name: newGoalId,
        description: goalData.description,
        deadline: goalData.deadline,
        priority: goalData.priority || 'Medium',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  },

  async deleteGoal(goalId: string): Promise<void> {
    try {
      // Delete user goal assignments (this is all we need since we're not using goals table)
      const { error: assignmentError } = await supabase
        .from('user_goals')
        .delete()
        .eq('goal_id', goalId);

      if (assignmentError) {
        throw assignmentError;
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  },

  // User goal management
  async getUserGoals(goalId?: string): Promise<UserGoal[]> {
    try {
      let query = supabase
        .from('user_goals')
        .select(`
          *,
          team_members!inner (
            id,
            name,
            designation,
            email
          )
        `)
        .order('updated_at', { ascending: false });

      if (goalId) {
        query = query.eq('goal_id', goalId);
      }

      const { data, error } = await query;
      
      if (error) {
        throw error;
      }
      
      // Transform data to include goal information
      const transformedData = (data || []).map(userGoal => ({
        ...userGoal,
        goals: {
          id: userGoal.goal_id,
          goal_name: userGoal.goal_id.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          internal_name: userGoal.goal_id,
          description: '',
          deadline: userGoal.assigned_date,
          is_active: true
        }
      }));
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching user goals:', error);
      throw error;
    }
  },

  async updateUserGoalStatus(userGoalId: string, status: string, notes?: string): Promise<UserGoal> {
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .update({
          status,
          notes: notes || ''
        })
        .eq('id', userGoalId)
        .select(`
          *,
          team_members!inner (
            id,
            name,
            designation,
            email
          )
        `)
        .single();
      
      if (error) {
        throw error;
      }
      
      // Transform data to include goal information
      const transformedData = {
        ...data,
        goals: {
          id: data.goal_id,
          goal_name: data.goal_id.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          internal_name: data.goal_id,
          description: '',
          deadline: data.assigned_date,
          is_active: true
        }
      };
      
      return transformedData;
    } catch (error) {
      console.error('Error updating user goal status:', error);
      throw error;
    }
  },

  async getUserGoalByGoalAndMember(goalId: string, teamMemberId: string): Promise<UserGoal | null> {
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .select(`
          *,
          team_members!inner (
            id,
            name,
            designation,
            email
          )
        `)
        .eq('goal_id', goalId)
        .eq('team_member_id', teamMemberId)
        .maybeSingle();
      
      if (error) {
        throw error;
      }
      
      if (!data) return null;
      
      // Transform data to include goal information
      const transformedData = {
        ...data,
        goals: {
          id: data.goal_id,
          goal_name: data.goal_id.split('_').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' '),
          internal_name: data.goal_id,
          description: '',
          deadline: data.assigned_date,
          is_active: true
        }
      };
      
      return transformedData;
    } catch (error) {
      console.error('Error fetching user goal:', error);
      throw error;
    }
  },

  // Helper method to get goal deadline from localStorage (temporary solution)
  getGoalDeadlineFromStorage(goalId: string): string | null {
    try {
      const goals = JSON.parse(localStorage.getItem('goals') || '[]');
      const goal = goals.find((g: any) => g.id === goalId);
      return goal?.deadline || null;
    } catch (error) {
      return null;
    }
  }
};