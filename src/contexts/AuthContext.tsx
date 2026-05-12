import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiFetch, isMockMode } from '../lib/supabase';
import type { User } from '../types';

const CODE_KEY = isMockMode ? 'mock_sync_code' : 'sync_code';
const USER_ID_KEY = isMockMode ? 'mock_user_id' : 'user_id';

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
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [syncCode, setSyncCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

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

  /** 将本地数据推送到云端 */
  const syncToCloud = useCallback(async (code?: string) => {
    const targetCode = code || syncCode;
    const userId = localStorage.getItem(USER_ID_KEY);
    if (!targetCode || !userId) {
      // 没有同步码：先创建用户，再推送
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
      // 先验证同步码
      const res = await apiFetch('/api/auth/sync', {
        method: 'POST',
        body: JSON.stringify({ sync_code: code }),
      });
      localStorage.setItem(CODE_KEY, res.sync_code);
      localStorage.setItem(USER_ID_KEY, res.user.id);
      setUser(res.user);
      setSyncCode(res.sync_code);

      // 拉取数据
      const data = await apiFetch('/api/sync/pull', {
        method: 'POST',
        body: JSON.stringify({ user_id: res.user.id }),
      });

      // 覆盖本地数据
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
    <AuthContext.Provider value={{ user, syncCode, loading, createUser, loginWithCode, logout, syncToCloud, syncFromCloud, lastSyncAt }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
