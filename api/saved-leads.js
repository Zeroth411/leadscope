import supabase, { requireSupabase } from './_supabase.js';
import { applyCors, rejectMethod } from './_cors.js';

// ============================================
// /api/saved-leads
// ============================================
// Full CRUD for saved leads (mini CRM).
// ALL database operations happen here — the frontend
// only calls fetch('/api/saved-leads').
// ============================================

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (rejectMethod(req, res, ['GET', 'POST', 'PUT', 'DELETE'])) return;
  if (requireSupabase(res)) return;

  try {
    // ─── GET: List saved leads ───────────────────────
    if (req.method === 'GET') {
      const { callStatus } = req.query;
      let query = supabase
        .from('saved_leads_v2')
        .select('*')
        .order('score', { ascending: false });

      if (callStatus && callStatus !== 'ALL') {
        query = query.eq('call_status', callStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return res.status(200).json(data);
    }

    // ─── POST: Save a new lead ──────────────────────
    if (req.method === 'POST') {
      const { name, phone, address, website, status, score, lead_tier, notes } = req.body;

      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'Lead name is required' });
      }

      const { data, error } = await supabase
        .from('saved_leads_v2')
        .insert({
          name: (name || '').trim(),
          phone: (phone || '').trim(),
          address: (address || '').trim(),
          website: (website || '').trim(),
          status: status || 'HIGH_PRIORITY',
          score: typeof score === 'number' ? score : 0,
          lead_tier: lead_tier || 'LOW_VALUE',
          call_status: 'NOT_CALLED',
          notes: (notes || '').trim()
        })
        .select()
        .single();
      if (error) throw error;
      return res.status(201).json(data);
    }

    // ─── PUT: Update call_status or notes ───────────
    if (req.method === 'PUT') {
      const { id, call_status, notes } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Lead id is required' });
      }

      const VALID_CALL_STATUSES = ['NOT_CALLED', 'CALLED', 'INTERESTED', 'NOT_INTERESTED'];
      const updates = {};

      if (call_status !== undefined) {
        if (!VALID_CALL_STATUSES.includes(call_status)) {
          return res.status(400).json({
            error: `Invalid call_status. Must be one of: ${VALID_CALL_STATUSES.join(', ')}`
          });
        }
        updates.call_status = call_status;
      }

      if (notes !== undefined) {
        updates.notes = (notes || '').trim();
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      const { data, error } = await supabase
        .from('saved_leads_v2')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return res.status(200).json(data);
    }

    // ─── DELETE: Remove a saved lead ────────────────
    if (req.method === 'DELETE') {
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Lead id is required' });
      }

      const { error } = await supabase
        .from('saved_leads_v2')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
  } catch (err) {
    console.error('Saved leads API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
