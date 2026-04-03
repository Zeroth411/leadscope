import { applyCors } from './_cors.js';

// ============================================
// Health Check Endpoint
// ============================================
// GET /api/health
// Returns configuration status without exposing secrets.
// ============================================

export default function handler(req, res) {
  if (applyCors(req, res, 'GET, OPTIONS')) return;

  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasHereKey = !!process.env.HERE_API_KEY;

  const allConfigured = hasSupabaseUrl && hasServiceKey;

  res.status(allConfigured ? 200 : 503).json({
    status: allConfigured ? 'healthy' : 'misconfigured',
    timestamp: new Date().toISOString(),
    config: {
      SUPABASE_URL: hasSupabaseUrl ? 'configured' : 'MISSING',
      SUPABASE_SERVICE_ROLE_KEY: hasServiceKey ? 'configured' : 'MISSING',
      HERE_API_KEY: hasHereKey ? 'configured' : 'MISSING',
    },
    // Never expose actual values
    note: 'Secret values are never returned. Only configuration presence is reported.'
  });
}
