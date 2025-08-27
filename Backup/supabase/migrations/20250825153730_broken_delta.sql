/*
  # Add Dynamic KPI and Role Support

  1. New Tables
    - `roles` - Store available roles/designations
      - `id` (uuid, primary key)
      - `name` (text, unique role name)
      - `description` (text, role description)
      - `is_active` (boolean, whether role is active)
      - `created_at` (timestamp)

    - `kpi_definitions` - Store available KPI types
      - `id` (uuid, primary key)
      - `name` (text, unique KPI name)
      - `display_name` (text, human-readable name)
      - `description` (text, KPI description)
      - `unit` (text, measurement unit)
      - `is_active` (boolean, whether KPI is active)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on new tables
    - Add policies for authenticated users
*/

-- Create roles table
CREATE TABLE IF NOT EXISTS roles (
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

-- Insert default roles
INSERT INTO roles (name, description) VALUES
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
('content_pieces', 'Content Pieces', 'Total content pieces created', 'pieces'),
('blog_posts', 'Blog Posts', 'Blog posts written and published', 'posts'),
('content_optimizations', 'Content Optimizations', 'Existing content pieces optimized', 'pieces'),
('keyword_research', 'Keyword Research', 'Keyword research tasks completed', 'tasks'),
('social_posts', 'Social Media Posts', 'Social media content created', 'posts'),
('content_updates', 'Content Updates', 'Content pieces updated or refreshed', 'updates'),
('guest_posts', 'Guest Posts', 'Guest posts published on external sites', 'posts'),
('broken_link_fixes', 'Broken Link Fixes', 'Broken links identified and fixed', 'fixes'),
('resource_page_links', 'Resource Page Links', 'Links acquired from resource pages', 'links'),
('competitor_analysis', 'Competitor Analysis', 'Competitor analysis reports completed', 'reports'),
('technical_audits', 'Technical Audits', 'Technical SEO audits completed', 'audits'),
('site_speed_improvements', 'Site Speed Improvements', 'Site speed optimization tasks completed', 'improvements'),
('schema_implementations', 'Schema Implementations', 'Schema markup implementations', 'implementations'),
('crawl_error_fixes', 'Crawl Error Fixes', 'Crawl errors identified and fixed', 'fixes'),
('mobile_optimizations', 'Mobile Optimizations', 'Mobile optimization tasks completed', 'optimizations'),
('core_web_vitals_fixes', 'Core Web Vitals Fixes', 'Core Web Vitals improvements made', 'fixes'),
('structured_data_updates', 'Structured Data Updates', 'Structured data markup updates', 'updates')
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all operations for roles" ON roles FOR ALL USING (true);
CREATE POLICY "Enable all operations for kpi_definitions" ON kpi_definitions FOR ALL USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_roles_active ON roles(is_active);
CREATE INDEX IF NOT EXISTS idx_kpi_definitions_active ON kpi_definitions(is_active);