/*
  # Fix Security Issues

  1. Changes
    - Drop unused index `idx_arrivals_status`
    - Fix mutable search_path on `update_updated_at_column` function by setting explicit search_path

  2. Security
    - Setting search_path to empty string prevents search path injection attacks
*/

DROP INDEX IF EXISTS idx_arrivals_status;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
