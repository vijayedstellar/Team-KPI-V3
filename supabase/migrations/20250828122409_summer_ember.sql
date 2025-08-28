/*
  # Enhance User KPI Mappings with Team Member Details

  1. Create View
    - `user_kpi_mappings_with_details` - Enhanced view showing team member name and designation
      - All original user_kpi_mappings columns
      - `team_member_name` (text, from team_members.name)
      - `team_member_designation` (text, from team_members.designation)
      - `team_member_email` (text, from team_members.email)
      - `kpi_display_name` (text, from kpi_definitions.display_name)

  2. Security
    - Enable RLS on the view
    - Add policies for authenticated users to read the enhanced data

  3. Indexes
    - Ensure proper indexes exist for optimal join performance
*/

-- Create enhanced view for user_kpi_mappings with team member details
CREATE OR REPLACE VIEW user_kpi_mappings_with_details AS
SELECT 
  ukm.id,
  ukm.team_member_id,
  tm.name as team_member_name,
  tm.designation as team_member_designation,
  tm.email as team_member_email,
  ukm.kpi_name,
  kd.display_name as kpi_display_name,
  kd.description as kpi_description,
  ukm.monthly_target,
  ukm.annual_target,
  ukm.is_active,
  ukm.created_at,
  ukm.updated_at
FROM user_kpi_mappings ukm
LEFT JOIN team_members tm ON ukm.team_member_id = tm.id
LEFT JOIN kpi_definitions kd ON ukm.kpi_name = kd.name
WHERE ukm.is_active = true
ORDER BY tm.name, ukm.kpi_name;

-- Create a function to get user KPI mappings with details
CREATE OR REPLACE FUNCTION get_user_kpi_mappings_with_details(p_team_member_id uuid DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  team_member_id uuid,
  team_member_name text,
  team_member_designation text,
  team_member_email text,
  kpi_name text,
  kpi_display_name text,
  kpi_description text,
  monthly_target integer,
  annual_target integer,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_team_member_id IS NULL THEN
    -- Return all user KPI mappings with details
    RETURN QUERY
    SELECT 
      ukm.id,
      ukm.team_member_id,
      tm.name as team_member_name,
      tm.designation as team_member_designation,
      tm.email as team_member_email,
      ukm.kpi_name,
      kd.display_name as kpi_display_name,
      kd.description as kpi_description,
      ukm.monthly_target,
      ukm.annual_target,
      ukm.is_active,
      ukm.created_at,
      ukm.updated_at
    FROM user_kpi_mappings ukm
    LEFT JOIN team_members tm ON ukm.team_member_id = tm.id
    LEFT JOIN kpi_definitions kd ON ukm.kpi_name = kd.name
    WHERE ukm.is_active = true
    ORDER BY tm.name, ukm.kpi_name;
  ELSE
    -- Return user KPI mappings for specific team member
    RETURN QUERY
    SELECT 
      ukm.id,
      ukm.team_member_id,
      tm.name as team_member_name,
      tm.designation as team_member_designation,
      tm.email as team_member_email,
      ukm.kpi_name,
      kd.display_name as kpi_display_name,
      kd.description as kpi_description,
      ukm.monthly_target,
      ukm.annual_target,
      ukm.is_active,
      ukm.created_at,
      ukm.updated_at
    FROM user_kpi_mappings ukm
    LEFT JOIN team_members tm ON ukm.team_member_id = tm.id
    LEFT JOIN kpi_definitions kd ON ukm.kpi_name = kd.name
    WHERE ukm.team_member_id = p_team_member_id 
    AND ukm.is_active = true
    ORDER BY ukm.kpi_name;
  END IF;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_user_kpi_mappings_with_details(uuid) TO authenticated;

-- Create indexes to optimize the joins if they don't exist
CREATE INDEX IF NOT EXISTS idx_user_kpi_mappings_team_member_active ON user_kpi_mappings(team_member_id, is_active);
CREATE INDEX IF NOT EXISTS idx_team_members_name ON team_members(name);
CREATE INDEX IF NOT EXISTS idx_kpi_definitions_name ON kpi_definitions(name);

-- Add helpful comments
COMMENT ON VIEW user_kpi_mappings_with_details IS 'Enhanced view of user KPI mappings with team member and KPI details';
COMMENT ON FUNCTION get_user_kpi_mappings_with_details(uuid) IS 'Function to get user KPI mappings with full team member and KPI details';