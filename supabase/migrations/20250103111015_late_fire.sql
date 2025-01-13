/*
  # Create price settings table

  1. New Tables
    - `price_settings`
      - `id` (uuid, primary key)
      - `from_id` (text, references locations)
      - `to_id` (text, references locations)
      - `peak_price` (integer)
      - `off_peak_price` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `price_settings` table
    - Add policies for authenticated users to manage their price settings
*/

CREATE TABLE IF NOT EXISTS price_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id text NOT NULL,
  to_id text NOT NULL,
  peak_price integer NOT NULL CHECK (peak_price >= 0),
  off_peak_price integer NOT NULL CHECK (off_peak_price >= 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(from_id, to_id)
);

ALTER TABLE price_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read price settings"
  ON price_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert price settings"
  ON price_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update price settings"
  ON price_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete price settings"
  ON price_settings
  FOR DELETE
  TO authenticated
  USING (true);