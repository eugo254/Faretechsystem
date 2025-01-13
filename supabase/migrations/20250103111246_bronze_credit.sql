/*
  # Fix price settings policies

  1. Changes
    - Update RLS policies to allow public access for now
    - Later we can add proper authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read price settings" ON price_settings;
DROP POLICY IF EXISTS "Users can insert price settings" ON price_settings;
DROP POLICY IF EXISTS "Users can update price settings" ON price_settings;
DROP POLICY IF EXISTS "Users can delete price settings" ON price_settings;

-- Create new policies that allow public access
CREATE POLICY "Enable read access for all users"
  ON price_settings FOR SELECT
  USING (true);

CREATE POLICY "Enable insert access for all users"
  ON price_settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
  ON price_settings FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for all users"
  ON price_settings FOR DELETE
  USING (true);