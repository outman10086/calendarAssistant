import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// 如果未配置环境变量，创建空客户端（本地预览模式）
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (null as any);

// API 基础 URL
export const API_BASE = import.meta.env.VITE_API_BASE || '';

// 本地预览模式标志
export const isMockMode = !supabaseUrl || !supabaseAnonKey;

// ========== 本地优先数据存储 ==========
const LS_SCHEDULES = 'local_schedules';
const LS_MOOD = 'local_mood_entries';

function getLocalSchedules(): any[] {
  try {
    return JSON.parse(localStorage.getItem(LS_SCHEDULES) || '[]');
  } catch { return []; }
}

function setLocalSchedules(data: any[]) {
  localStorage.setItem(LS_SCHEDULES, JSON.stringify(data));
}

function getLocalMood(): any[] {
  try {
    return JSON.parse(localStorage.getItem(LS_MOOD) || '[]');
  } catch { return []; }
}

function setLocalMood(data: any[]) {
  localStorage.setItem(LS_MOOD, JSON.stringify(data));
}

// ========== Mock 云端数据存储（多用户） ==========
interface CloudUser {
  id: string;
  sync_code: string;
  created_at: string;
  schedules: any[];
  moodEntries: any[];
}

const mockCloud: {
  users: Record<string, CloudUser>;
  codeIndex: Record<string, string>; // sync_code -> user_id
} = {
  users: {},
  codeIndex: {},
};

export async function apiFetch(path: string, options: RequestInit = {}) {
  // 本地预览模式：返回模拟数据
  if (isMockMode) {
    await new Promise((r) => setTimeout(r, 200));
    return handleMockRequest(path, options);
  }

  const userId = localStorage.getItem('user_id');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(userId ? { 'x-user-id': userId } : {}),
    ...(options.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json();
}

function handleMockRequest(path: string, options: RequestInit): any {
  const method = options.method || 'GET';
  const body = options.body ? JSON.parse(options.body as string) : {};

  // ========== 认证 ==========
  if (path === '/api/auth/sync') {
    if (method === 'POST') {
      if (body.sync_code) {
        // 验证同步码
        const userId = mockCloud.codeIndex[body.sync_code];
        if (userId && mockCloud.users[userId]) {
          const u = mockCloud.users[userId];
          return { user: { id: u.id, sync_code: u.sync_code, created_at: u.created_at }, sync_code: u.sync_code };
        }
        throw new Error('Invalid sync code');
      }
      // 创建新用户
      const code = generateMockCode();
      const userId = generateId();
      const user: CloudUser = {
        id: userId,
        sync_code: code,
        created_at: new Date().toISOString(),
        schedules: [],
        moodEntries: [],
      };
      mockCloud.users[userId] = user;
      mockCloud.codeIndex[code] = userId;
      return { user: { id: userId, sync_code: code, created_at: user.created_at }, sync_code: code };
    }
  }

  // ========== 云端同步：推送（本地 → 云端） ==========
  if (path === '/api/sync/push') {
    if (method === 'POST') {
      const userId = body.user_id;
      if (!userId || !mockCloud.users[userId]) throw new Error('User not found');
      mockCloud.users[userId].schedules = body.schedules || [];
      mockCloud.users[userId].moodEntries = body.moodEntries || [];
      return { success: true, count: { schedules: body.schedules?.length || 0, mood: body.moodEntries?.length || 0 } };
    }
  }

  // ========== 云端同步：拉取（云端 → 本地） ==========
  if (path === '/api/sync/pull') {
    if (method === 'POST') {
      const userId = body.user_id;
      if (!userId || !mockCloud.users[userId]) throw new Error('User not found');
      const u = mockCloud.users[userId];
      return { schedules: u.schedules, moodEntries: u.moodEntries };
    }
  }

  // ========== 日程（本地优先） ==========
  if (path.startsWith('/api/schedules')) {
    if (method === 'GET') {
      return { schedules: [...getLocalSchedules()] };
    }
    if (method === 'POST') {
      const schedule = { id: generateId(), ...body, created_at: new Date().toISOString() };
      const list = [...getLocalSchedules(), schedule];
      setLocalSchedules(list);
      return { schedule };
    }
    if (method === 'PUT') {
      const { id, ...updates } = body || {};
      if (!id) throw new Error('Missing id');
      const list = getLocalSchedules();
      const idx = list.findIndex((s: any) => s.id === id);
      if (idx >= 0) {
        const updated = list.map((s: any) => s.id === id ? { ...s, ...updates } : s);
        setLocalSchedules(updated);
        return { schedule: updated.find((s: any) => s.id === id) };
      }
      throw new Error('Schedule not found');
    }
    if (method === 'DELETE') {
      const id = new URLSearchParams(path.split('?')[1]).get('id');
      if (!id) throw new Error('Missing id');
      const list = getLocalSchedules().filter((s: any) => s.id !== id);
      setLocalSchedules(list);
      return {};
    }
  }

  // ========== 心情（本地优先） ==========
  if (path.startsWith('/api/mood')) {
    if (method === 'GET') {
      return { entries: [...getLocalMood()] };
    }
    if (method === 'POST') {
      const list = getLocalMood();
      const existing = list.find((e: any) => e.date === body.date);
      const newEvents = Array.isArray(body.events) ? body.events : [];

      if (existing) {
        const merged = {
          ...existing,
          events: [...(existing.events || []), ...newEvents],
          mood_score: body.mood_score > 0 ? body.mood_score : existing.mood_score,
          note: body.note !== undefined ? body.note : existing.note,
          created_at: new Date().toISOString(),
        };
        const updated = list.map((e: any) => e.date === body.date ? merged : e);
        setLocalMood(updated);
        return { entry: merged };
      }

      const entry = {
        id: generateId(),
        user_id: 'local',
        date: body.date,
        mood_score: body.mood_score || 0,
        events: newEvents,
        note: body.note || '',
        created_at: new Date().toISOString(),
      };
      setLocalMood([...list, entry]);
      return { entry };
    }
    if (method === 'DELETE') {
      const id = new URLSearchParams(path.split('?')[1]).get('id');
      if (!id) throw new Error('Missing id');
      const list = getLocalMood().filter((e: any) => e.id !== id);
      setLocalMood(list);
      return {};
    }
  }

  if (path === '/api/push/subscribe') {
    return { subscription: { id: 'mock' } };
  }

  return {};
}

function generateMockCode(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
