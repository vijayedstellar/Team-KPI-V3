import { supabase } from '../lib/supabase';
import { mockAnalysts } from '../data/mockData';
import type { TeamMember } from '../lib/supabase';

export const analystService = {
  async getAllAnalysts(): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('name');
    
    if (error) {
      throw error;
    }
    return data || [];
  },

  async getActiveAnalysts(): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('status', 'active')
      .order('name');
    
    if (error) {
      throw error;
    }
    return data || [];
  },

  async createAnalyst(analyst: Omit<TeamMember, 'id' | 'created_at' | 'updated_at'>): Promise<TeamMember> {
    const { data, error } = await supabase
      .from('team_members')
      .insert([analyst])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateAnalyst(id: string, updates: Partial<TeamMember>): Promise<TeamMember> {
    const { data, error } = await supabase
      .from('team_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteAnalyst(id: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};