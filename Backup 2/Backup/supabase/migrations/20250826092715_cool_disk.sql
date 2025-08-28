/*
  # Add Dynamic KPI Column Management Functions

  1. Functions
    - `add_kpi_column` - Adds a new KPI column to performance_records
    - `rename_kpi_column` - Renames an existing KPI column
    - `remove_kpi_column` - Removes a KPI column from performance_records

  2. Security
    - Functions are available to authenticated users
    - Proper error handling for column operations
*/

-- Function to add a new KPI column
CREATE OR REPLACE FUNCTION add_kpi_column(column_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if column already exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'performance_records' 
    AND column_name = add_kpi_column.column_name
  ) THEN
    -- Add the column with default value 0
    EXECUTE format('ALTER TABLE performance_records ADD COLUMN %I integer DEFAULT 0', column_name);
  END IF;
END;
$$;

-- Function to rename a KPI column
CREATE OR REPLACE FUNCTION rename_kpi_column(old_column_name text, new_column_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if old column exists and new column doesn't
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'performance_records' 
    AND column_name = old_column_name
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'performance_records' 
    AND column_name = new_column_name
  ) THEN
    -- Rename the column
    EXECUTE format('ALTER TABLE performance_records RENAME COLUMN %I TO %I', old_column_name, new_column_name);
  END IF;
END;
$$;

-- Function to remove a KPI column
CREATE OR REPLACE FUNCTION remove_kpi_column(column_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'performance_records' 
    AND column_name = remove_kpi_column.column_name
  ) THEN
    -- Remove the column
    EXECUTE format('ALTER TABLE performance_records DROP COLUMN %I', column_name);
  END IF;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION add_kpi_column(text) TO authenticated;
GRANT EXECUTE ON FUNCTION rename_kpi_column(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_kpi_column(text) TO authenticated;