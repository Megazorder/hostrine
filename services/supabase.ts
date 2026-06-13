import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[Supabase] Initializing client...');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase] Fatal Error: Missing Supabase environment variables');
  console.log('[Supabase] VITE_SUPABASE_URL exists:', !!supabaseUrl);
  console.log('[Supabase] VITE_SUPABASE_ANON_KEY exists:', !!supabaseAnonKey);
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('[Supabase] Client initialized successfully.');
