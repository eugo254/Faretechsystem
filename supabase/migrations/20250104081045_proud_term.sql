/*
  # Create fare transactions table

  1. New Tables
    - `fare_transactions`
      - `id` (uuid, primary key)
      - `from_location` (text, references locations)
      - `to_location` (text, references locations)
      - `amount` (integer)
      - `is_peak` (boolean)
      - `created_at` (timestamp)
  2. Security
    - Enable RLS on `fare_transactions` table
    - Add policy for public access
*/

CREATE TABLE IF NOT EXISTS fare_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_location text NOT NULL,
  to_location text NOT NULL,
  amount integer NOT NULL CHECK (amount >= 0),
  is_peak boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fare_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON fare_transactions FOR SELECT
  USING (true);

CREATE POLICY "Enable insert access for all users"
  ON fare_transactions FOR INSERT
  WITH CHECK (true);