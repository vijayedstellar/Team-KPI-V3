/*
  # SEO Analyst KPI Dashboard Schema

  1. New Tables
    - `analysts` - Store SEO analyst information
      - `id` (uuid, primary key)
      - `name` (text, analyst name)
      - `email` (text, unique email)
      - `hire_date` (date, when they started)
      - `department` (text, their department)
      - `status` (text, active/inactive)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `performance_records` - Store monthly performance data
      - `id` (uuid, primary key)
      - `analyst_id` (uuid, foreign key to analysts)
      - `month` (text, format: YYYY-MM)
      - `year` (integer)
      - `outreaches` (integer)
      - `live_links` (integer)
      - `high_da_links` (integer)
      - `content_distribution` (integer)
      - `new_blogs` (integer)
      - `blog_optimizations` (integer)
      - `top_5_keywords` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `kpi_targets` - Store target values for KPIs
      - `id` (uuid, primary key)
      - `kpi_name` (text)
      - `monthly_target` (integer)
      - `annual_target` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage data
*/

-- Create analysts table
CREATE TABLE IF NOT EXISTS analysts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  hire_date date DEFAULT CURRENT_DATE,
  department text DEFAULT 'SEO',
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create performance_records table
CREATE TABLE IF NOT EXISTS performance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  analyst_id uuid REFERENCES analysts(id) ON DELETE CASCADE,
  month text NOT NULL,
  year integer NOT NULL,
  outreaches integer DEFAULT 0,
  live_links integer DEFAULT 0,
  high_da_links integer DEFAULT 0,
  content_distribution integer DEFAULT 0,
  new_blogs integer DEFAULT 0,
  blog_optimizations integer DEFAULT 0,
  top_5_keywords integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(analyst_id, month, year)
);

-- Create kpi_targets table
CREATE TABLE IF NOT EXISTS kpi_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_name text NOT NULL UNIQUE,
  monthly_target integer NOT NULL,
  annual_target integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Insert default KPI targets based on the provided data
INSERT INTO kpi_targets (kpi_name, monthly_target, annual_target) VALUES
('outreaches', 525, 6825),
('live_links', 15, 195),
('high_da_links', 3, 39),
('content_distribution', 8, 104),
('new_blogs', 10, 130),
('blog_optimizations', 5, 65),
('top_5_keywords', 3, 39)
ON CONFLICT (kpi_name) DO NOTHING;

-- Enable RLS
ALTER TABLE analysts ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_targets ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all operations for now - adjust based on your auth requirements)
CREATE POLICY "Enable all operations for analysts" ON analysts FOR ALL USING (true);
CREATE POLICY "Enable all operations for performance_records" ON performance_records FOR ALL USING (true);
CREATE POLICY "Enable all operations for kpi_targets" ON kpi_targets FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_performance_records_analyst_id ON performance_records(analyst_id);
CREATE INDEX IF NOT EXISTS idx_performance_records_month_year ON performance_records(month, year);
CREATE INDEX IF NOT EXISTS idx_analysts_status ON analysts(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_analysts_updated_at BEFORE UPDATE ON analysts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_performance_records_updated_at BEFORE UPDATE ON performance_records FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();