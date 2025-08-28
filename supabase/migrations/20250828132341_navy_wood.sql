/*
  # Add Support for Delivered/Not Delivered Unit Type

  1. Schema Updates
    - Update kpi_definitions table to support 'delivered' unit type
    - Add check constraint to ensure valid unit values
    - Update existing KPI definitions if needed

  2. Data Integrity
    - Ensure all existing KPIs maintain their current unit types
    - Add validation for delivered-type KPIs

  3. Comments
    - Add helpful documentation for the new unit type
*/

-- Add check constraint for valid unit types
DO $$
BEGIN
  -- Check if constraint already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'kpi_definitions' 
    AND constraint_name = 'kpi_definitions_unit_check'
  ) THEN
    ALTER TABLE kpi_definitions 
    ADD CONSTRAINT kpi_definitions_unit_check 
    CHECK (unit IN ('count', 'delivered'));
  END IF;
END $$;

-- Update the comment on the unit column to reflect new options
COMMENT ON COLUMN kpi_definitions.unit IS 'Unit type: count (numeric values) or delivered (boolean delivered/not delivered)';

-- Add helpful comments
COMMENT ON TABLE kpi_definitions IS 'KPI definitions supporting both numeric (count) and boolean (delivered) measurement types';

-- Example of how to create delivered-type KPIs:
-- INSERT INTO kpi_definitions (name, display_name, description, unit) VALUES
-- ('monthly_report', 'Monthly Report', 'Monthly performance report delivery', 'delivered'),
-- ('client_presentation', 'Client Presentation', 'Monthly client presentation delivery', 'delivered');