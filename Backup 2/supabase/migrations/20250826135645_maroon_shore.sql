/*
  # Fresh Database Schema Reset
  
  This script drops all existing tables and recreates them with standardized field names.
  The frontend will strictly follow the database schema definitions.
  
  1. Drop all existing tables
  2. Create fresh tables with consistent naming
  3. Insert default data
  4. Set up proper indexes and constraints
*/

-- Drop all existing tables (in correct order to handle foreign key constraints)
DROP TABLE IF EXISTS performance_records CASCADE;
DROP TABLE IF EXISTS kpi_targets CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS designations CASCADE;
DROP TABLE IF EXISTS kpi_definitions CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS analysts CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS add_kpi_column(text);
DROP FUNCTION IF EXISTS rename_kpi_column(text, text);
DROP FUNCTION IF EXISTS remove_kpi_column(text);
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. Admin Users Table
CREATE TABLE admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Designations Table (standardized name)
CREATE TABLE designations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 3. KPI Definitions Table
CREATE TABLE kpi_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  unit text DEFAULT 'count',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 4. Team Members Table (standardized name)
CREATE TABLE team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  hire_date date DEFAULT CURRENT_DATE,
  designation text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. KPI Targets Table (using designation field consistently)
CREATE TABLE kpi_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_name text NOT NULL,
  designation text NOT NULL,
  monthly_target integer NOT NULL DEFAULT 0,
  annual_target integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(kpi_name, designation)
);

-- 6. Performance Records Table (using team_member_id consistently)
CREATE TABLE performance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid REFERENCES team_members(id) ON DELETE CASCADE,
  month text NOT NULL,
  year integer NOT NULL,
  outreaches integer DEFAULT 0,
  live_links integer DEFAULT 0,
  high_da_links integer DEFAULT 0,
  content_distribution integer DEFAULT 0,
  new_blogs integer DEFAULT 0,
  blog_optimizations integer DEFAULT 0,
  top_5_keywords integer DEFAULT 0,
  backlinks integer DEFAULT 0,
  leads integer DEFAULT 0,
  disavow integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_member_id, month, year)
);

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_records ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all operations for authenticated users)
CREATE POLICY "Enable all operations for admin_users" ON admin_users FOR ALL USING (true);
CREATE POLICY "Enable all operations for designations" ON designations FOR ALL USING (true);
CREATE POLICY "Enable all operations for kpi_definitions" ON kpi_definitions FOR ALL USING (true);
CREATE POLICY "Enable all operations for team_members" ON team_members FOR ALL USING (true);
CREATE POLICY "Enable all operations for kpi_targets" ON kpi_targets FOR ALL USING (true);
CREATE POLICY "Enable all operations for performance_records" ON performance_records FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_active ON admin_users(is_active);
CREATE INDEX idx_designations_active ON designations(is_active);
CREATE INDEX idx_kpi_definitions_active ON kpi_definitions(is_active);
CREATE INDEX idx_team_members_designation ON team_members(designation);
CREATE INDEX idx_team_members_status ON team_members(status);
CREATE INDEX idx_kpi_targets_designation ON kpi_targets(designation);
CREATE INDEX idx_kpi_targets_kpi_name ON kpi_targets(kpi_name);
CREATE INDEX idx_performance_records_team_member ON performance_records(team_member_id);
CREATE INDEX idx_performance_records_month_year ON performance_records(month, year);

-- Create triggers for updated_at
CREATE TRIGGER update_admin_users_updated_at 
  BEFORE UPDATE ON admin_users 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_team_members_updated_at 
  BEFORE UPDATE ON team_members 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_performance_records_updated_at 
  BEFORE UPDATE ON performance_records 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- Insert default admin user
INSERT INTO admin_users (email, password_hash, name) VALUES
('vijay@edstellar.com', 'Edstellar@2025', 'Vijay');

-- Insert default designations
INSERT INTO designations (name, description) VALUES
('SEO Analyst', 'Entry-level SEO professional handling basic optimization tasks'),
('SEO Specialist', 'Mid-level SEO professional with specialized skills'),
('Content Writer', 'Professional focused on content creation and optimization'),
('Link Building Specialist', 'Professional specialized in link acquisition strategies'),
('Technical SEO Specialist', 'Professional focused on technical SEO implementations'),
('SEO Manager', 'Senior professional managing SEO teams and strategies'),
('Digital Marketing Specialist', 'Professional handling broader digital marketing tasks');

