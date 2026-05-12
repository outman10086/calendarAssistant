import { adaptHandler } from '../_lib/netlifyAdapter.js';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';

async function routeHandler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: 'Missing user id' });
  }

  const { subscription } = req.body || {};
  if (!subscription?.endpoint) {
    return res.status(400).json({ error: 'Missing subscription' });
  }

  const { endpoint, keys } = subscription;

  const { data, error } = await supabaseAdmin
    .from('push_subscriptions')
    .upsert(
      {
        user_id: userId,
        endpoint,
        p256dh: keys?.p256dh,
        auth: keys?.auth,
      },
      { onConflict: 'endpoint' }
    )
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ subscription: data });
}

export const handler = adaptHandler(routeHandler);
