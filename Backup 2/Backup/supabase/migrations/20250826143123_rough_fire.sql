/*
  # Clean All Settings Data for Fresh Start

  This migration safely removes all settings-related data while preserving:
  - Database schema and structure
  - Admin user accounts for continued access
  - All table relationships and constraints

  ## What gets deleted:
  1. All performance records (to avoid foreign key constraints)
  2. All KPI targets and mappings
  3. All team members
  4. All KPI definitions
  5. All designations/roles

  ## What gets preserved:
  - admin_users table (login access maintained)
  - All table structures and relationships
  - All functions and triggers
  - All indexes and constraints

  ## Usage:
  Run this migration when you want to start fresh with clean settings data.
  After running, follow the instructions in Settings → Instructions tab.
*/

-- Step 1: Delete performance records first (due to foreign key constraints)
-- This prevents cascade deletion issues
DELETE FROM performance_records;
TRUNCATE performance_records RESTART IDENTITY CASCADE;

-- Step 2: Delete KPI targets (references both KPIs and designations)
DELETE FROM kpi_targets;
TRUNCATE kpi_targets RESTART IDENTITY CASCADE;

-- Step 3: Delete team members (references designations)
DELETE FROM team_members;
TRUNCATE team_members RESTART IDENTITY CASCADE;

-- Step 4: Delete KPI definitions (no dependencies)
DELETE FROM kpi_definitions;
TRUNCATE kpi_definitions RESTART IDENTITY CASCADE;

-- Step 5: Delete designations/roles (no dependencies)
DELETE FROM designations;
TRUNCATE designations RESTART IDENTITY CASCADE;

-- Step 6: Reset sequences to start from 1
-- This ensures clean, sequential IDs when recreating data
SELECT setval(pg_get_serial_sequence('team_members', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('designations', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('kpi_definitions', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('kpi_targets', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('performance_records', 'id'), 1, false);

-- Step 7: Verify cleanup completed successfully
-- This query should return 0 for all tables except admin_users
DO $$
DECLARE
    team_count INTEGER;
    designation_count INTEGER;
    kpi_count INTEGER;
    target_count INTEGER;
    performance_count INTEGER;
    admin_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO team_count FROM team_members;
    SELECT COUNT(*) INTO designation_count FROM designations;
    SELECT COUNT(*) INTO kpi_count FROM kpi_definitions;
    SELECT COUNT(*) INTO target_count FROM kpi_targets;
    SELECT COUNT(*) INTO performance_count FROM performance_records;
    SELECT COUNT(*) INTO admin_count FROM admin_users;
    
    -- Log cleanup results
    RAISE NOTICE 'Data cleanup completed successfully:';
    RAISE NOTICE '  - Team members: % records removed', team_count;
    RAISE NOTICE '  - Designations: % records removed', designation_count;
    RAISE NOTICE '  - KPI definitions: % records removed', kpi_count;
    RAISE NOTICE '  - KPI targets: % records removed', target_count;
    RAISE NOTICE '  - Performance records: % records removed', performance_count;
    RAISE NOTICE '  - Admin users: % records preserved', admin_count;
    
    -- Verify all settings tables are empty
    IF team_count = 0 AND designation_count = 0 AND kpi_count = 0 AND target_count = 0 AND performance_count = 0 THEN
        RAISE NOTICE 'SUCCESS: All settings data cleaned successfully!';
        RAISE NOTICE 'You can now create fresh data following the instructions in Settings → Instructions tab.';
    ELSE
        RAISE EXCEPTION 'ERROR: Data cleanup incomplete. Some records may still exist.';
    END IF;
    
    -- Ensure admin access is preserved
    IF admin_count = 0 THEN
        RAISE EXCEPTION 'CRITICAL ERROR: No admin users found! Login access may be lost.';
    END IF;
END $$;

-- Step 8: Add helpful comment for future reference
COMMENT ON TABLE team_members IS 'Team members table - cleaned and ready for fresh data';
COMMENT ON TABLE designations IS 'Designations/roles table - cleaned and ready for fresh data';
COMMENT ON TABLE kpi_definitions IS 'KPI definitions table - cleaned and ready for fresh data';
COMMENT ON TABLE kpi_targets IS 'KPI targets table - cleaned and ready for fresh data';
COMMENT ON TABLE performance_records IS 'Performance records table - cleaned and ready for fresh data';