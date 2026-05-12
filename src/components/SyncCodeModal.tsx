import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { KeyRound, UserPlus, ArrowRight, Copy, Check, LogIn, Upload, Download, X, RefreshCw } from 'lucide-react';

interface SyncCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SyncCodeModal({ isOpen, onClose }: SyncCodeModalProps) {
  const { user, syncCode, createUser, loginWithCode, syncToCloud, syncFromCloud, loading } = useAuth();
  const [mode, setMode] = useState<'menu' | 'new' | 'upload' | 'download' | 'success'>('menu');
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [syncResult, setSyncResult] = useState('');

  if (!isOpen) return null;

  const reset = () => {
    setMode('menu');
    setInputCode('');
    setError('');
    setSyncResult('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // 生成新同步码并上传本地数据
  const handleNewAndUpload = async () => {
    setError('');
    setSyncResult('');
    const res = await createUser();
    if (res) {
      const ok = await syncToCloud(res.sync_code);
      if (ok) {
        setNewCode(res.sync_code);
        setMode('success');
      } else {
        setError('同步码已生成，但数据上传失败');
        setNewCode(res.sync_code);
        setMode('success');
      }
    } else {
      setError('生成同步码失败');
    }
  };

  // 输入已有同步码并上传
  const handleUpload = async () => {
    if (!inputCode.trim() || inputCode.length !== 8) {
      setError('请输入8位同步码');
      return;
    }
    setError('');
    setSyncResult('');

    // 先登录验证同步码
    const ok = await loginWithCode(inputCode.trim().toLowerCase());
    if (!ok) {
      setError('同步码无效');
      return;
    }

    // 上传本地数据
    const uploaded = await syncToCloud(inputCode.trim().toLowerCase());
    if (uploaded) {
      setSyncResult('本地数据已成功上传到云端');
      setMode('success');
    } else {
      setError('数据上传失败');
    }
  };

  // 输入已有同步码并下载
  const handleDownload = async () => {
    if (!inputCode.trim() || inputCode.length !== 8) {
      setError('请输入8位同步码');
      return;
    }
    setError('');
    setSyncResult('');

    const ok = await syncFromCloud(inputCode.trim().toLowerCase());
    if (ok) {
      setSyncResult('云端数据已成功同步到本地，页面将自动刷新');
      setMode('success');
    } else {
      setError('同步失败，请检查同步码');
    }
  };

  const handleCopy = async () => {
    const code = newCode || syncCode;
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm mx-auto p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-cream-900 text-lg">数据同步</h3>
          <button onClick={handleClose} className="p-2 hover:bg-cream-100 rounded-xl transition-colors">
            <X size={18} className="text-cream-500" />
          </button>
        </div>

        {/* 主菜单 */}
        {mode === 'menu' && (
          <div className="space-y-3">
            <button
              onClick={() => setMode('new')}
              className="w-full flex items-center gap-3 p-4 bg-cream-50 rounded-2xl border border-cream-200 hover:bg-cream-100 hover:shadow-sm transition-all text-left"
            >
              <div className="w-10 h-10 bg-cream-900 rounded-xl flex items-center justify-center shrink-0">
                <UserPlus className="text-white" size={20} />
              </div>
              <div>
                <div className="font-medium text-cream-900">生成新同步码</div>
                <div className="text-xs text-cream-500">创建新账户并将本地数据上传</div>
              </div>
            </button>

            <button
              onClick={() => setMode('upload')}
              className="w-full flex items-center gap-3 p-4 bg-cream-50 rounded-2xl border border-cream-200 hover:bg-cream-100 hover:shadow-sm transition-all text-left"
            >
              <div className="w-10 h-10 bg-cream-700 rounded-xl flex items-center justify-center shrink-0">
                <Upload className="text-white" size={20} />
              </div>
              <div>
                <div className="font-medium text-cream-900">上传到已有账户</div>
                <div className="text-xs text-cream-500">输入同步码，将本地数据覆盖到云端</div>
              </div>
            </button>

            <button
              onClick={() => setMode('download')}
              className="w-full flex items-center gap-3 p-4 bg-cream-50 rounded-2xl border border-cream-200 hover:bg-cream-100 hover:shadow-sm transition-all text-left"
            >
              <div className="w-10 h-10 bg-cream-700 rounded-xl flex items-center justify-center shrink-0">
                <Download className="text-white" size={20} />
              </div>
              <div>
                <div className="font-medium text-cream-900">从云端下载</div>
                <div className="text-xs text-cream-500">输入同步码，将云端数据同步到本地</div>
              </div>
            </button>

            {syncCode && (
              <div className="mt-4 pt-4 border-t border-cream-100">
                <div className="text-xs text-cream-500 mb-2">当前同步码</div>
                <div className="flex items-center justify-between bg-cream-50 rounded-xl px-4 py-3 border border-cream-200">
                  <span className="font-mono font-bold text-cream-900 tracking-wider">{syncCode}</span>
                  <button onClick={handleCopy} className="p-1.5 hover:bg-cream-200 rounded-lg transition-colors">
                    {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-cream-500" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 生成新同步码 */}
        {mode === 'new' && (
          <div className="space-y-4">
            <p className="text-sm text-cream-600">将生成一个新的同步码，并把当前本地所有数据上传到云端。</p>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button onClick={reset} className="flex-1 py-3 border border-cream-200 text-cream-700 rounded-2xl font-medium hover:bg-cream-100 transition-all">
                取消
              </button>
              <button
                onClick={handleNewAndUpload}
                disabled={loading}
                className="flex-1 py-3 bg-cream-900 text-white rounded-2xl font-medium hover:bg-cream-800 hover:shadow-md active:scale-[0.98] disabled:opacity-50 transition-all shadow-sm"
              >
                {loading ? '处理中...' : '确认生成并上传'}
              </button>
            </div>
          </div>
        )}

        {/* 上传/下载：输入同步码 */}
        {(mode === 'upload' || mode === 'download') && (
          <div className="space-y-4">
            <p className="text-sm text-cream-600">
              {mode === 'upload'
                ? '输入同步码后，本地数据将覆盖到该账户的云端。'
                : '输入同步码后，云端数据将覆盖到本地设备。'}
            </p>
            <input
              type="text"
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value)}
              placeholder="输入8位同步码"
              maxLength={8}
              className="w-full px-4 py-3.5 border border-cream-200 rounded-2xl text-center tracking-[0.3em] text-lg uppercase focus:outline-none focus:ring-2 focus:ring-cream-900 focus:border-cream-900 bg-cream-50 transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  mode === 'upload' ? handleUpload() : handleDownload();
                }
              }}
            />
            {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            <div className="flex gap-2">
              <button onClick={reset} className="flex-1 py-3 border border-cream-200 text-cream-700 rounded-2xl font-medium hover:bg-cream-100 transition-all">
                取消
              </button>
              <button
                onClick={mode === 'upload' ? handleUpload : handleDownload}
                disabled={loading || inputCode.length !== 8}
                className="flex-1 py-3 bg-cream-900 text-white rounded-2xl font-medium hover:bg-cream-800 hover:shadow-md active:scale-[0.98] disabled:opacity-50 transition-all shadow-sm"
              >
                {loading ? '处理中...' : mode === 'upload' ? '确认上传' : '确认下载'}
              </button>
            </div>
          </div>
        )}

        {/* 成功 */}
        {mode === 'success' && (
          <div className="space-y-5 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-2xl flex items-center justify-center mx-auto">
              <Check className="text-green-600" size={28} />
            </div>

            {newCode && (
              <div className="space-y-2">
                <div className="text-xs text-cream-500">你的新同步码</div>
                <div className="bg-cream-50 rounded-xl px-4 py-3 border border-cream-200">
                  <div className="text-2xl font-bold text-cream-900 tracking-[0.15em] font-mono">{newCode}</div>
                </div>
                <button
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    copied ? 'bg-green-100 text-green-700' : 'bg-white border border-cream-200 text-cream-600 hover:bg-cream-100'
                  }`}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? '已复制' : '复制同步码'}
                </button>
              </div>
            )}

            {syncResult && <p className="text-sm text-cream-600">{syncResult}</p>}

            <button
              onClick={() => {
                handleClose();
                if (syncResult.includes('刷新')) window.location.reload();
              }}
              className="w-full py-3 bg-cream-900 text-white rounded-2xl font-medium hover:bg-cream-800 hover:shadow-md active:scale-[0.98] transition-all shadow-sm"
            >
              完成
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
