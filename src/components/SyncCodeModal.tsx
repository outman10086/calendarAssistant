import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { KeyRound, UserPlus, ArrowRight } from 'lucide-react';

export function SyncCodeModal() {
  const { createUser, loginWithCode, loading } = useAuth();
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'create'>('login');

  const handleLogin = async () => {
    if (!inputCode.trim() || inputCode.length !== 8) {
      setError('请输入8位同步码');
      return;
    }
    setError('');
    const ok = await loginWithCode(inputCode.trim().toLowerCase());
    if (!ok) {
      setError('同步码无效，请检查');
    }
  };

  const handleCreate = async () => {
    setError('');
    await createUser();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cream-100 px-6">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 space-y-6 border border-cream-200">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-cream-100 rounded-2xl flex items-center justify-center mx-auto">
            <KeyRound className="text-cream-900" size={28} />
          </div>
          <h2 className="text-xl font-bold text-cream-900 tracking-tight">
            {mode === 'login' ? '同步你的数据' : '创建新账户'}
          </h2>
          <p className="text-sm text-cream-500 leading-relaxed">
            {mode === 'login'
              ? '输入同步码即可在多个设备间同步数据'
              : '生成新的同步码，开始记录日程与心情'}
          </p>
        </div>

        {mode === 'login' ? (
          <div className="space-y-4">
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="输入8位同步码"
              maxLength={8}
              className="w-full px-4 py-3.5 border border-cream-200 rounded-2xl text-center tracking-[0.3em] text-lg uppercase focus:outline-none focus:ring-2 focus:ring-cream-900 focus:border-cream-900 bg-cream-50 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full py-3.5 bg-cream-900 text-white rounded-2xl font-medium hover:bg-cream-800 hover:shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              {loading ? '同步中...' : '开始同步'}
              <ArrowRight size={18} />
            </button>
            <button
              onClick={() => { setMode('create'); setError(''); }}
              className="w-full py-2.5 text-sm text-cream-500 hover:text-cream-900 transition-colors"
            >
              没有同步码？创建新账户
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-3.5 bg-cream-900 text-white rounded-2xl font-medium hover:bg-cream-800 hover:shadow-md active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <UserPlus size={18} />
              {loading ? '创建中...' : '生成同步码'}
            </button>
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className="w-full py-2.5 text-sm text-cream-500 hover:text-cream-900 transition-colors"
            >
              已有同步码？点击登录
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
