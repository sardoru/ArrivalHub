/*
  # Update RLS Policies for Arrivals

  1. Changes
    - Drop existing restrictive date-based policies
    - Create new policies that allow access to recent arrivals (within 2 days)
    - This fixes timezone mismatch issues between client and database

  2. Security
    - Still restricts anonymous access to only recent arrivals
    - Prevents access to historical data beyond 2 days
*/

DROP POLICY IF EXISTS "Allow anonymous read access to arrivals" ON arrivals;
DROP POLICY IF EXISTS "Allow anonymous insert access to arrivals" ON arrivals;
DROP POLICY IF EXISTS "Allow anonymous update access to arrivals" ON arrivals;
DROP POLICY IF EXISTS "Allow anonymous delete access to arrivals" ON arrivals;

CREATE POLICY "Allow anonymous read access to arrivals"
  ON arrivals FOR SELECT
  TO anon
  USING (arrival_date >= CURRENT_DATE - INTERVAL '1 day' AND arrival_date <= CURRENT_DATE + INTERVAL '1 day');

CREATE POLICY "Allow anonymous insert access to arrivals"
  ON arrivals FOR INSERT
  TO anon
  WITH CHECK (arrival_date >= CURRENT_DATE - INTERVAL '1 day' AND arrival_date <= CURRENT_DATE + INTERVAL '1 day');

CREATE POLICY "Allow anonymous update access to arrivals"
  ON arrivals FOR UPDATE
  TO anon
  USING (arrival_date >= CURRENT_DATE - INTERVAL '1 day' AND arrival_date <= CURRENT_DATE + INTERVAL '1 day')
  WITH CHECK (arrival_date >= CURRENT_DATE - INTERVAL '1 day' AND arrival_date <= CURRENT_DATE + INTERVAL '1 day');

CREATE POLICY "Allow anonymous delete access to arrivals"
  ON arrivals FOR DELETE
  TO anon
  USING (arrival_date >= CURRENT_DATE - INTERVAL '1 day' AND arrival_date <= CURRENT_DATE + INTERVAL '1 day');
