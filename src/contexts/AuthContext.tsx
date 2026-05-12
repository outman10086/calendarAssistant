import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { apiFetch, isMockMode } from '../lib/supabase';
import type { User } from '../types';

const CODE_KEY = isMockMode ? 'mock_sync_code' : 'sync_code';
const USER_ID_KEY = isMockMode ? 'mock_user_id' : 'user_id';

interface AuthContextType {
  user: User | null;
  syncCode: string;
  loading: boolean;
  createUser: () => Promise<string | undefined>;
  loginWithCode: (code: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [syncCode, setSyncCode] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedCode = localStorage.getItem(CODE_KEY);
    const storedUserId = localStorage.getItem(USER_ID_KEY);

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
      setUser(res.user);
      setSyncCode(res.sync_code);
      return res.sync_code;
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

  return (
    <AuthContext.Provider value={{ user, syncCode, loading, createUser, loginWithCode, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
