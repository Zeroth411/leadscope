// ============================================
// Shared CORS + Method Helpers
// ============================================

// Allowed origins — in production, restrict to your domain.
// For now we allow all because Vercel preview URLs vary.
const ALLOWED_ORIGIN = '*';

/**
 * Apply CORS headers and handle OPTIONS preflight.
 * Returns true if the request was an OPTIONS preflight (already handled).
 */
export function applyCors(req, res, methods = 'GET, POST, PUT, DELETE, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return true;
  }
  return false;
}

/**
 * Reject disallowed HTTP methods.
 * Returns true if the method is not in the allowed list.
 */
export function rejectMethod(req, res, allowed) {
  if (!allowed.includes(req.method)) {
    res.status(405).json({ error: `Method ${req.method} not allowed` });
    return true;
  }
  return false;
}
