/*
  # Create Arrivals Table for Front Desk Management

  1. New Tables
    - `arrivals`
      - `id` (uuid, primary key) - Unique identifier for each arrival
      - `last_name` (text, not null) - Guest's last name (stored uppercase)
      - `first_name` (text) - Guest's first name (stored uppercase)
      - `unit_number` (text, not null) - Unit/room number
      - `notes` (text) - Optional notes (VIP, late arrival, etc.)
      - `status` (text) - Arrival status: 'pending', 'checked-in', 'no-show'
      - `arrival_date` (date) - The date of expected arrival
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `arrivals` table
    - Add policy for anonymous users to perform CRUD operations (front desk kiosk access)

  3. Indexes
    - Index on `arrival_date` for efficient daily queries
    - Index on `status` for filtering
*/

CREATE TABLE IF NOT EXISTS arrivals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  last_name text NOT NULL,
  first_name text DEFAULT '',
  unit_number text NOT NULL,
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'checked-in', 'no-show')),
  arrival_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_arrivals_arrival_date ON arrivals(arrival_date);
CREATE INDEX IF NOT EXISTS idx_arrivals_status ON arrivals(status);

ALTER TABLE arrivals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access to arrivals"
  ON arrivals FOR SELECT
  TO anon
  USING (arrival_date = CURRENT_DATE);

CREATE POLICY "Allow anonymous insert access to arrivals"
  ON arrivals FOR INSERT
  TO anon
  WITH CHECK (arrival_date = CURRENT_DATE);

CREATE POLICY "Allow anonymous update access to arrivals"
  ON arrivals FOR UPDATE
  TO anon
  USING (arrival_date = CURRENT_DATE)
  WITH CHECK (arrival_date = CURRENT_DATE);

CREATE POLICY "Allow anonymous delete access to arrivals"
  ON arrivals FOR DELETE
  TO anon
  USING (arrival_date = CURRENT_DATE);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_arrivals_updated_at
  BEFORE UPDATE ON arrivals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
