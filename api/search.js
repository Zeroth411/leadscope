import {
  cleanPlaceData, hasWebsite, categorizeLead, removeDuplicates,
  calculateLeadScore, getLeadTier, isRelevantBusiness, isJunkEntry, isValidPhone
} from './_leadUtils.js';
import supabase, { requireSupabase } from './_supabase.js';
import { applyCors, rejectMethod } from './_cors.js';

// ============================================
// GET /api/search
// ============================================
// Searches HERE Places API and returns scored, cleaned leads.
// All secrets (HERE_API_KEY, SUPABASE_SERVICE_ROLE_KEY) stay server-side.
// ============================================

// Simple in-memory rate limiting
const requestLog = new Map();
const RATE_LIMIT_WINDOW = 10000; // 10 seconds
const MAX_REQUESTS = 5;

function checkRateLimit(ip) {
  const now = Date.now();
  const requests = requestLog.get(ip) || [];
  const recent = requests.filter(t => now - t < RATE_LIMIT_WINDOW);
  if (recent.length >= MAX_REQUESTS) return false;
  recent.push(now);
  requestLog.set(ip, recent);
  return true;
}

export default async function handler(req, res) {
  if (applyCors(req, res, 'GET, OPTIONS')) return;
  if (rejectMethod(req, res, ['GET'])) return;
  if (requireSupabase(res)) return;

  try {
    const clientIp = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return res.status(429).json({ error: 'Too many requests. Please wait a few seconds.' });
    }

    const { query, noWebsiteOnly, relevantOnly } = req.query;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    // HERE API key is read exclusively from env — never from query params or frontend
    const HERE_API_KEY = process.env.HERE_API_KEY;
    if (!HERE_API_KEY) {
      return res.status(503).json({
        error: 'HERE API key not configured. Set the HERE_API_KEY environment variable on the server.'
      });
    }

    // Call HERE Places API (Discover endpoint)
    const hereUrl = new URL('https://discover.search.hereapi.com/v1/discover');
    hereUrl.searchParams.set('q', query.trim());
    hereUrl.searchParams.set('apiKey', HERE_API_KEY);
    hereUrl.searchParams.set('limit', '50');
    hereUrl.searchParams.set('at', '22.7196,75.8577'); // Indore coordinates as default

    const response = await fetch(hereUrl.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HERE API error:', response.status, errorText);
      return res.status(502).json({ error: `HERE API returned status ${response.status}` });
    }

    const data = await response.json();
    const items = data.items || [];

    if (items.length === 0) {
      return res.status(200).json([]);
    }

    // Process pipeline: clean → noise reduce → deduplicate → score → categorize → filter
    let processed = items.map(place => cleanPlaceData(place));

    // Noise reduction — remove junk entries
    processed = processed.filter(p => !isJunkEntry(p));

    // Clear invalid phone numbers (keep entry, just blank the phone)
    processed = processed.map(p => {
      if (p.phone && !isValidPhone(p.phone)) {
        return { ...p, phone: '' };
      }
      return p;
    });

    // Deduplicate
    processed = removeDuplicates(processed);

    // Calculate scores, tiers, and status for each lead
    processed = processed.map(p => {
      const status = categorizeLead(p);
      const score = calculateLeadScore(p);
      const leadTier = getLeadTier(score);
      const relevant = isRelevantBusiness(p);
      return {
        name: p.name,
        phone: p.phone,
        address: p.address,
        website: p.website,
        rating: p.rating || 0,
        reviewCount: p.reviewCount || 0,
        status,
        score,
        leadTier,
        relevant
      };
    });

    // Filter: if noWebsiteOnly=true, only return places without website
    if (noWebsiteOnly === 'true') {
      processed = processed.filter(p => !hasWebsite(p));
    }

    // If relevantOnly=true, only return relevant businesses
    if (relevantOnly === 'true') {
      processed = processed.filter(p => p.relevant);
    }

    // Sort by score descending (default)
    processed.sort((a, b) => b.score - a.score);

    // Log search to database (non-blocking — don't fail the request)
    try {
      await supabase.from('search_history').insert({
        query: query.trim(),
        results_count: processed.length,
        no_website_filter: noWebsiteOnly === 'true'
      });
    } catch (logErr) {
      console.error('Failed to log search:', logErr);
    }

    return res.status(200).json(processed);
  } catch (err) {
    console.error('Search API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
