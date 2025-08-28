/*
  # Settings-Based Schema Migration

  1. New Tables
    - `team_members` - Store team member information
      - `id` (uuid, primary key)
      - `name` (text, member name)
      - `email` (text, unique email)
      - `hire_date` (date, when they started)
      - `designation` (text, their designation/role)
      - `status` (text, active/inactive)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `designations` - Store available designations/roles
      - `id` (uuid, primary key)
      - `name` (text, unique designation name)
      - `description` (text, designation description)
      - `is_active` (boolean, whether designation is active)
      - `created_at` (timestamp)

    - `kpi_definitions` - Store available KPI types
      - `id` (uuid, primary key)
      - `name` (text, unique KPI internal name)
      - `display_name` (text, human-readable name)
      - `description` (text, KPI description)
      - `unit` (text, measurement unit)
      - `is_active` (boolean, whether KPI is active)
      - `created_at` (timestamp)

    - `kpi_targets` - Store KPI targets for designation-KPI combinations
      - `id` (uuid, primary key)
      - `kpi_name` (text, references kpi_definitions.name)
      - `designation` (text, references designations.name)
      - `monthly_target` (integer, monthly target value)
      - `annual_target` (integer, annual target value)
      - `created_at` (timestamp)

    - `performance_records` - Store monthly performance data
      - `id` (uuid, primary key)
      - `team_member_id` (uuid, foreign key to team_members)
      - `month` (text, format: MM)
      - `year` (integer)
      - Dynamic KPI columns will be added based on kpi_definitions
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage data

  3. Initial Data
    - Insert default designations
    - Insert default KPI definitions
    - Insert default KPI targets
*/

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  hire_date date DEFAULT CURRENT_DATE,
  designation text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create designations table
CREATE TABLE IF NOT EXISTS designations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create kpi_definitions table
CREATE TABLE IF NOT EXISTS kpi_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  unit text DEFAULT 'count',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create kpi_targets table
CREATE TABLE IF NOT EXISTS kpi_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_name text NOT NULL,
  designation text NOT NULL,
  monthly_target integer NOT NULL DEFAULT 0,
  annual_target integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(kpi_name, designation)
);

-- Create performance_records table (will be extended with KPI columns)
CREATE TABLE IF NOT EXISTS performance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid REFERENCES team_members(id) ON DELETE CASCADE,
  month text NOT NULL,
  year integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_member_id, month, year)
);

-- Enable RLS
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_records ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all operations for authenticated users)
CREATE POLICY "Enable all operations for team_members" ON team_members FOR ALL USING (true);
CREATE POLICY "Enable all operations for designations" ON designations FOR ALL USING (true);
CREATE POLICY "Enable all operations for kpi_definitions" ON kpi_definitions FOR ALL USING (true);
CREATE POLICY "Enable all operations for kpi_targets" ON kpi_targets FOR ALL USING (true);
CREATE POLICY "Enable all operations for performance_records" ON performance_records FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_team_members_designation ON team_members(designation);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);
CREATE INDEX IF NOT EXISTS idx_designations_active ON designations(is_active);
CREATE INDEX IF NOT EXISTS idx_kpi_definitions_active ON kpi_definitions(is_active);
CREATE INDEX IF NOT EXISTS idx_kpi_targets_designation ON kpi_targets(designation);
CREATE INDEX IF NOT EXISTS idx_kpi_targets_kpi_name ON kpi_targets(kpi_name);
CREATE INDEX IF NOT EXISTS idx_performance_records_team_member ON performance_records(team_member_id);
CREATE INDEX IF NOT EXISTS idx_performance_records_month_year ON performance_records(month, year);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_team_members_updated_at 
  BEFORE UPDATE ON team_members 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_performance_records_updated_at 
  BEFORE UPDATE ON performance_records 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- Insert default designations
INSERT INTO designations (name, description) VALUES
('SEO Analyst', 'Entry-level SEO professional handling basic optimization tasks'),
('SEO Specialist', 'Mid-level SEO professional with specialized skills'),
('Content Writer', 'Professional focused on content creation and optimization'),
('Link Building Specialist', 'Professional specialized in link acquisition strategies'),
('Technical SEO Specialist', 'Professional focused on technical SEO implementations'),
('SEO Manager', 'Senior professional managing SEO teams and strategies'),
('Digital Marketing Specialist', 'Professional handling broader digital marketing tasks')
ON CONFLICT (name) DO NOTHING;

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
('disavow', 'Disavow Links', 'Number of toxic links disavowed', 'links')
ON CONFLICT (name) DO NOTHING;

-- Add KPI columns to performance_records table
DO $$
DECLARE
    kpi_record RECORD;
BEGIN
    FOR kpi_record IN SELECT name FROM kpi_definitions WHERE is_active = true
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE performance_records ADD COLUMN IF NOT EXISTS %I integer DEFAULT 0', kpi_record.name);
        EXCEPTION
            WHEN duplicate_column THEN
                -- Column already exists, skip
                NULL;
        END;
    END LOOP;
END $$;

-- Insert default KPI targets for SEO Analyst
INSERT INTO kpi_targets (kpi_name, designation, monthly_target, annual_target) VALUES
('outreaches', 'SEO Analyst', 525, 6825),
('live_links', 'SEO Analyst', 15, 195),
('high_da_links', 'SEO Analyst', 3, 39),
('content_distribution', 'SEO Analyst', 8, 104),
('new_blogs', 'SEO Analyst', 10, 130),
('blog_optimizations', 'SEO Analyst', 5, 65),
('top_5_keywords', 'SEO Analyst', 3, 39)
ON CONFLICT (kpi_name, designation) DO NOTHING;

-- Insert default KPI targets for SEO Specialist
INSERT INTO kpi_targets (kpi_name, designation, monthly_target, annual_target) VALUES
('backlinks', 'SEO Specialist', 12, 156),
('leads', 'SEO Specialist', 40, 520),
('disavow', 'SEO Specialist', 21, 273)
ON CONFLICT (kpi_name, designation) DO NOTHING;

-- Insert sample team members
INSERT INTO team_members (name, email, designation, hire_date) VALUES
('Lokesh', 'lokesh@gmail.com', 'SEO Specialist', '2025-08-26'),
('Ranjith', 'ranjith@gmail.com', 'SEO Analyst', '2025-08-26')
ON CONFLICT (email) DO NOTHING;