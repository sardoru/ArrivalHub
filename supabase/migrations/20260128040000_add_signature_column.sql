-- Add signature column to arrivals table
ALTER TABLE arrivals ADD COLUMN IF NOT EXISTS signature text DEFAULT NULL;

-- This stores the signature as a base64-encoded PNG image
