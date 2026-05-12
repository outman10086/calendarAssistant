import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiFetch, isMockMode } from '../lib/supabase';
import type { User } from '../types';

const CODE_KEY = isMockMode ? 'mock_sync_code' : 'sync_code';
const USER_ID_KEY = isMockMode ? 'mock_user_id' : 'user_id';
const SYNC_HISTORY_KEY = 'sync_history';

export interface SyncHistoryItem {
  code: string;
  description: string;
  created_at: string;
  user_id: string;
}

interface AuthContextType {
  user: User | null;
  syncCode: string;
  loading: boolean;
  createUser: () => Promise<{ user: User; sync_code: string } | undefined>;
  loginWithCode: (code: string) => Promise<boolean>;
  logout: () => void;
  syncToCloud: (code?: string) => Promise<boolean>;
  syncFromCloud: (code: string) => Promise<boolean>;
  lastSyncAt: string | null;
  syncHistory: SyncHistoryItem[];
  addSyncHistory: (item: Omit<SyncHistoryItem, 'created_at'>) => void;
  updateSyncHistoryDesc: (code: string, description: string) => void;
  removeSyncHistory: (code: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function getSyncHistory(): SyncHistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(SYNC_HISTORY_KEY) || '[]');
  } catch { return []; }
}

function saveSyncHistory(list: SyncHistoryItem[]) {
  localStorage.setItem(SYNC_HISTORY_KEY, JSON.stringify(list));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [syncCode, setSyncCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryItem[]>(getSyncHistory);

  useEffect(() => {
    const storedCode = localStorage.getItem(CODE_KEY);
    const storedUserId = localStorage.getItem(USER_ID_KEY);
    const storedLastSync = localStorage.getItem('last_sync_at');
    if (storedLastSync) setLastSyncAt(storedLastSync);

    if (storedCode && storedUserId) {
      apiFetch('/api/auth/sync', {
        method: 'POST',
        body: JSON.stringify({ sync_code: storedCode }),
      })
        .then((res) => {
          setUser(res.user);
          setSyncCode(res.sync_code);
        })
        .catch(() => {
          localStorage.removeItem(CODE_KEY);
          localStorage.removeItem(USER_ID_KEY);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/sync', { method: 'POST' });
      localStorage.setItem(CODE_KEY, res.sync_code);
      localStorage.setItem(USER_ID_KEY, res.user.id);
      setSyncCode(res.sync_code);
      return res;
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithCode = useCallback(async (code: string) => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/sync', {
        method: 'POST',
        body: JSON.stringify({ sync_code: code }),
      });
      localStorage.setItem(CODE_KEY, res.sync_code);
      localStorage.setItem(USER_ID_KEY, res.user.id);
      setUser(res.user);
      setSyncCode(res.sync_code);
      return true;
    } catch {
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(CODE_KEY);
    localStorage.removeItem(USER_ID_KEY);
    setUser(null);
    setSyncCode('');
  }, []);

  const addSyncHistory = useCallback((item: Omit<SyncHistoryItem, 'created_at'>) => {
    const list = getSyncHistory();
    // 去重：如果已存在则更新，否则添加
    const idx = list.findIndex((h) => h.code === item.code);
    const newItem: SyncHistoryItem = { ...item, created_at: new Date().toISOString() };
    if (idx >= 0) {
      list[idx] = newItem;
    } else {
      list.unshift(newItem);
    }
    saveSyncHistory(list);
    setSyncHistory(list);
  }, []);

  const updateSyncHistoryDesc = useCallback((code: string, description: string) => {
    const list = getSyncHistory();
    const idx = list.findIndex((h) => h.code === code);
    if (idx >= 0) {
      list[idx] = { ...list[idx], description };
      saveSyncHistory(list);
      setSyncHistory(list);
    }
  }, []);

  const removeSyncHistory = useCallback((code: string) => {
    const list = getSyncHistory().filter((h) => h.code !== code);
    saveSyncHistory(list);
    setSyncHistory(list);
  }, []);

  /** 将本地数据推送到云端 */
  const syncToCloud = useCallback(async (code?: string) => {
    const targetCode = code || syncCode;
    const userId = localStorage.getItem(USER_ID_KEY);
    if (!targetCode || !userId) {
      if (!targetCode) {
        const res = await createUser();
        if (!res) return false;
        const newUserId = localStorage.getItem(USER_ID_KEY);
        if (!newUserId) return false;
        return doPush(newUserId);
      }
      return false;
    }
    return doPush(userId);
  }, [syncCode, createUser]);

  const doPush = async (userId: string): Promise<boolean> => {
    try {
      const schedules = JSON.parse(localStorage.getItem('local_schedules') || '[]');
      const moodEntries = JSON.parse(localStorage.getItem('local_mood_entries') || '[]');
      await apiFetch('/api/sync/push', {
        method: 'POST',
        body: JSON.stringify({ user_id: userId, schedules, moodEntries }),
      });
      const now = new Date().toISOString();
      localStorage.setItem('last_sync_at', now);
      setLastSyncAt(now);
      return true;
    } catch {
      return false;
    }
  };

  /** 从云端拉取数据到本地（覆盖） */
  const syncFromCloud = useCallback(async (code: string) => {
    try {
      const res = await apiFetch('/api/auth/sync', {
        method: 'POST',
        body: JSON.stringify({ sync_code: code }),
      });
      localStorage.setItem(CODE_KEY, res.sync_code);
      localStorage.setItem(USER_ID_KEY, res.user.id);
      setUser(res.user);
      setSyncCode(res.sync_code);

      const data = await apiFetch('/api/sync/pull', {
        method: 'POST',
        body: JSON.stringify({ user_id: res.user.id }),
      });

      if (data.schedules) localStorage.setItem('local_schedules', JSON.stringify(data.schedules));
      if (data.moodEntries) localStorage.setItem('local_mood_entries', JSON.stringify(data.moodEntries));

      const now = new Date().toISOString();
      localStorage.setItem('last_sync_at', now);
      setLastSyncAt(now);
      return true;
    } catch {
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user, syncCode, loading, createUser, loginWithCode, logout,
      syncToCloud, syncFromCloud, lastSyncAt,
      syncHistory, addSyncHistory, updateSyncHistoryDesc, removeSyncHistory,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
