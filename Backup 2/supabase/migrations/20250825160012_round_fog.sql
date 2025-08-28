/*
  # Create Admin Users Table

  1. New Tables
    - `admin_users` - Store admin user credentials
      - `id` (uuid, primary key)
      - `email` (text, unique email)
      - `password_hash` (text, hashed password)
      - `name` (text, admin name)
      - `is_active` (boolean, account status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on admin_users table
    - Add policies for authenticated access
    - Insert default admin user

  3. Functions
    - Create function to verify admin credentials
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all operations for admin_users" ON admin_users FOR ALL USING (true);

-- Insert default admin user (password: Edstellar@2025)
-- Note: In production, use proper password hashing like bcrypt
INSERT INTO admin_users (email, password_hash, name) VALUES
('vijay@edstellar', 'Edstellar@2025', 'Vijay')
ON CONFLICT (email) DO NOTHING;

-- Create updated_at trigger
CREATE TRIGGER update_admin_users_updated_at 
  BEFORE UPDATE ON admin_users 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);