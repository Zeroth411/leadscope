import { createClient } from '@supabase/supabase-js';

// ============================================
// Secure Supabase Client — Server-Side Only
// ============================================
// Uses ONLY environment variables. No hardcoded secrets.
// The service role key grants admin access and must NEVER
// be exposed to the frontend or committed to version control.
// ============================================

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    '[supabase] FATAL: Missing Supabase configuration.\n' +
    '  Required env vars:\n' +
    '    NEXT_PUBLIC_SUPABASE_URL       = ' + (SUPABASE_URL ? '✓ set' : '✗ MISSING') + '\n' +
    '    SUPABASE_SERVICE_ROLE_KEY      = ' + (SUPABASE_SERVICE_ROLE_KEY ? '✓ set' : '✗ MISSING')
  );
}

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

export default supabase;

/**
 * Guard helper — call at the top of every handler.
 * Returns true (and sends 503) if the client is not configured.
 */
export function requireSupabase(res) {
  if (!supabase) {
    res.status(503).json({
      error: 'Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.'
    });
    return true; // means "blocked"
  }
  return false; // means "ok, proceed"
}
