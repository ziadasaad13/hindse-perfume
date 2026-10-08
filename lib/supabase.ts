import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dcjbeqoopgnocbyryiql.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjamJlcW9vcGdub2NieXJ5aXFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyOTY4MDksImV4cCI6MjEwNjg3MjgwOX0.u-SFytVPlftfgkKcuZiyvo5ju4jyXoTeMVrHB-rCnOQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
