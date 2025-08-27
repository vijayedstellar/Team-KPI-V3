/*
  # Rename role column to designation in kpi_targets table

  1. Schema Changes
    - Rename `role` column to `designation` in `kpi_targets` table
    - This aligns the database schema with the application code expectations

  2. Impact
    - Resolves the "column kpi_targets.designation does not exist" error
    - Maintains data integrity during the column rename operation
    - No data loss occurs during this operation
*/

-- Rename the role column to designation in kpi_targets table
ALTER TABLE kpi_targets RENAME COLUMN role TO designation;