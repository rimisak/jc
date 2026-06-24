// ─────────────────────────────────────────────────────────────────────────────
//  Supabase connection settings
//
//  1. Go to your Supabase project → Settings (gear icon) → "API".
//  2. Copy the "Project URL" and the "anon public" key.
//  3. Paste them below, replacing the placeholder text.
//
//  The anon key is SAFE to put in public code — it is meant to be used in the
//  browser. Your data is protected by the Row Level Security rules you set up
//  in the SQL editor (see README.md).
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const SUPABASE_URL = 'https://cqagqxxwcagolsgyxqlz.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNxYWdxeHh3Y2Fnb2xzZ3l4cWx6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMjUzODgsImV4cCI6MjA5NzkwMTM4OH0.DZywe-YTFuweQ_JaaCDh_CO6rTQ8LNzWnzlKA0hRJOU';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
