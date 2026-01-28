/*
  # Add Guest Sign-In Columns

  1. New Columns
    - `guest_phone` (text) - Guest's phone number from sign-in form
    - `guest_email` (text) - Guest's email from sign-in form
    - `signed_in_at` (timestamptz) - Timestamp when guest signed in on iPad
    - `rules_accepted` (boolean) - Whether guest accepted building rules
    - `id_verified` (boolean) - Whether front desk verified guest's ID

  2. Purpose
    - Enable guest self-service sign-in on iPad
    - Track sign-in status for admin panel highlighting
    - Enforce ID verification before check-in
*/

ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS guest_phone text DEFAULT '';
ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS guest_email text DEFAULT '';
ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS signed_in_at timestamptz DEFAULT NULL;
ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS rules_accepted boolean DEFAULT false;
ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS id_verified boolean DEFAULT false;
ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS is_flagged boolean DEFAULT false;
ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS flag_reason text DEFAULT '';
