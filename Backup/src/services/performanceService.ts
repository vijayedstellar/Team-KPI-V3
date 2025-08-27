import { supabase } from '../lib/supabase';
import { mockPerformanceRecords, mockKPITargets, mockAnalyst } from '../data/mockData';
import type { PerformanceRecord, KPITarget, Designation, KPIDefinition } from '../lib/supabase';

// Mock roles for fallback
const mockRoles: Designation[] = [
  { id: 'role-1', name: 'SEO Analyst', description: 'Entry-level SEO professional', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'role-2', name: 'SEO Specialist', description: 'Mid-level SEO professional', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'role-3', name: 'Content Writer', description: 'Content creation specialist', is_active: true, created_at: '2024-01-01T00:00:00Z' }
];

// Mock KPI definitions for fallback
const mockKPIDefinitions: KPIDefinition[] = [
  { id: 'kpi-1', name: 'outreaches', display_name: 'Monthly Outreaches', description: 'Number of outreach emails sent', unit: 'emails', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'kpi-2', name: 'live_links', display_name: 'Live Links', description: 'Successfully acquired backlinks', unit: 'links', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'kpi-3', name: 'high_da_links', display_name: 'High DA Backlinks (90+)', description: 'High authority backlinks', unit: 'links', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'kpi-4', name: 'content_distribution', display_name: 'Content Distribution', description: 'Content pieces distributed', unit: 'pieces', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'kpi-5', name: 'new_blogs', display_name: 'New Blog Contributions', description: 'New blog posts created', unit: 'posts', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'kpi-6', name: 'blog_optimizations', display_name: 'Blog Optimizations', description: 'Blog posts optimized', unit: 'posts', is_active: true, created_at: '2024-01-01T00:00:00Z' },
  { id: 'kpi-7', name: 'top_5_keywords', display_name: 'Top 5 Ranking Keywords', description: 'Keywords in top 5 positions', unit: 'keywords', is_active: true, created_at: '2024-01-01T00:00:00Z' }
];

// Mock KPI-Role mappings for fallback
const mockKPIRoleMappings = [
  { kpi_name: 'backlinks_outreach', designation: 'SEO Analyst' },
  { kpi_name: 'high_quality_backlinks', designation: 'SEO Specialist' },
  { kpi_name: 'website_traffic', designation: 'SEO Specialist' }
];

