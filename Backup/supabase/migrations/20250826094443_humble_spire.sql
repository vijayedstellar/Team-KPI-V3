/*
  # Add Missing KPI Columns to Performance Records

  1. New Columns
    - Add 'disavow' column to performance_records table
    - Add 'backlinks' column to performance_records table  
    - Add 'leads' column to performance_records table
    - Ensure all KPI columns from kpi_definitions exist

  2. Safety
    - Use IF NOT EXISTS to prevent errors if columns already exist
    - Set default values to 0 for consistency
*/

-- Add missing KPI columns to performance_records table
DO $$
BEGIN
  -- Add disavow column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'performance_records' AND column_name = 'disavow'
  ) THEN
    ALTER TABLE performance_records ADD COLUMN disavow integer DEFAULT 0;
  END IF;

  -- Add backlinks column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'performance_records' AND column_name = 'backlinks'
  ) THEN
    ALTER TABLE performance_records ADD COLUMN backlinks integer DEFAULT 0;
  END IF;

  -- Add leads column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'performance_records' AND column_name = 'leads'
  ) THEN
    ALTER TABLE performance_records ADD COLUMN leads integer DEFAULT 0;
  END IF;
END $$;