import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  KeyRound, UserPlus, ArrowRight, Copy, Check, Upload, Download,
  X, Clock, Pencil, Trash2, History, ChevronRight,
} from 'lucide-react';

interface SyncCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Mode = 'menu' | 'new-desc' | 'upload' | 'download' | 'success';

export function SyncCodeModal({ isOpen, onClose }: SyncCodeModalProps) {
  const {
    syncCode, createUser, loginWithCode, syncToCloud, syncFromCloud,
    loading, syncHistory, addSyncHistory, updateSyncHistoryDesc, removeSyncHistory,
  } = useAuth();

  const [mode, setMode] = useState<Mode>('menu');
  const [inputCode, setInputCode] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [syncResult, setSyncResult] = useState('');
  const [editingDesc, setEditingDesc] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  if (!isOpen) return null;

  const reset = () => {
    setMode('menu');
    setInputCode('');
    setDescription('');
    setError('');
    setSyncResult('');
    setNewCode('');
    setEditingDesc(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // 第一步：生成同步码
  const handleCreateCode = async () => {
    setError('');
    const res = await createUser();
    if (res) {
      setNewCode(res.sync_code);
      setMode('new-desc');
    } else {
      setError('生成同步码失败');
    }
  };

  // 第二步：填写描述并上传
  const handleConfirmNew = async () => {
    setError('');
    const ok = await syncToCloud(newCode);
    if (ok) {
      addSyncHistory({
        code: newCode,
        description: description.trim() || '未命名',
        user_id: localStorage.getItem('mock_user_id') || localStorage.getItem('user_id') || '',
      });
      setSyncResult('本地数据已成功上传到云端');
      setMode('success');
    } else {
      setError('数据上传失败');
    }
  };

  // 上传到已有账户
  const handleUpload = async () => {
    if (!inputCode.trim() || inputCode.length !== 8) {
      setError('请输入8位同步码');
      return;
    }
    setError('');
    const ok = await loginWithCode(inputCode.trim().toLowerCase());
    if (!ok) {
      setError('同步码无效');
      return;
    }
    const uploaded = await syncToCloud(inputCode.trim().toLowerCase());
    if (uploaded) {
      // 如果这个码在历史中，更新描述为"手动上传"
      const existing = syncHistory.find((h) => h.code === inputCode.trim().toLowerCase());
      if (!existing) {
        addSyncHistory({
          code: inputCode.trim().toLowerCase(),
          description: '手动上传',
          user_id: localStorage.getItem('mock_user_id') || localStorage.getItem('user_id') || '',
        });
      }
      setSyncResult('本地数据已成功上传到云端');
      setMode('success');
    } else {
      setError('数据上传失败');
    }
  };

  // 从云端下载
  const handleDownload = async () => {
    if (!inputCode.trim() || inputCode.length !== 8) {
      setError('请输入8位同步码');
      return;
    }
    setError('');
    const ok = await syncFromCloud(inputCode.trim().toLowerCase());
    if (ok) {
      const existing = syncHistory.find((h) => h.code === inputCode.trim().toLowerCase());
      if (!existing) {
        addSyncHistory({
          code: inputCode.trim().toLowerCase(),
          description: '从云端下载',
          user_id: localStorage.getItem('mock_user_id') || localStorage.getItem('user_id') || '',
        });
      }
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

  const startEditDesc = (code: string, current: string) => {
    setEditingDesc(code);
    setEditValue(current);
  };

  const saveEditDesc = (code: string) => {
    updateSyncHistoryDesc(code, editValue.trim() || '未命名');
    setEditingDesc(null);
  };

  const selectHistory = (code: string, action: 'upload' | 'download') => {
    setInputCode(code);
    setMode(action);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm mx-auto p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
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
              onClick={() => setMode('new-desc')}
              disabled={!newCode}
              className="w-full flex items-center gap-3 p-4 bg-cream-50 rounded-2xl border border-cream-200 hover:bg-cream-100 hover:shadow-sm transition-all text-left disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-cream-900 rounded-xl flex items-center justify-center shrink-0">
                <UserPlus className="text-white" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-cream-900">生成新同步码</div>
                <div className="text-xs text-cream-500">创建新账户并将本地数据上传</div>
              </div>
              <ChevronRight size={16} className="text-cream-400 shrink-0" />
            </button>

            <button
              onClick={() => setMode('upload')}
              className="w-full flex items-center gap-3 p-4 bg-cream-50 rounded-2xl border border-cream-200 hover:bg-cream-100 hover:shadow-sm transition-all text-left"
            >
              <div className="w-10 h-10 bg-cream-700 rounded-xl flex items-center justify-center shrink-0">
                <Upload className="text-white" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-cream-900">上传到已有账户</div>
                <div className="text-xs text-cream-500">输入同步码，将本地数据覆盖到云端</div>
              </div>
              <ChevronRight size={16} className="text-cream-400 shrink-0" />
            </button>

            <button
              onClick={() => setMode('download')}
              className="w-full flex items-center gap-3 p-4 bg-cream-50 rounded-2xl border border-cream-200 hover:bg-cream-100 hover:shadow-sm transition-all text-left"
            >
              <div className="w-10 h-10 bg-cream-700 rounded-xl flex items-center justify-center shrink-0">
                <Download className="text-white" size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-cream-900">从云端下载</div>
                <div className="text-xs text-cream-500">输入同步码，将云端数据同步到本地</div>
              </div>
              <ChevronRight size={16} className="text-cream-400 shrink-0" />
            </button>

            {/* 当前同步码 */}
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

            {/* 历史同步码 */}
            {syncHistory.length > 0 && (
              <div className="mt-4 pt-4 border-t border-cream-100">
                <div className="flex items-center gap-1.5 text-xs text-cream-500 mb-3">
                  <History size={14} />
                  历史同步码 ({syncHistory.length})
                </div>
                <div className="space-y-2">
                  {syncHistory.map((item) => (
                    <div
                      key={item.code}
                      className="bg-cream-50 rounded-xl border border-cream-200 p-3 group hover:border-cream-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-cream-900 text-sm tracking-wider">{item.code}</span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(item.code);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 1500);
                            }}
                            className="p-0.5 text-cream-400 hover:text-cream-700 transition-colors"
                            title="复制"
                          >
                            <Copy size={12} />
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEditDesc(item.code, item.description)}
                            className="p-1 text-cream-400 hover:text-cream-700 hover:bg-cream-200 rounded-lg transition-colors"
                            title="编辑描述"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => removeSyncHistory(item.code)}
                            className="p-1 text-cream-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="删除记录"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {editingDesc === item.code ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEditDesc(item.code);
                              if (e.key === 'Escape') setEditingDesc(null);
                            }}
                            className="flex-1 min-w-0 px-2 py-1 text-xs border border-cream-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-cream-900"
                            autoFocus
                          />
                          <button
                            onClick={() => saveEditDesc(item.code)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Check size={14} />
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-cream-500 truncate">{item.description}</p>
                      )}

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-cream-100">
                        <div className="flex items-center gap-1 text-[10px] text-cream-400">
                          <Clock size={10} />
                          {new Date(item.created_at).toLocaleDateString('zh-CN')}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => selectHistory(item.code, 'upload')}
                            className="text-[10px] px-2 py-1 bg-white border border-cream-200 text-cream-600 rounded-md hover:bg-cream-100 transition-colors"
                          >
                            上传
                          </button>
                          <button
                            onClick={() => selectHistory(item.code, 'download')}
                            className="text-[10px] px-2 py-1 bg-white border border-cream-200 text-cream-600 rounded-md hover:bg-cream-100 transition-colors"
                          >
                            下载
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 生成新同步码 — 填写描述 */}
        {mode === 'new-desc' && (
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="text-xs text-cream-500">新同步码已生成</div>
              <div className="bg-cream-50 rounded-xl px-4 py-3 border border-cream-200">
                <div className="text-2xl font-bold text-cream-900 tracking-[0.15em] font-mono">{newCode}</div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-cream-700 mb-1.5">描述（用于标识这个同步码）</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="例如：工作电脑、个人手机..."
                className="w-full px-4 py-3 border border-cream-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cream-900 focus:border-cream-900 bg-cream-50 text-sm placeholder:text-cream-400 transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmNew();
                }}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-2">
              <button onClick={reset} className="flex-1 py-3 border border-cream-200 text-cream-700 rounded-2xl font-medium hover:bg-cream-100 transition-all">
                取消
              </button>
              <button
                onClick={handleConfirmNew}
                disabled={loading}
                className="flex-1 py-3 bg-cream-900 text-white rounded-2xl font-medium hover:bg-cream-800 hover:shadow-md active:scale-[0.98] disabled:opacity-50 transition-all shadow-sm"
              >
                {loading ? '上传中...' : '确认并上传'}
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
