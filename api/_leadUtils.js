// ============================================
// LEAD UTILITY FUNCTIONS — Full Implementation
// ============================================

// Relevant business categories for prioritization (Upgrade 2)
const RELEVANT_KEYWORDS = [
  'restaurant', 'cafe', 'café', 'coffee', 'salon', 'beauty', 'parlour', 'parlor',
  'gym', 'fitness', 'clinic', 'doctor', 'medical', 'health', 'dental', 'dentist',
  'spa', 'barber', 'hair', 'nail', 'yoga', 'physiotherapy', 'bakery', 'sweet',
  'dhaba', 'hotel', 'food', 'eatery', 'biryani', 'pizza', 'burger', 'juice',
  'tea', 'chai', 'diner', 'kitchen', 'canteen', 'mess'
];

// Clean place data from HERE API response
export function cleanPlaceData(place) {
  const name = (place.title || '').trim();
  const address = (place.address?.label || '').trim();
  let phone = (place.contacts?.[0]?.phone?.[0]?.value || place.contacts?.[0]?.mobile?.[0]?.value || '').trim();
  const website = (place.contacts?.[0]?.www?.[0]?.value || '').trim();
  const rating = typeof place.scoring?.rating === 'number' ? place.scoring.rating : 0;
  const reviewCount = typeof place.scoring?.reviewCount === 'number' ? place.scoring.reviewCount : 0;
  const categories = (place.categories || []).map(c => (c.name || '').toLowerCase());

  // Normalize phone number
  phone = normalizePhone(phone);

  return { name, phone, address, website, rating, reviewCount, categories };
}

// Normalize phone number
function normalizePhone(phone) {
  if (!phone) return '';
  // Remove spaces, dashes, parentheses, dots
  let cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  // Standardize Indian numbers to +91 format
  if (cleaned.match(/^0[6-9]\d{9}$/)) {
    cleaned = '+91' + cleaned.substring(1);
  } else if (cleaned.match(/^[6-9]\d{9}$/)) {
    cleaned = '+91' + cleaned;
  } else if (cleaned.match(/^91[6-9]\d{9}$/)) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

// Validate phone number (Upgrade 7 — noise reduction)
export function isValidPhone(phone) {
  if (!phone || phone.length === 0) return false;
  // Must be at least 10 digits after cleaning
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return false;
  // Reject obviously fake numbers
  if (/^(\d)\1{9,}$/.test(digits)) return false; // all same digit
  if (digits === '1234567890' || digits === '0987654321') return false;
  return true;
}

// Check if place has a website
export function hasWebsite(place) {
  return !!(place.website && place.website.length > 0);
}

// Categorize lead priority (kept from original)
export function categorizeLead(place) {
  if (!place.phone || place.phone.length === 0) return 'NO_PHONE';
  if (!place.website || place.website.length === 0) return 'HIGH_PRIORITY';
  return 'LOW_PRIORITY';
}

// ============================================
// UPGRADE 1: Lead Scoring System
// ============================================
export function calculateLeadScore(place) {
  let score = 0;

  // +50 if NO website
  if (!place.website || place.website.length === 0) {
    score += 50;
  }

  // +30 if phone exists
  if (place.phone && place.phone.length > 0) {
    score += 30;
  }

  // +20 if rating >= 4 (safely default to 0)
  const rating = typeof place.rating === 'number' ? place.rating : 0;
  if (rating >= 4) {
    score += 20;
  }

  // +10 if review_count >= 50 (safely default to 0)
  const reviewCount = typeof place.reviewCount === 'number' ? place.reviewCount : 0;
  if (reviewCount >= 50) {
    score += 10;
  }

  return score;
}

// Determine lead tier based on score
export function getLeadTier(score) {
  if (score >= 80) return 'HOT_LEAD';
  if (score >= 50) return 'GOOD_LEAD';
  return 'LOW_VALUE';
}

// ============================================
// UPGRADE 2: Business Type Filter
// ============================================
export function isRelevantBusiness(place) {
  const nameLC = (place.name || '').toLowerCase();
  const cats = (place.categories || []);

  // Check name against keywords
  for (const keyword of RELEVANT_KEYWORDS) {
    if (nameLC.includes(keyword)) return true;
  }

  // Check categories against keywords
  for (const cat of cats) {
    const catLC = typeof cat === 'string' ? cat : '';
    for (const keyword of RELEVANT_KEYWORDS) {
      if (catLC.includes(keyword)) return true;
    }
  }

  return false;
}

// ============================================
// UPGRADE 7: Noise Reduction
// ============================================
export function isJunkEntry(place) {
  // Empty name
  if (!place.name || place.name.trim().length === 0) return true;
  // Name too short (likely garbage)
  if (place.name.trim().length < 2) return true;
  // Name is just numbers
  if (/^\d+$/.test(place.name.trim())) return true;
  return false;
}

// Remove duplicates by phone number
export function removeDuplicates(data) {
  const seen = new Map();
  const result = [];
  for (const item of data) {
    if (!item.phone || item.phone.length === 0) {
      // Keep entries without phone (can't deduplicate), but dedupe by name
      const nameKey = item.name.toLowerCase().trim();
      if (!seen.has('name:' + nameKey)) {
        seen.set('name:' + nameKey, true);
        result.push(item);
      }
    } else if (!seen.has(item.phone)) {
      seen.set(item.phone, true);
      result.push(item);
    }
  }
  return result;
}
