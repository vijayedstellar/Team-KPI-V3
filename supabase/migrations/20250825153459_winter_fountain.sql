/*
  # Add Role-Based KPI Targets

  1. Schema Changes
    - Add `role` column to `kpi_targets` table
    - Add unique constraint on (kpi_name, role) combination
    - Insert default targets for different roles

  2. New Target Roles
    - SEO Analysts (existing data)
    - SEO Specialists
    - Content Writers
    - Link Building Specialists
    - Technical SEO Specialists

  3. Security
    - Maintain existing RLS policies
    - Update indexes for better performance
*/

-- Add role column to kpi_targets table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'kpi_targets' AND column_name = 'role'
  ) THEN
    ALTER TABLE kpi_targets ADD COLUMN role text DEFAULT 'SEO Analyst';
  END IF;
END $$;

-- Update existing records to have 'SEO Analyst' role
UPDATE kpi_targets SET role = 'SEO Analyst' WHERE role IS NULL;

-- Make role column NOT NULL
ALTER TABLE kpi_targets ALTER COLUMN role SET NOT NULL;

-- Drop existing unique constraint and create new one with role
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'kpi_targets' AND constraint_name = 'kpi_targets_kpi_name_key'
  ) THEN
    ALTER TABLE kpi_targets DROP CONSTRAINT kpi_targets_kpi_name_key;
  END IF;
END $$;

-- Add unique constraint on kpi_name and role combination
ALTER TABLE kpi_targets ADD CONSTRAINT kpi_targets_kpi_name_role_key UNIQUE (kpi_name, role);

-- Insert KPI targets for SEO Specialists
INSERT INTO kpi_targets (kpi_name, monthly_target, annual_target, role) VALUES
('outreaches', 400, 5200, 'SEO Specialist'),
('live_links', 12, 156, 'SEO Specialist'),
('high_da_links', 2, 26, 'SEO Specialist'),
('content_distribution', 6, 78, 'SEO Specialist'),
('new_blogs', 8, 104, 'SEO Specialist'),
('blog_optimizations', 4, 52, 'SEO Specialist'),
('top_5_keywords', 2, 26, 'SEO Specialist')
ON CONFLICT (kpi_name, role) DO NOTHING;

-- Insert KPI targets for Content Writers
INSERT INTO kpi_targets (kpi_name, monthly_target, annual_target, role) VALUES
('content_pieces', 15, 195, 'Content Writer'),
('blog_posts', 12, 156, 'Content Writer'),
('content_optimizations', 8, 104, 'Content Writer'),
('keyword_research', 20, 260, 'Content Writer'),
('content_distribution', 10, 130, 'Content Writer'),
('social_posts', 25, 325, 'Content Writer'),
('content_updates', 6, 78, 'Content Writer')
ON CONFLICT (kpi_name, role) DO NOTHING;

-- Insert KPI targets for Link Building Specialists
INSERT INTO kpi_targets (kpi_name, monthly_target, annual_target, role) VALUES
('outreaches', 600, 7800, 'Link Building Specialist'),
('live_links', 20, 260, 'Link Building Specialist'),
('high_da_links', 5, 65, 'Link Building Specialist'),
('guest_posts', 4, 52, 'Link Building Specialist'),
('broken_link_fixes', 8, 104, 'Link Building Specialist'),
('resource_page_links', 6, 78, 'Link Building Specialist'),
('competitor_analysis', 2, 26, 'Link Building Specialist')
ON CONFLICT (kpi_name, role) DO NOTHING;

-- Insert KPI targets for Technical SEO Specialists
INSERT INTO kpi_targets (kpi_name, monthly_target, annual_target, role) VALUES
('technical_audits', 3, 39, 'Technical SEO Specialist'),
('site_speed_improvements', 5, 65, 'Technical SEO Specialist'),
('schema_implementations', 8, 104, 'Technical SEO Specialist'),
('crawl_error_fixes', 15, 195, 'Technical SEO Specialist'),
('mobile_optimizations', 6, 78, 'Technical SEO Specialist'),
('core_web_vitals_fixes', 4, 52, 'Technical SEO Specialist'),
('structured_data_updates', 10, 130, 'Technical SEO Specialist')
ON CONFLICT (kpi_name, role) DO NOTHING;

-- Create index for better performance on role-based queries
CREATE INDEX IF NOT EXISTS idx_kpi_targets_role ON kpi_targets(role);