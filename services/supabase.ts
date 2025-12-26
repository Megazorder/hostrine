import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kvwcobdobesjzgueimvp.supabase.co';
const supabaseAnonKey = 'sb_publishable_sJzeeVwRcOt61Q7JG7WwUQ_JwpYxtZa';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);