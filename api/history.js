import supabase, { requireSupabase } from './_supabase.js';
import { applyCors, rejectMethod } from './_cors.js';

// ============================================
// /api/history
// ============================================
// GET: List recent search history
// DELETE: Remove a history entry
// ============================================

export default async function handler(req, res) {
  if (applyCors(req, res, 'GET, DELETE, OPTIONS')) return;
  if (rejectMethod(req, res, ['GET', 'DELETE'])) return;
  if (requireSupabase(res)) return;

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('search_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return res.status(200).json(data);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'History entry id is required' });
      }

      const { error } = await supabase
        .from('search_history')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return res.status(200).json({ ok: true });
    }
  } catch (err) {
    console.error('History API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
