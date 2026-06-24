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

export const SUPABASE_URL = 'PASTE_YOUR_PROJECT_URL_HERE';
export const SUPABASE_ANON_KEY = 'PASTE_YOUR_ANON_PUBLIC_KEY_HERE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
