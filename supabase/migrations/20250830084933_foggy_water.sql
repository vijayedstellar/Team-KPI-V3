/*
  # Create Goal Records System

  1. New Tables
    - `goal_records` - Store goal progress records and status updates
      - `id` (uuid, primary key)
      - `goal_id` (text, references the goal name from localStorage)
      - `team_member_id` (uuid, foreign key to team_members)
      - `status` (text, goal status: not_started, in_progress, completed, on_hold, cancelled)
      - `comment` (text, status update comment)
      - `updated_by` (text, who made the update)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on goal_records table
    - Add policies for authenticated users to manage records

  3. Indexes
    - Create indexes for better performance on goal and team member lookups
*/

-- Create goal_records table
CREATE TABLE IF NOT EXISTS goal_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id text NOT NULL,
  team_member_id uuid REFERENCES team_members(id) ON DELETE CASCADE,
  status text DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'on_hold', 'cancelled')),
  comment text,
  updated_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(goal_id, team_member_id)
);

-- Enable RLS
ALTER TABLE goal_records ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all operations for goal_records" ON goal_records FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_goal_records_goal_id ON goal_records(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_records_team_member_id ON goal_records(team_member_id);
CREATE INDEX IF NOT EXISTS idx_goal_records_status ON goal_records(status);

-- Create updated_at trigger
CREATE TRIGGER update_goal_records_updated_at 
  BEFORE UPDATE ON goal_records 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE goal_records IS 'Store goal progress records and status updates for team members';
COMMENT ON COLUMN goal_records.goal_id IS 'References the goal name from localStorage goals';
COMMENT ON COLUMN goal_records.status IS 'Goal status: not_started, in_progress, completed, on_hold, cancelled';
COMMENT ON COLUMN goal_records.comment IS 'Status update comment or notes';
COMMENT ON COLUMN goal_records.updated_by IS 'Name of person who made the status update';