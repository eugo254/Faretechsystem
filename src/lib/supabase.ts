import { createClient } from '@supabase/supabase-js';
import { toast } from 'react-hot-toast';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Utility function for handling Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  toast.error(error.message || 'An error occurred while connecting to the database');
  return null;
};