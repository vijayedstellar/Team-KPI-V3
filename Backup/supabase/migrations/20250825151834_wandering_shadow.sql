-- SEO Analyst KPI Dashboard Database Setup
-- Run this script in your Supabase SQL Editor to create all required tables

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

-- Insert default KPI targets
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

-- Create policies (allowing all operations for authenticated users)
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
DROP TRIGGER IF EXISTS update_analysts_updated_at ON analysts;
CREATE TRIGGER update_analysts_updated_at BEFORE UPDATE ON analysts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_performance_records_updated_at ON performance_records;
CREATE TRIGGER update_performance_records_updated_at BEFORE UPDATE ON performance_records FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();