import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://irwiiyowpppdynbmwwuz.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlyd2lpeW93cHBwZHluYm13d3V6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1OTcxMjgsImV4cCI6MjEwMDE3MzEyOH0.8elv_oyDRdDi59krGr6xlD_sLzYZsT2GP4WuFKOj2fM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
