import { useState, useEffect, useCallback } from 'react';
import { subscribePush, unsubscribePush } from '../lib/push';

export function usePush() {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          setSubscribed(!!sub);
        });
      });
    }
  }, []);

  const subscribe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await subscribePush();
      setSubscribed(true);
    } catch (err: any) {
      setError(err.message);
      // 本地预览时给出友好提示
      if (!import.meta.env.VITE_VAPID_PUBLIC_KEY) {
        alert('当前为本地预览模式，推送功能需要部署到真实服务器后才能使用。');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    try {
      await unsubscribePush();
      setSubscribed(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { subscribed, loading, error, subscribe, unsubscribe };
}
