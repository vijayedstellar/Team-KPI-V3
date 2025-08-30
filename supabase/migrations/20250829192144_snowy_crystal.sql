/*
  # Create Goals Management System

  1. New Tables
    - `goals` - Store user goals and objectives
      - `id` (uuid, primary key)
      - `goal_name` (text, descriptive goal name)
      - `internal_name` (text, unique internal identifier)
      - `description` (text, goal description)
      - `deadline` (date, goal completion deadline)
      - `is_active` (boolean, whether goal is active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `user_goals` - Store user goal assignments
      - `id` (uuid, primary key)
      - `goal_id` (uuid, foreign key to goals)
      - `team_member_id` (uuid, foreign key to team_members)
      - `assigned_date` (date, when goal was assigned)
      - `status` (text, goal status: assigned, in_progress, completed, cancelled)
      - `notes` (text, additional notes)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage goals

  3. Indexes
    - Create indexes for better performance on goal and user lookups
*/

-- Create goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_name text NOT NULL,
  internal_name text UNIQUE NOT NULL,
  description text,
  deadline date,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_goals table for goal assignments
CREATE TABLE IF NOT EXISTS user_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid REFERENCES goals(id) ON DELETE CASCADE,
  team_member_id uuid REFERENCES team_members(id) ON DELETE CASCADE,
  assigned_date date DEFAULT CURRENT_DATE,
  status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(goal_id, team_member_id)
);

-- Enable RLS
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all operations for goals" ON goals FOR ALL USING (true);
CREATE POLICY "Enable all operations for user_goals" ON user_goals FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_goals_internal_name ON goals(internal_name);
CREATE INDEX IF NOT EXISTS idx_goals_active ON goals(is_active);
CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline);
CREATE INDEX IF NOT EXISTS idx_user_goals_goal_id ON user_goals(goal_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_team_member_id ON user_goals(team_member_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_status ON user_goals(status);

-- Create updated_at triggers
CREATE TRIGGER update_goals_updated_at 
  BEFORE UPDATE ON goals 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at 
  BEFORE UPDATE ON user_goals 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE goals IS 'Store organizational goals and objectives';
COMMENT ON TABLE user_goals IS 'Store goal assignments to team members';
COMMENT ON COLUMN goals.internal_name IS 'Unique internal identifier for the goal';
COMMENT ON COLUMN user_goals.status IS 'Goal assignment status: assigned, in_progress, completed, cancelled';