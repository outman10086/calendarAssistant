import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, Calendar, Smile } from 'lucide-react';
import { parseIntent, formatIntentPreview } from '../lib/intentParser';
import { format } from 'date-fns';

const SCHEDULES_KEY = 'local_schedules';
const MOOD_KEY = 'local_mood_entries';

function getLocalSchedules() {
  try { return JSON.parse(localStorage.getItem(SCHEDULES_KEY) || '[]'); } catch { return []; }
}
function saveLocalSchedules(list: any[]) {
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(list));
}
function getLocalMoodEntries() {
  try { return JSON.parse(localStorage.getItem(MOOD_KEY) || '[]'); } catch { return []; }
}
function saveLocalMoodEntries(list: any[]) {
  localStorage.setItem(MOOD_KEY, JSON.stringify(list));
}

export function SmartInput() {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (value: string) => {
    setText(value);
    if (value.trim().length > 2) {
      const intent = parseIntent(value);
      setPreview(formatIntentPreview(intent));
    } else {
      setPreview('');
    }
  };

  const handleSubmit = useCallback(() => {
    if (!text.trim()) return;
    setLoading(true);

    const intent = parseIntent(text);

    try {
      if (intent.type === 'schedule') {
        const list = getLocalSchedules();
        list.push({
          id: `local-${Date.now()}`,
          user_id: '',
          title: intent.title || text.trim().slice(0, 20),
          description: '',
          scheduled_at: intent.scheduledAt
            ? new Date(intent.scheduledAt).toISOString()
            : new Date().toISOString(),
          reminder_minutes: 0,
          is_completed: false,
          created_at: new Date().toISOString(),
        });
        saveLocalSchedules(list);
        navigate('/schedules');
      } else if (intent.type === 'mood') {
        const date = intent.date || format(new Date(), 'yyyy-MM-dd');
        const list = getLocalMoodEntries();
        const idx = list.findIndex((e: any) => e.date === date);
        const events = intent.events?.map((ev: any, i: number) => ({
          id: `smart-${i}-${Date.now()}`,
          text: ev.text,
          period: ev.period || 'morning',
        })) || [];

        if (idx >= 0) {
          list[idx].events = [...(list[idx].events || []), ...events];
        } else {
          list.push({
            id: `mood-${Date.now()}`,
            user_id: '',
            date,
            mood_score: 0,
            events,
            note: '',
            created_at: new Date().toISOString(),
          });
        }
        saveLocalMoodEntries(list);
        navigate('/mood');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setText('');
      setPreview('');
    }
  }, [text, navigate]);

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-cream-200 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={18} className="text-cream-900" />
        <h3 className="font-semibold text-cream-900">智能助手</h3>
        <span className="text-xs text-cream-400">输入自然语言，自动识别意图</span>
      </div>

      <div className="relative">
        <input
          type="text"
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="试试输入：明天下午三点开会 / 今天心情不错 / 上午吃了好吃的"
          className="w-full px-4 py-3.5 pr-12 border border-cream-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cream-900 focus:border-cream-900 text-sm bg-cream-50 placeholder:text-cream-400 transition-all"
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-cream-900 text-white rounded-xl hover:bg-cream-800 hover:shadow-md active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Send size={16} />
        </button>
      </div>

      {preview && (
        <div className="mt-3 flex items-center gap-2 text-sm text-cream-800 bg-cream-100 px-3 py-2.5 rounded-xl border border-cream-200">
          {parseIntent(text).type === 'schedule' ? <Calendar size={16} /> : <Smile size={16} />}
          <span>识别到：{preview}</span>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {[
          '明天下午三点开会',
          '后天去体检',
          '今天心情很好',
          '上午吃了好吃的',
          '下周二交报告',
        ].map((example) => (
          <button
            key={example}
            onClick={() => handleChange(example)}
            className="text-xs px-3 py-1.5 bg-cream-100 text-cream-600 rounded-full hover:bg-cream-200 transition-colors"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
