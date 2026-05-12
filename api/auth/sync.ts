import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../_lib/supabaseAdmin.js';

function generateSyncCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sync_code } = req.body || {};

  if (sync_code) {
    // 验证已有 sync_code
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('sync_code', sync_code)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'Invalid sync code' });
    }

    return res.status(200).json({ user, sync_code });
  }

  // 创建新用户
  let code = generateSyncCode();
  let attempts = 0;
  let user = null;

  while (attempts < 5) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({ sync_code: code })
      .select()
      .single();

    if (!error && data) {
      user = data;
      break;
    }
    code = generateSyncCode();
    attempts++;
  }

  if (!user) {
    return res.status(500).json({ error: 'Failed to create user' });
  }

  return res.status(200).json({ user, sync_code: code });
}
