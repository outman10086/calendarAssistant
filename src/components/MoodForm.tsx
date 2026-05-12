import { useState, useEffect } from 'react';
import { parseIntent } from '../lib/intentParser';
import type { MoodEntry, MoodEvent } from '../types';
import { Save, X, Trash2, Plus, Frown, Meh, Smile, Laugh, Annoyed, Wand2, Sun, Moon } from 'lucide-react';

interface MoodFormProps {
  date: string;
  initial?: MoodEntry;
  onSubmit: (data: Partial<MoodEntry>) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const moodOptions = [
  { score: 1, label: '很糟', icon: Frown, border: 'border-red-200' },
  { score: 2, label: '不太好', icon: Annoyed, border: 'border-orange-200' },
  { score: 3, label: '一般', icon: Meh, border: 'border-yellow-200' },
  { score: 4, label: '不错', icon: Smile, border: 'border-green-200' },
  { score: 5, label: '超棒', icon: Laugh, border: 'border-emerald-200' },
];

const PERIODS = [
  { key: 'morning' as const, label: '上午', icon: Sun, color: 'text-amber-500', bg: 'bg-amber-50/50', border: 'border-amber-200' },
  { key: 'afternoon' as const, label: '下午', icon: Sun, color: 'text-orange-500', bg: 'bg-orange-50/50', border: 'border-orange-200' },
  { key: 'evening' as const, label: '晚上', icon: Moon, color: 'text-indigo-500', bg: 'bg-indigo-50/50', border: 'border-indigo-200' },
];

const periodLabel: Record<string, string> = {
  morning: '上午',
  afternoon: '下午',
  evening: '晚上',
};

function generateEventId(): string {
  return Math.random().toString(36).slice(2, 9);
}

export function MoodForm({ date, initial, onSubmit, onCancel, onDelete }: MoodFormProps) {
  const [moodScore, setMoodScore] = useState(initial?.mood_score || 0);
  const [events, setEvents] = useState<MoodEvent[]>(initial?.events || []);
  const [note, setNote] = useState(initial?.note || '');
  const [inputs, setInputs] = useState<Record<string, string>>({ morning: '', afternoon: '', evening: '' });
  const [smartPreview, setSmartPreview] = useState('');

  useEffect(() => {
    if (initial) {
      setMoodScore(initial.mood_score);
      setEvents(initial.events || []);
      setNote(initial.note);
    } else {
      setMoodScore(0);
      setEvents([]);
      setNote('');
    }
    setInputs({ morning: '', afternoon: '', evening: '' });
    setSmartPreview('');
  }, [initial, date]);

  // 智能解析事件和日期（不识别心情）
  const handleSmartInput = (value: string) => {
    if (value.trim().length > 3 && !initial) {
      const intent = parseIntent(value);
      if (intent.type === 'mood') {
        if (intent.events && intent.events.length > 0) {
          const ev = intent.events[0];
          const period = ev.period || 'morning';
          setEvents(prev => [...prev, { id: generateEventId(), text: ev.text, period }]);
          let msg = `已添加：${periodLabel[period]} ${ev.text}`;
          if (intent.date && intent.date !== date) {
            const d = new Date(intent.date + 'T00:00:00');
            msg += `（${d.getMonth() + 1}月${d.getDate()}日）`;
          }
          setSmartPreview(msg);
        } else {
          setSmartPreview('');
        }
      } else {
        setSmartPreview('');
      }
    }
  };

  const addEvent = (period: 'morning' | 'afternoon' | 'evening') => {
    const text = inputs[period].trim();
    if (!text) return;
    setEvents(prev => [...prev, { id: generateEventId(), text, period }]);
    setInputs(prev => ({ ...prev, [period]: '' }));
  };

  const removeEvent = (id: string) => {
    setEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      date,
      mood_score: moodScore,
      events,
      note: note.trim(),
    });
  };

  const eventsByPeriod = (period: string) => events.filter(e => e.period === period);

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 shadow-sm border border-cream-200 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-cream-900">
          {initial ? '编辑记录' : '记录心情'}
        </h3>
        <button type="button" onClick={onCancel} className="p-1.5 text-cream-400 hover:text-cream-700 hover:bg-cream-100 rounded-lg transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* 心情评分 */}
      <div>
        <label className="block text-sm font-medium text-cream-700 mb-2">
          今天心情如何？<span className="text-cream-400 font-normal">（可选）</span>
        </label>
        <div className="flex justify-between gap-2">
          {moodOptions.map((opt) => {
            const Icon = opt.icon;
            const active = moodScore === opt.score;
            return (
              <button
                key={opt.score}
                type="button"
                onClick={() => setMoodScore(active ? 0 : opt.score)}
                className={`flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all flex-1 ${
                  active
                    ? `bg-cream-900 text-white ${opt.border} shadow-md`
                    : `bg-white text-cream-600 ${opt.border} hover:bg-cream-50 hover:shadow-sm`
                }`}
              >
                <Icon size={24} />
                <span className="text-xs font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 智能解析输入 */}
      {!initial && (
        <div>
          <label className="block text-sm font-medium text-cream-700 mb-1.5">快速记录</label>
          <input
            type="text"
            placeholder="试试输入：上午开了会 / 今天心情不错 / 晚上去跑步"
            onChange={(e) => handleSmartInput(e.target.value)}
            className="w-full px-4 py-3 border border-cream-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cream-900 focus:border-cream-900 bg-cream-50 text-sm placeholder:text-cream-400 transition-all"
          />
          {smartPreview && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-cream-700">
              <Wand2 size={12} />
              <span>{smartPreview}</span>
            </div>
          )}
        </div>
      )}

      {/* 今天发生了什么 - 三段式 */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-cream-700">今天发生了什么？</label>
        {PERIODS.map((p) => {
          const Icon = p.icon;
          const periodEvents = eventsByPeriod(p.key);
          return (
            <div key={p.key} className={`rounded-2xl border ${p.border} ${p.bg} p-3.5`}>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Icon size={14} className={p.color} />
                <span className={`text-xs font-semibold ${p.color}`}>{p.label}</span>
                <span className="text-xs text-cream-400">({periodEvents.length})</span>
              </div>

              {/* 事项列表 */}
              {periodEvents.length > 0 && (
                <div className="space-y-1.5 mb-2.5">
                  {periodEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="flex items-center justify-between bg-white rounded-xl px-3 py-2 text-sm shadow-sm"
                    >
                      <span className="text-cream-800">{ev.text}</span>
                      <button
                        type="button"
                        onClick={() => removeEvent(ev.id)}
                        className="p-1 text-cream-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* 添加输入 */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputs[p.key]}
                  onChange={(e) => setInputs(prev => ({ ...prev, [p.key]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addEvent(p.key);
                    }
                  }}
                  placeholder={`添加${p.label}的事项...`}
                  className="flex-1 min-w-0 px-3 py-2 bg-white border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cream-900 focus:border-cream-900 transition-all"
                />
                <button
                  type="button"
                  onClick={() => addEvent(p.key)}
                  disabled={!inputs[p.key].trim()}
                  className="px-3 py-2 bg-white border border-cream-200 text-cream-600 rounded-xl hover:bg-cream-50 disabled:opacity-40 transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 备注 */}
      <div>
        <label className="block text-sm font-medium text-cream-700 mb-1.5">备注（可选）</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="其他想记录的内容"
          className="w-full px-4 py-3 border border-cream-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cream-900 focus:border-cream-900 bg-cream-50 text-sm placeholder:text-cream-400 transition-all"
        />
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 py-3 bg-cream-900 text-white rounded-2xl font-medium hover:bg-cream-800 hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <Save size={16} />
          保存记录
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-3 border border-cream-200 text-cream-700 rounded-2xl font-medium hover:bg-cream-100 hover:shadow-sm active:scale-[0.98] flex items-center gap-1.5 transition-all"
        >
          <X size={16} />
          取消
        </button>
        {initial && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="px-5 py-3 border border-red-200 text-red-600 rounded-2xl font-medium hover:bg-red-50 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 size={16} />
            删除
          </button>
        )}
      </div>
    </form>
  );
}
