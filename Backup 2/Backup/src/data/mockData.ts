// Mock data for demonstration purposes
import type { PerformanceRecord, TeamMember, KPITarget } from '../lib/supabase';

export const mockAnalysts: TeamMember[] = [
  {
    id: 'mock-analyst-1',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    hire_date: '2024-08-15',
    designation: 'SEO Analyst',
    status: 'active',
    created_at: '2024-08-15T00:00:00Z',
    updated_at: '2024-08-15T00:00:00Z'
  },
  {
    id: 'mock-analyst-2',
    name: 'Michael Chen',
    email: 'michael.chen@company.com',
    hire_date: '2024-06-01',
    designation: 'SEO Specialist',
    status: 'active',
    created_at: '2024-06-01T00:00:00Z',
    updated_at: '2024-06-01T00:00:00Z'
  },
  {
    id: 'mock-analyst-3',
    name: 'Kiran Kumar',
    email: 'kiran@edstellar.com',
    hire_date: '2024-09-01',
    designation: 'SEO Analyst',
    status: 'active',
    created_at: '2024-09-01T00:00:00Z',
    updated_at: '2024-09-01T00:00:00Z'
  }
];

export const mockAnalyst: TeamMember = {
  id: 'mock-analyst-1',
  name: 'Sarah Johnson',
  email: 'sarah.johnson@company.com',
  hire_date: '2024-08-15',
  designation: 'SEO Analyst',
  status: 'active',
  created_at: '2024-08-15T00:00:00Z',
  updated_at: '2024-08-15T00:00:00Z'
};

export const mockKPITargets: KPITarget[] = [
  // Updated to match actual database columns
  { id: '1', kpi_name: 'outreaches', monthly_target: 525, annual_target: 6825, designation: 'SEO Analyst', created_at: '2024-01-01T00:00:00Z' }
];

export const mockPerformanceRecords: PerformanceRecord[] = [
  {
    id: 'perf-1', team_member_id: 'mock-analyst-1', month: '09', year: 2025,
    outreaches: 580, live_links: 18, high_da_links: 4, content_distribution: 9,
    new_blogs: 12, blog_optimizations: 6, top_5_keywords: 4,
    created_at: '2025-09-30T00:00:00Z', updated_at: '2025-09-30T00:00:00Z'
  },
  {
    id: 'perf-2', team_member_id: 'mock-analyst-1', month: '10', year: 2025,
    outreaches: 620, live_links: 16, high_da_links: 3, content_distribution: 8,
    new_blogs: 11, blog_optimizations: 5, top_5_keywords: 3,
    created_at: '2025-10-31T00:00:00Z', updated_at: '2025-10-31T00:00:00Z'
  },
  {
    id: 'perf-3', team_member_id: 'mock-analyst-1', month: '11', year: 2025,
    outreaches: 545, live_links: 14, high_da_links: 2, content_distribution: 7,
    new_blogs: 9, blog_optimizations: 4, top_5_keywords: 2,
    created_at: '2025-11-30T00:00:00Z', updated_at: '2025-11-30T00:00:00Z'
  },
  {
    id: 'perf-4', team_member_id: 'mock-analyst-1', month: '12', year: 2025,
    outreaches: 490, live_links: 12, high_da_links: 2, content_distribution: 6,
    new_blogs: 8, blog_optimizations: 3, top_5_keywords: 2,
    created_at: '2025-12-31T00:00:00Z', updated_at: '2025-12-31T00:00:00Z'
  },
  {
    id: 'perf-5', team_member_id: 'mock-analyst-1', month: '01', year: 2026,
    outreaches: 510, live_links: 13, high_da_links: 3, content_distribution: 7,
    new_blogs: 10, blog_optimizations: 5, top_5_keywords: 3,
    created_at: '2026-01-31T00:00:00Z', updated_at: '2026-01-31T00:00:00Z'
  },
  {
    id: 'perf-6', team_member_id: 'mock-analyst-1', month: '02', year: 2026,
    outreaches: 560, live_links: 15, high_da_links: 3, content_distribution: 8,
    new_blogs: 11, blog_optimizations: 6, top_5_keywords: 3,
    created_at: '2026-02-28T00:00:00Z', updated_at: '2026-02-28T00:00:00Z'
  },
  {
    id: 'perf-7', team_member_id: 'mock-analyst-1', month: '03', year: 2026,
    outreaches: 595, live_links: 17, high_da_links: 4, content_distribution: 9,
    new_blogs: 12, blog_optimizations: 7, top_5_keywords: 4,
    created_at: '2026-03-31T00:00:00Z', updated_at: '2026-03-31T00:00:00Z'
  },
  {
    id: 'perf-8', team_member_id: 'mock-analyst-1', month: '04', year: 2026,
    outreaches: 630, live_links: 19, high_da_links: 5, content_distribution: 10,
    new_blogs: 13, blog_optimizations: 8, top_5_keywords: 5,
    created_at: '2026-04-30T00:00:00Z', updated_at: '2026-04-30T00:00:00Z'
  },
  {
    id: 'perf-9', team_member_id: 'mock-analyst-1', month: '05', year: 2026,
    outreaches: 655, live_links: 20, high_da_links: 5, content_distribution: 11,
    new_blogs: 14, blog_optimizations: 9, top_5_keywords: 5,
    created_at: '2026-05-31T00:00:00Z', updated_at: '2026-05-31T00:00:00Z'
  },
  {
    id: 'perf-10', team_member_id: 'mock-analyst-1', month: '06', year: 2026,
    outreaches: 680, live_links: 22, high_da_links: 6, content_distribution: 12,
    new_blogs: 15, blog_optimizations: 10, top_5_keywords: 6,
    created_at: '2026-06-30T00:00:00Z', updated_at: '2026-06-30T00:00:00Z'
  },
  {
    id: 'perf-11', team_member_id: 'mock-analyst-1', month: '07', year: 2026,
    outreaches: 700, live_links: 24, high_da_links: 7, content_distribution: 13,
    new_blogs: 16, blog_optimizations: 11, top_5_keywords: 7,
    created_at: '2026-07-31T00:00:00Z', updated_at: '2026-07-31T00:00:00Z'
  },
  {
    id: 'perf-12', team_member_id: 'mock-analyst-1', month: '08', year: 2026,
    outreaches: 720, live_links: 25, high_da_links: 8, content_distribution: 14,
    new_blogs: 17, blog_optimizations: 12, top_5_keywords: 8,
    created_at: '2026-08-31T00:00:00Z', updated_at: '2026-08-31T00:00:00Z'
  },
  {
    id: 'perf-13', team_member_id: 'mock-analyst-1', month: '09', year: 2026,
    outreaches: 740, live_links: 26, high_da_links: 8, content_distribution: 15,
    new_blogs: 18, blog_optimizations: 13, top_5_keywords: 9,
    created_at: '2026-09-30T00:00:00Z', updated_at: '2026-09-30T00:00:00Z'
  }
];