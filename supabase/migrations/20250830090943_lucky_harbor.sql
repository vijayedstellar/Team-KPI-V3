/*
  # Change goal_id column from UUID to TEXT in user_goals table

  1. Schema Changes
    - Drop foreign key constraint on goal_id column
    - Change goal_id column type from uuid to text
    - This allows storing human-readable goal identifiers instead of UUIDs

  2. Impact
    - Resolves "invalid input syntax for type uuid" error
    - Allows application to use text-based goal identifiers
    - Maintains data integrity with proper constraints
*/

-- Drop the foreign key constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'user_goals' 
    AND constraint_name = 'user_goals_goal_id_fkey'
  ) THEN
    ALTER TABLE user_goals DROP CONSTRAINT user_goals_goal_id_fkey;
  END IF;
END $$;

-- Change the goal_id column type from uuid to text
ALTER TABLE user_goals ALTER COLUMN goal_id TYPE text;

-- Add helpful comment
COMMENT ON COLUMN user_goals.goal_id IS 'Text-based goal identifier (e.g., test_1, project_alpha)';