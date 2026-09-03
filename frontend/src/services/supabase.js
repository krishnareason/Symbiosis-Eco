import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'your_supabase_url_here';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your_supabase_anon_key_here';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
