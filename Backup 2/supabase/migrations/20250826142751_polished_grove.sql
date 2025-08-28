/*
  # Clean All Settings Data for Fresh Start

  1. Data Cleanup
    - Remove all performance records (to avoid foreign key constraints)
    - Remove all KPI targets
    - Remove all team members
    - Remove all KPI definitions
    - Remove all designations
    - Keep admin users intact

  2. Reset Auto-increment Sequences
    - Reset any sequences to start fresh

  3. Verification
    - Ensure all tables are empty except admin_users
*/

-- Step 1: Delete all performance records first (due to foreign key constraints)
DELETE FROM performance_records;

-- Step 2: Delete all KPI targets
DELETE FROM kpi_targets;

-- Step 3: Delete all team members
DELETE FROM team_members;

-- Step 4: Delete all KPI definitions
DELETE FROM kpi_definitions;

-- Step 5: Delete all designations
DELETE FROM designations;

-- Step 6: Reset sequences if they exist (PostgreSQL auto-generates these)
-- This ensures clean IDs when recreating data
SELECT setval(pg_get_serial_sequence('team_members', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('designations', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('kpi_definitions', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('kpi_targets', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('performance_records', 'id'), 1, false);

-- Step 7: Verify cleanup (these should all return 0)
-- Uncomment to check during development
-- SELECT 'team_members' as table_name, count(*) as remaining_records FROM team_members
-- UNION ALL
-- SELECT 'designations', count(*) FROM designations
-- UNION ALL
-- SELECT 'kpi_definitions', count(*) FROM kpi_definitions
-- UNION ALL
-- SELECT 'kpi_targets', count(*) FROM kpi_targets
-- UNION ALL
-- SELECT 'performance_records', count(*) FROM performance_records;

-- Note: admin_users table is preserved to maintain login access