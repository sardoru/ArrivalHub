import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Arrival = {
  id: string;
  last_name: string;
  first_name: string;
  unit_number: string;
  notes: string;
  status: 'pending' | 'checked-in' | 'no-show';
  arrival_date: string;
  created_at: string;
  updated_at: string;
  // Guest sign-in fields
  guest_phone: string;
  guest_email: string;
  signed_in_at: string | null;
  rules_accepted: boolean;
  id_verified: boolean;
  signature: string | null;
  // Flag fields
  is_flagged: boolean;
  flag_reason: string;
};
