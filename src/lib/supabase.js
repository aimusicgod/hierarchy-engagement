import { createClient } from '@supabase/supabase-js'

// Keys come from environment variables - NEVER hardcoded here
// In development: put them in .env.local (not committed to GitHub)
// In Vercel: add them in Project Settings → Environment Variables
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    'Missing Supabase environment variables.\n' +
    'Create a .env.local file with:\n' +
    'REACT_APP_SUPABASE_URL=your-url\n' +
    'REACT_APP_SUPABASE_ANON_KEY=your-key'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