-- Insert default KPI definitions
INSERT INTO kpi_definitions (name, display_name, description, unit) VALUES
('outreaches', 'Monthly Outreaches', 'Number of outreach emails sent per month', 'emails'),
('live_links', 'Live Links', 'Number of successfully acquired backlinks', 'links'),
('high_da_links', 'High DA Backlinks (90+)', 'Backlinks from high domain authority sites', 'links'),
('content_distribution', 'Content Distribution', 'Number of content pieces distributed across channels', 'pieces'),
('new_blogs', 'New Blog Contributions', 'Number of new blog posts created', 'posts'),
('blog_optimizations', 'Blog Optimizations', 'Number of existing blog posts optimized', 'posts'),
('top_5_keywords', 'Top 5 Ranking Keywords', 'Keywords ranking in top 5 positions', 'keywords'),
('backlinks', 'Backlinks', 'Total backlinks acquired', 'links'),
('leads', 'Leads Generated', 'Number of leads generated', 'leads'),
('disavow', 'Disavow Links', 'Number of toxic links disavowed', 'links');

-- Insert default KPI targets for SEO Analyst
INSERT INTO kpi_targets (kpi_name, designation, monthly_target, annual_target) VALUES
('outreaches', 'SEO Analyst', 525, 6825),
('live_links', 'SEO Analyst', 15, 195),
('high_da_links', 'SEO Analyst', 3, 39),
('content_distribution', 'SEO Analyst', 8, 104),
('new_blogs', 'SEO Analyst', 10, 130),
('blog_optimizations', 'SEO Analyst', 5, 65),
('top_5_keywords', 'SEO Analyst', 3, 39);

-- Insert default KPI targets for SEO Specialist
INSERT INTO kpi_targets (kpi_name, designation, monthly_target, annual_target) VALUES
('outreaches', 'SEO Specialist', 400, 5200),
('live_links', 'SEO Specialist', 12, 156),
('high_da_links', 'SEO Specialist', 2, 26),
('content_distribution', 'SEO Specialist', 6, 78),
('new_blogs', 'SEO Specialist', 8, 104),
('blog_optimizations', 'SEO Specialist', 4, 52),
('top_5_keywords', 'SEO Specialist', 2, 26),
('backlinks', 'SEO Specialist', 12, 156),
('leads', 'SEO Specialist', 40, 520),
('disavow', 'SEO Specialist', 21, 273);

-- Insert sample team members
INSERT INTO team_members (name, email, designation, hire_date) VALUES
('Sarah Johnson', 'sarah.johnson@company.com', 'SEO Analyst', '2024-08-15'),
('Michael Chen', 'michael.chen@company.com', 'SEO Specialist', '2024-06-01'),
('Kiran Kumar', 'kiran@edstellar.com', 'SEO Analyst', '2024-09-01');

-- Create KPI column management functions
CREATE OR REPLACE FUNCTION add_kpi_column(column_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'performance_records' 
    AND column_name = add_kpi_column.column_name
  ) THEN
    EXECUTE format('ALTER TABLE performance_records ADD COLUMN %I integer DEFAULT 0', column_name);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION rename_kpi_column(old_column_name text, new_column_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'performance_records' 
    AND column_name = rename_kpi_column.old_column_name
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'performance_records' 
    AND column_name = rename_kpi_column.new_column_name
  ) THEN
    EXECUTE format('ALTER TABLE performance_records RENAME COLUMN %I TO %I', old_column_name, new_column_name);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION remove_kpi_column(column_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'performance_records' 
    AND column_name = remove_kpi_column.column_name
  ) THEN
    EXECUTE format('ALTER TABLE performance_records DROP COLUMN %I', column_name);
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION add_kpi_column(text) TO authenticated;
GRANT EXECUTE ON FUNCTION rename_kpi_column(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_kpi_column(text) TO authenticated;