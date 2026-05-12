import { adaptHandler } from './lib/netlifyAdapter';
import { supabaseAdmin } from './lib/supabaseAdmin';
import { webPush } from './lib/webPush';

async function routeHandler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 验证 cron 请求
  const cronSecret = req.headers['x-cron-secret'];
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = new Date().toISOString().split('T')[0];

  // 获取所有有推送订阅的用户
  const { data: subs, error: subError } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*, users!inner(id)');

  if (subError || !subs || subs.length === 0) {
    return res.status(200).json({ sent: 0, reason: 'No subscriptions' });
  }

  // 获取今天已填写心情的用户
  const { data: moods } = await supabaseAdmin
    .from('mood_entries')
    .select('user_id')
    .eq('date', today);

  const moodUserIds = new Set((moods || []).map((m) => m.user_id));

  let sent = 0;
  let failed = 0;

  for (const sub of subs) {
    if (moodUserIds.has(sub.user_id)) continue;

    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        },
        JSON.stringify({
          title: '🌙 心情日记',
          body: '今天过得怎么样？来记录一下心情吧！',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: 'mood-reminder',
          requireInteraction: true,
          data: { url: '/mood' },
        })
      );
      sent++;
    } catch (err: any) {
      failed++;
      // 如果订阅已过期，删除它
      if (err.statusCode === 410 || err.statusCode === 404) {
        await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
      }
    }
  }

  return res.status(200).json({ sent, failed, total: subs.length });
}

export const handler = adaptHandler(routeHandler);
