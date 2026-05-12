import { adaptHandler } from './lib/netlifyAdapter.js';
import { supabaseAdmin } from './lib/supabaseAdmin.js';

async function routeHandler(req: any, res: any) {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Missing user id' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ entries: data || [] });
  }

  if (req.method === 'POST') {
    const { date, mood_score = 0, events = [], note = '' } = req.body || {};
    if (!date) {
      return res.status(400).json({ error: 'Missing date' });
    }

    const { data, error } = await supabaseAdmin
      .from('mood_entries')
      .upsert(
        { user_id: userId, date, mood_score, events, note },
        { onConflict: 'user_id,date' }
      )
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ entry: data });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const { error } = await supabaseAdmin
      .from('mood_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

export const handler = adaptHandler(routeHandler);
