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
  goal_name: string;
  description?: string;
  deadline: string;
  priority?: 'High' | 'Medium' | 'Low';
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
  // Goal management - now using user_goals table as primary source
  async getGoals(deadlineFilter?: {
    startMonth: number;
    startYear: number;
    endMonth: number;
    endYear: number;
  }): Promise<GoalWithAssignments[]> {
    try {
      // Get all user goals with team member details
      const { data: userGoalsData, error: userGoalsError } = await supabase
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
      
      if (userGoalsError) {
        throw userGoalsError;
      }

      console.log('User goals data from user_goals table:', userGoalsData?.length || 0);

      // Group user goals by goal_name to create goals with assignments
      const goalGroups = (userGoalsData || []).reduce((groups: any, userGoal: any) => {
        const goalKey = userGoal.goal_name || 'Untitled Goal';
        if (!groups[goalKey]) {
          groups[goalKey] = {
            goal: {
              id: userGoal.goal_id || userGoal.id,
              goal_name: userGoal.goal_name,
              internal_name: userGoal.goal_name?.toLowerCase().replace(/\s+/g, '_') || 'untitled',
              description: userGoal.description,
              deadline: userGoal.user_deadline,
              priority: userGoal.priority || 'Medium',
              is_active: true,
              created_at: userGoal.created_at,
              updated_at: userGoal.updated_at
            },
            assignments: []
          };
        }
        groups[goalKey].assignments.push(userGoal);
        return groups;
      }, {});

      // Transform grouped data to GoalWithAssignments format
      const goalsWithAssignments: GoalWithAssignments[] = Object.values(goalGroups).map((group: any) => {
        const goal = group.goal;
        const assignments = group.assignments;
        
        return {
          id: goal.id,
          goal_name: goal.goal_name,
          internal_name: goal.internal_name,
          description: goal.description,
          deadline: goal.deadline,
          priority: goal.priority || 'Medium',
          is_active: goal.is_active,
          created_at: goal.created_at,
          updated_at: goal.updated_at,
          assigned_members: assignments.map((userGoal: any) => ({
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

      console.log('Goals from user_goals table:', goalsWithAssignments.length);
      
      // Apply deadline filtering if provided
      if (deadlineFilter) {
        const periodStart = new Date(deadlineFilter.startYear, deadlineFilter.startMonth - 1, 1);
        const periodEnd = new Date(deadlineFilter.endYear, deadlineFilter.endMonth, 0, 23, 59, 59);
        
        const filteredGoals = goalsWithAssignments.filter(goal => {
          const goalDeadline = new Date(goal.deadline + (goal.deadline.includes('T') ? '' : 'T00:00:00'));
          return goalDeadline >= periodStart && goalDeadline <= periodEnd;
        });
        
        return filteredGoals;
      }
      
      return goalsWithAssignments;
    } catch (error) {
      console.error('Error fetching goals from user_goals table:', error);
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
      // Generate internal name from goal name
      const internal_name = goalData.goal_name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      
      // Create user goal records directly in user_goals table
      if (goalData.assignedMembers && goalData.assignedMembers.length > 0) {
        const userGoals = goalData.assignedMembers.map(memberId => ({
          goal_id: `goal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Generate unique goal_id
          team_member_id: memberId,
          goal_name: goalData.goal_name,
          description: goalData.description || '',
          user_deadline: goalData.deadline,
          priority: goalData.priority || 'Medium',
          assigned_date: new Date().toISOString().split('T')[0],
          status: 'assigned' as const,
          notes: ''
        }));

        const { data: createdGoals, error: createError } = await supabase
          .from('user_goals')
          .insert(userGoals)
          .select()
          .limit(1)
          .single();

        if (createError) {
          throw createError;
        }

        // Return goal data in expected format
        return {
          id: createdGoals.goal_id,
          goal_name: goalData.goal_name,
          internal_name: internal_name,
          description: goalData.description,
          deadline: goalData.deadline,
          priority: goalData.priority || 'Medium',
          is_active: true,
          created_at: createdGoals.created_at,
          updated_at: createdGoals.updated_at
        };
      } else {
        throw new Error('At least one team member must be assigned to the goal');
      }
    } catch (error) {
      console.error('Error creating goal in user_goals table:', error);
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
      // Update all user_goals records with this goal_id
      const { data: updatedGoals, error: updateError } = await supabase
        .from('user_goals')
        .update({
          goal_name: goalData.goal_name,
          description: goalData.description || '',
          user_deadline: goalData.deadline,
          priority: goalData.priority || 'Medium',
          updated_at: new Date().toISOString()
        })
        .eq('goal_id', goalId)
        .select()
        .limit(1)
        .single();

      if (updateError) {
        throw updateError;
      }
      
      // Get current assignments to compare with new ones
      const { data: currentAssignments } = await supabase
        .from('user_goals')
        .select('team_member_id, id')
        .eq('goal_id', goalId);
      
      const currentMemberIds = currentAssignments?.map(a => a.team_member_id) || [];
      const newMemberIds = goalData.assignedMembers;
      
      // Remove assignments that are no longer selected
      const membersToRemove = currentMemberIds.filter(id => !newMemberIds.includes(id));
      if (membersToRemove.length > 0) {
        const { error: removeError } = await supabase
          .from('user_goals')
          .delete()
          .eq('goal_id', goalId)
          .in('team_member_id', membersToRemove);
        
        if (removeError) {
          throw removeError;
        }
      }
      
      // Add new assignments
      const membersToAdd = newMemberIds.filter(id => !currentMemberIds.includes(id));
      if (membersToAdd.length > 0) {
        const newAssignments = membersToAdd.map(memberId => ({
          goal_id: goalId,
          team_member_id: memberId,
          goal_name: goalData.goal_name,
          description: goalData.description || '',
          user_deadline: goalData.deadline,
          priority: goalData.priority || 'Medium',
          assigned_date: new Date().toISOString().split('T')[0],
          status: 'assigned' as const,
          notes: ''
        }));

        const { error: addError } = await supabase
          .from('user_goals')
          .insert(newAssignments);

        if (addError) {
          throw addError;
        }
      }

      // Return goal data in expected format
      return {
        id: goalId,
        goal_name: goalData.goal_name,
        internal_name: goalData.goal_name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
        description: goalData.description,
        deadline: goalData.deadline,
        priority: goalData.priority || 'Medium',
        is_active: true,
        created_at: updatedGoals.created_at,
        updated_at: updatedGoals.updated_at
      };
    } catch (error) {
      console.error('Error updating goal in user_goals table:', error);
      throw error;
    }
  },

  async deleteGoal(goalId: string): Promise<void> {
    try {
      // Delete all user_goals records with this goal_id
      const { error } = await supabase
        .from('user_goals')
        .delete()
        .eq('goal_id', goalId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting goal from user_goals table:', error);
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
      
      return data || [];
    } catch (error) {
      console.error('Error fetching user goals from user_goals table:', error);
      throw error;
    }
  },

  async updateUserGoalStatus(userGoalId: string, status: string, notes?: string): Promise<UserGoal> {
    try {
      const { data, error } = await supabase
        .from('user_goals')
        .update({
          status,
          notes: notes || '',
          updated_at: new Date().toISOString()
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
      
      return data;
    } catch (error) {
      console.error('Error updating user goal status in user_goals table:', error);
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
      
      return data;
    } catch (error) {
      console.error('Error fetching user goal from user_goals table:', error);
      throw error;
    }
  }
};
