import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qluewnanniwhcjlgvjof.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsdWV3bmFubml3aGNqbGd2am9mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2Mzk5NTMsImV4cCI6MjEwNjIxNTk1M30.R2G7kWttjUxauQl06vh9IHzEcMlt-ntGeODOrLwBBTc';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
