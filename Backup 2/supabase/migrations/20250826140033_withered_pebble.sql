@@ .. @@
-- Create KPI column management functions
CREATE OR REPLACE FUNCTION add_kpi_column(p_column_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'performance_records' 
    AND column_name = p_column_name
  ) THEN
    EXECUTE format('ALTER TABLE performance_records ADD COLUMN %I integer DEFAULT 0', p_column_name);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION rename_kpi_column(p_old_column_name text, p_new_column_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'performance_records' 
    AND column_name = p_old_column_name
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'performance_records' 
    AND column_name = p_new_column_name
  ) THEN
    EXECUTE format('ALTER TABLE performance_records RENAME COLUMN %I TO %I', p_old_column_name, p_new_column_name);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION remove_kpi_column(p_column_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'performance_records' 
    AND column_name = p_column_name
  ) THEN
    EXECUTE format('ALTER TABLE performance_records DROP COLUMN %I', p_column_name);
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION add_kpi_column(text) TO authenticated;
GRANT EXECUTE ON FUNCTION rename_kpi_column(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_kpi_column(text) TO authenticated;