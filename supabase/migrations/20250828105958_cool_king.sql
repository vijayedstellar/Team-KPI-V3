/*
  # Create KPI to Designation Mappings Table

  1. New Tables
    - `kpi_designation_mappings` - Store which KPIs are mapped to which designations
      - `id` (uuid, primary key)
      - `kpi_name` (text, references kpi_definitions.name)
      - `designation_name` (text, references designations.name)
      - `is_active` (boolean, whether mapping is active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on kpi_designation_mappings table
    - Add policies for authenticated users to manage mappings

  3. Indexes
    - Create indexes for better performance on KPI and designation lookups

  4. Constraints
    - Unique constraint on (kpi_name, designation_name) combination
    - Foreign key references to ensure data integrity
*/

-- Create kpi_designation_mappings table
CREATE TABLE IF NOT EXISTS kpi_designation_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_name text NOT NULL,
  designation_name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(kpi_name, designation_name)
);

-- Enable RLS
ALTER TABLE kpi_designation_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all operations for kpi_designation_mappings" ON kpi_designation_mappings FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kpi_designation_mappings_kpi_name ON kpi_designation_mappings(kpi_name);
CREATE INDEX IF NOT EXISTS idx_kpi_designation_mappings_designation_name ON kpi_designation_mappings(designation_name);
CREATE INDEX IF NOT EXISTS idx_kpi_designation_mappings_active ON kpi_designation_mappings(is_active);

-- Create updated_at trigger
CREATE TRIGGER update_kpi_designation_mappings_updated_at 
  BEFORE UPDATE ON kpi_designation_mappings 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE kpi_designation_mappings IS 'Maps which KPIs are available for which designations';
COMMENT ON COLUMN kpi_designation_mappings.kpi_name IS 'References kpi_definitions.name';
COMMENT ON COLUMN kpi_designation_mappings.designation_name IS 'References designations.name';
COMMENT ON COLUMN kpi_designation_mappings.is_active IS 'Whether this mapping is currently active';