export const performanceService = {
  async getPerformanceRecords(teamMemberId?: string): Promise<PerformanceRecord[]> {
    // For production deployment without Supabase, use mock data
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      const records = mockPerformanceRecords.map(record => ({
        ...record,
        team_members: mockAnalyst
      }));
      return teamMemberId ? records.filter(r => r.team_member_id === teamMemberId) : records;
    }
    
    let query = supabase
      .from('performance_records')
      .select(`
        *,
        team_members!inner (
          id,
          name,
          email,
          designation
        )
      `)
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (teamMemberId) {
      query = query.eq('team_member_id', teamMemberId);
    }

    const { data, error } = await query;
    
    if (error) {
      console.warn('Supabase error, falling back to mock data:', error);
      const records = mockPerformanceRecords.map(record => ({
        ...record,
        team_members: mockAnalyst
      }));
      return teamMemberId ? records.filter(r => r.team_member_id === teamMemberId) : records;
    }
    return data || [];
  },

  async createOrUpdatePerformanceRecord(record: Omit<PerformanceRecord, 'id' | 'created_at' | 'updated_at' | 'team_members'>): Promise<PerformanceRecord> {
    console.log('Creating/updating performance record:', record);
    
    const { data, error } = await supabase
      .from('performance_records')
      .upsert([record], {
        onConflict: 'team_member_id,month,year'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error creating performance record:', error);
      throw error;
    }
    
    console.log('Performance record created/updated successfully:', data);
    return data;
  },

  async updatePerformanceRecord(id: string, record: Partial<PerformanceRecord>): Promise<PerformanceRecord> {
    console.log('Updating performance record:', { id, record });
    
    const { data, error } = await supabase
      .from('performance_records')
      .update(record)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error updating performance record:', error);
      throw error;
    }
    
    console.log('Performance record updated successfully:', data);
    return data;
  },

  async deletePerformanceRecord(id: string): Promise<void> {
    console.log('Deleting performance record:', id);
    
    const { error } = await supabase
      .from('performance_records')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Supabase error deleting performance record:', error);
      throw error;
    }
    
    console.log('Performance record deleted successfully');
  },

  async getKPITargets(): Promise<KPITarget[]> {
    // For production deployment without Supabase, use mock data
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      return mockKPITargets;
    }
    
    // Try with 'designation' column first, fallback to 'role' column if it doesn't exist
    let { data, error } = await supabase
      .from('kpi_targets')
      .select('*')
      .order('designation', { ascending: true })
      .order('kpi_name', { ascending: true });
    
    // If designation column doesn't exist, try with role column
    if (error && error.code === '42703' && error.message.includes('designation does not exist')) {
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('kpi_targets')
        .select('*')
        .order('role', { ascending: true })
        .order('kpi_name', { ascending: true });
      
      if (fallbackError) {
        console.warn('Supabase error, falling back to mock data:', fallbackError);
        return mockKPITargets;
      }
      
      // Map role to designation for consistency
      data = fallbackData?.map(item => ({
        ...item,
        designation: item.role
      })) || null;
      error = null;
    }
    
    if (error) {
      console.warn('Supabase error, falling back to mock data:', error);
      return mockKPITargets;
    }
    
    return data || mockKPITargets;
  },

  async getKPITargetsByRole(designation: string): Promise<KPITarget[]> {
    const { data, error } = await supabase
      .from('kpi_targets')
      .select('*')
      .eq('designation', designation)
      .order('kpi_name');
    
    if (error) throw error;
    return data || [];
  },

  async createOrUpdateKPITarget(target: Omit<KPITarget, 'id' | 'created_at'>): Promise<KPITarget> {
    const { data, error } = await supabase
      .from('kpi_targets')
      .upsert([target], {
        onConflict: 'kpi_name,designation'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteKPITarget(id: string): Promise<void> {
    const { error } = await supabase
      .from('kpi_targets')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async getAnalystYearlyPerformance(analystId: string, year: number): Promise<PerformanceRecord[]> {
    const { data, error } = await supabase
      .from('performance_records')
      .select('*')
      .eq('team_member_id', analystId)
      .eq('year', year)
      .order('month');
    
    if (error) throw error;
    return data || [];
  },

  async getAnalystPeriodPerformance(
    analystId: string, 
    period: {
      startMonth: number;
      startYear: number;
      endMonth: number;
      endYear: number;
    }
  ): Promise<PerformanceRecord[]> {
    const { data, error } = await supabase
      .from('performance_records')
      .select('*')
      .eq('team_member_id', analystId)
      .gte('year', period.startYear)
      .lte('year', period.endYear)
      .order('year')
      .order('month');
    
    if (error) throw error;
    
    // Filter records to match the exact month range
    const filteredData = (data || []).filter(record => {
      const recordDate = new Date(record.year, parseInt(record.month) - 1);
      const startDate = new Date(period.startYear, period.startMonth - 1);
      const endDate = new Date(period.endYear, period.endMonth - 1);
      
      return recordDate >= startDate && recordDate <= endDate;
    });
    
    return filteredData;
  },
  // Role management
  async getRoles(): Promise<Designation[]> {
    const { data, error } = await supabase
      .from('designations')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      throw error;
    }
    return data || [];
  },

  async createRole(role: Omit<Designation, 'id' | 'created_at'>): Promise<Designation> {
    const { data, error } = await supabase
      .from('designations')
      .insert([role])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateRole(id: string, updates: Partial<Designation>): Promise<Designation> {
    const { data, error } = await supabase
      .from('designations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteRole(id: string): Promise<void> {
    const { error } = await supabase
      .from('designations')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
  },

  // KPI Definition management
  async getKPIDefinitions(): Promise<KPIDefinition[]> {
    const { data, error } = await supabase
      .from('kpi_definitions')
      .select('*')
      .eq('is_active', true)
      .order('display_name');
    
    if (error) {
      throw error;
    }
    
    // Ensure all active KPI columns exist in performance_records table
    if (data && data.length > 0) {
      for (const kpi of data) {
        await this.addKPIColumnToPerformanceTable(kpi.name);
      }
    }
    
    return data || [];
  },

  async createKPIDefinition(kpi: Omit<KPIDefinition, 'id' | 'created_at'>): Promise<KPIDefinition> {
    const { data, error } = await supabase
      .from('kpi_definitions')
      .insert([kpi])
      .select()
      .single();
    
    if (error) throw error;
    
    // Add column to performance_records table
    await this.addKPIColumnToPerformanceTable(kpi.name);
    
    return data;
  },

  async updateKPIDefinition(id: string, updates: Partial<KPIDefinition>): Promise<KPIDefinition> {
    // Get the current KPI to check if name is changing
    const { data: currentKPI } = await supabase
      .from('kpi_definitions')
      .select('name')
      .eq('id', id)
      .single();
    
    const { data, error } = await supabase
      .from('kpi_definitions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    // If name changed, update performance table column
    if (currentKPI && updates.name && currentKPI.name !== updates.name) {
      await this.renameKPIColumnInPerformanceTable(currentKPI.name, updates.name);
    }
    
    return data;
  },

  async deleteKPIDefinition(id: string): Promise<void> {
    // Get the KPI name before deletion
    const { data: kpi } = await supabase
      .from('kpi_definitions')
      .select('name')
      .eq('id', id)
      .single();
    
    const { error } = await supabase
      .from('kpi_definitions')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
    
    // Remove column from performance_records table
    if (kpi) {
      await this.removeKPIColumnFromPerformanceTable(kpi.name);
    }
  },

  // Helper methods for dynamic column management
  async addKPIColumnToPerformanceTable(kpiName: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('add_kpi_column', {
        p_column_name: kpiName
      });
      if (error) console.warn('Could not add column:', error);
    } catch (error) {
      console.warn('Column management not available:', error);
    }
  },

  async renameKPIColumnInPerformanceTable(oldName: string, newName: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('rename_kpi_column', {
        p_old_column_name: oldName,
        p_new_column_name: newName
      });
      if (error) console.warn('Could not rename column:', error);
    } catch (error) {
      console.warn('Column management not available:', error);
    }
  },

  async removeKPIColumnFromPerformanceTable(kpiName: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('remove_kpi_column', {
        p_column_name: kpiName
      });
      if (error) console.warn('Could not remove column:', error);
    } catch (error) {
      console.warn('Column management not available:', error);
    }
  }
};