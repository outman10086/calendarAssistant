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

// Mock 数据存储（本地预览用）
const mockStorage: Record<string, any> = {
  user: null,
  schedules: [],
  moodEntries: [],
};

export async function apiFetch(path: string, options: RequestInit = {}) {
  // 本地预览模式：返回模拟数据
  if (isMockMode) {
    await new Promise((r) => setTimeout(r, 200)); // 模拟网络延迟
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

  if (path === '/api/auth/sync') {
    if (method === 'POST') {
      if (body.sync_code) {
        // 登录
        if (mockStorage.user && mockStorage.user.sync_code === body.sync_code) {
          return { user: mockStorage.user, sync_code: body.sync_code };
        }
        throw new Error('Invalid sync code');
      }
      // 创建用户
      const code = generateMockCode();
      const user = { id: generateId(), sync_code: code, created_at: new Date().toISOString() };
      mockStorage.user = user;
      localStorage.setItem('mock_user_id', user.id);
      localStorage.setItem('mock_sync_code', code);
      return { user, sync_code: code };
    }
  }

  if (path.startsWith('/api/schedules')) {
    if (method === 'GET') {
      // 返回新数组引用，确保 React 检测到变化
      return { schedules: [...mockStorage.schedules] };
    }
    if (method === 'POST') {
      const schedule = { id: generateId(), ...body, created_at: new Date().toISOString() };
      mockStorage.schedules = [...mockStorage.schedules, schedule];
      return { schedule };
    }
    if (method === 'PUT') {
      const { id, ...updates } = body || {};
      if (!id) throw new Error('Missing id');
      const idx = mockStorage.schedules.findIndex((s: any) => s.id === id);
      if (idx >= 0) {
        mockStorage.schedules = mockStorage.schedules.map((s: any) =>
          s.id === id ? { ...s, ...updates } : s
        );
        const updated = mockStorage.schedules.find((s: any) => s.id === id);
        return { schedule: updated };
      }
      throw new Error('Schedule not found');
    }
    if (method === 'DELETE') {
      const id = new URLSearchParams(path.split('?')[1]).get('id');
      if (!id) throw new Error('Missing id');
      mockStorage.schedules = mockStorage.schedules.filter((s: any) => s.id !== id);
      return {};
    }
  }

  if (path.startsWith('/api/mood')) {
    if (method === 'GET') {
      return { entries: [...mockStorage.moodEntries] };
    }
    if (method === 'POST') {
      const existing = mockStorage.moodEntries.find((e: any) => e.date === body.date);
      const newEvents = Array.isArray(body.events) ? body.events : [];

      if (existing) {
        // 同一天已有记录：合并事件，其他字段有值才更新
        const merged = {
          ...existing,
          events: [...(existing.events || []), ...newEvents],
          mood_score: body.mood_score > 0 ? body.mood_score : existing.mood_score,
          note: body.note !== undefined ? body.note : existing.note,
          created_at: new Date().toISOString(),
        };
        mockStorage.moodEntries = mockStorage.moodEntries.map((e: any) =>
          e.date === body.date ? merged : e
        );
        return { entry: merged };
      }

      // 新记录
      const entry = {
        id: generateId(),
        user_id: mockStorage.user?.id || 'mock',
        date: body.date,
        mood_score: body.mood_score || 0,
        events: newEvents,
        note: body.note || '',
        created_at: new Date().toISOString(),
      };
      mockStorage.moodEntries = [...mockStorage.moodEntries, entry];
      return { entry };
    }
    if (method === 'DELETE') {
      const id = new URLSearchParams(path.split('?')[1]).get('id');
      if (!id) throw new Error('Missing id');
      mockStorage.moodEntries = mockStorage.moodEntries.filter((e: any) => e.id !== id);
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
