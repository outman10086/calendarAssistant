import { Link, useLocation } from 'react-router-dom';
import { Calendar, Smile, Home, Bell, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePush } from '../hooks/usePush';
import { isMockMode } from '../lib/supabase';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { logout } = useAuth();
  const { subscribed, subscribe } = usePush();

  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/schedules', icon: Calendar, label: '日程' },
    { path: '/mood', icon: Smile, label: '心情' },
  ];

  const handleBellClick = () => {
    if (isMockMode) {
      alert('当前为本地预览模式，推送通知功能需要在部署到服务器后才能正常使用。');
      return;
    }
    subscribe();
  };

  return (
    <div className="flex flex-col min-h-screen bg-cream-100">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-cream-200">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-cream-900 tracking-tight">日程助手</h1>
          <div className="flex items-center gap-2">
            {!subscribed && (
              <button
                onClick={handleBellClick}
                className="p-2 text-cream-900 hover:bg-cream-100 rounded-full transition-colors"
                title="开启推送"
              >
                <Bell size={20} />
              </button>
            )}
            <button
              onClick={logout}
              className="p-2 text-cream-500 hover:text-cream-900 hover:bg-cream-100 rounded-full transition-colors"
              title="退出"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4">{children}</main>

      <nav className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-cream-200 pb-safe">
        <div className="max-w-lg mx-auto flex justify-around h-14 items-center">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all ${
                  active ? 'text-cream-900 bg-cream-100' : 'text-cream-400 hover:text-cream-700 hover:bg-cream-50'
                }`}
              >
                <item.icon size={22} strokeWidth={active ? 2.5 : 2} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
