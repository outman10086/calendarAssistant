import { adaptHandler } from './lib/netlifyAdapter';
import { supabaseAdmin } from './lib/supabaseAdmin';
import { webPush } from './lib/webPush';

async function routeHandler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const cronSecret = req.headers['x-cron-secret'];
  if (cronSecret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const now = new Date();
  const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

  // 查找提醒时间落在过去一分钟内的日程
  // reminder_minutes: 提前多少分钟提醒
  // 实际提醒时间 = scheduled_at - reminder_minutes
  const { data: schedules, error } = await supabaseAdmin
    .from('schedules')
    .select('*')
    .eq('is_completed', false)
    .gte('scheduled_at', new Date(oneMinuteAgo.getTime() + 60 * 1000).toISOString())
    .lte('scheduled_at', new Date(now.getTime() + 60 * 1000 * 60).toISOString());

  if (error || !schedules || schedules.length === 0) {
    return res.status(200).json({ sent: 0, reason: 'No upcoming schedules' });
  }

  // 筛选出真正需要提醒的（scheduled_at - reminder_minutes 落在 [oneMinuteAgo, now]）
  const dueSchedules = schedules.filter((s) => {
    const reminderTime = new Date(new Date(s.scheduled_at).getTime() - s.reminder_minutes * 60 * 1000);
    return reminderTime >= oneMinuteAgo && reminderTime <= now;
  });

  if (dueSchedules.length === 0) {
    return res.status(200).json({ sent: 0, reason: 'No reminders due' });
  }

  // 按 user_id 分组
  const userIds = [...new Set(dueSchedules.map((s) => s.user_id))];

  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('*')
    .in('user_id', userIds);

  const userSubs: Record<string, typeof subs> = {};
  (subs || []).forEach((sub) => {
    if (!userSubs[sub.user_id]) userSubs[sub.user_id] = [];
    userSubs[sub.user_id].push(sub);
  });

  let sent = 0;
  let failed = 0;

  for (const schedule of dueSchedules) {
    const userSubList = userSubs[schedule.user_id] || [];
    for (const sub of userSubList) {
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
            title: '📅 日程提醒',
            body: schedule.title,
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: `schedule-${schedule.id}`,
            requireInteraction: true,
            data: { url: '/schedules' },
          })
        );
        sent++;
      } catch (err: any) {
        failed++;
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    }
  }

  return res.status(200).json({ sent, failed, total: dueSchedules.length });
}

export const handler = adaptHandler(routeHandler);
