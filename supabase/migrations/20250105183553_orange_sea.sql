/*
  # Add Fare Summation Table

  1. New Tables
    - `fare_summation`
      - `id` (uuid, primary key)
      - `total_amount` (integer)
      - `date` (date)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `fare_summation` table
    - Add policies for public access
*/

CREATE TABLE IF NOT EXISTS fare_summation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total_amount integer NOT NULL DEFAULT 0,
  date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fare_summation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users"
  ON fare_summation FOR SELECT
  USING (true);

CREATE POLICY "Enable insert access for all users"
  ON fare_summation FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
  ON fare_summation FOR UPDATE
  USING (true)
  WITH CHECK (true);