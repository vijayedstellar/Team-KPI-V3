/*
  # Create User-Specific KPI Mappings System

  1. New Tables
    - `user_kpi_mappings` - Store user-specific KPI assignments and targets
      - `id` (uuid, primary key)
      - `team_member_id` (uuid, foreign key to team_members)
      - `kpi_name` (text, references kpi_definitions.name)
      - `monthly_target` (integer, user-specific monthly target)
      - `annual_target` (integer, user-specific annual target)
      - `is_active` (boolean, whether mapping is active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on user_kpi_mappings table
    - Add policies for authenticated users to manage mappings

  3. Indexes
    - Create indexes for better performance on user and KPI lookups

  4. Functions
    - Create helper functions for target resolution (user-specific vs designation fallback)
*/

-- Create user_kpi_mappings table
CREATE TABLE IF NOT EXISTS user_kpi_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_member_id uuid REFERENCES team_members(id) ON DELETE CASCADE,
  kpi_name text NOT NULL,
  monthly_target integer DEFAULT 0,
  annual_target integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(team_member_id, kpi_name)
);

-- Enable RLS
ALTER TABLE user_kpi_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all operations for user_kpi_mappings" ON user_kpi_mappings FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_kpi_mappings_team_member ON user_kpi_mappings(team_member_id);
CREATE INDEX IF NOT EXISTS idx_user_kpi_mappings_kpi_name ON user_kpi_mappings(kpi_name);
CREATE INDEX IF NOT EXISTS idx_user_kpi_mappings_active ON user_kpi_mappings(is_active);

-- Create updated_at trigger
CREATE TRIGGER update_user_kpi_mappings_updated_at 
  BEFORE UPDATE ON user_kpi_mappings 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- Create function to get effective targets for a user (user-specific overrides designation)
CREATE OR REPLACE FUNCTION get_effective_targets_for_user(p_team_member_id uuid)
RETURNS TABLE (
  kpi_name text,
  monthly_target integer,
  annual_target integer,
  source text -- 'user' or 'designation'
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_designation text;
BEGIN
  -- Get user's designation
  SELECT designation INTO user_designation 
  FROM team_members 
  WHERE id = p_team_member_id;
  
  -- Return user-specific targets with designation fallbacks
  RETURN QUERY
  WITH user_targets AS (
    SELECT 
      ukm.kpi_name,
      ukm.monthly_target,
      ukm.annual_target,
      'user'::text as source
    FROM user_kpi_mappings ukm
    WHERE ukm.team_member_id = p_team_member_id 
    AND ukm.is_active = true
  ),
  designation_targets AS (
    SELECT 
      kt.kpi_name,
      kt.monthly_target,
      kt.annual_target,
      'designation'::text as source
    FROM kpi_targets kt
    WHERE kt.designation = user_designation
  )
  SELECT 
    COALESCE(ut.kpi_name, dt.kpi_name) as kpi_name,
    COALESCE(ut.monthly_target, dt.monthly_target) as monthly_target,
    COALESCE(ut.annual_target, dt.annual_target) as annual_target,
    COALESCE(ut.source, dt.source) as source
  FROM designation_targets dt
  FULL OUTER JOIN user_targets ut ON dt.kpi_name = ut.kpi_name
  WHERE COALESCE(ut.kpi_name, dt.kpi_name) IS NOT NULL;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_effective_targets_for_user(uuid) TO authenticated;

-- Add helpful comments
COMMENT ON TABLE user_kpi_mappings IS 'User-specific KPI mappings that override designation-level targets';
COMMENT ON FUNCTION get_effective_targets_for_user(uuid) IS 'Returns effective targets for a user (user-specific overrides designation defaults)';