import { useState, useEffect } from 'react';
import { useSpeech } from '../hooks/useSpeech';
import { parseIntent } from '../lib/intentParser';
import { Mic, MicOff, Save, X, Wand2 } from 'lucide-react';
import type { Schedule } from '../types';

interface ScheduleFormProps {
  initial?: Schedule;
  onSubmit: (data: Partial<Schedule>) => void;
  onCancel: () => void;
}

export function ScheduleForm({ initial, onSubmit, onCancel }: ScheduleFormProps) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [scheduledAt, setScheduledAt] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState(initial?.reminder_minutes || 0);
  const [smartPreview, setSmartPreview] = useState('');
  const { isListening, transcript, startListening, stopListening, supported, error: speechError } = useSpeech();

  useEffect(() => {
    if (initial?.scheduled_at) {
      const d = new Date(initial.scheduled_at);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
      setScheduledAt(local.toISOString().slice(0, 16));
    } else {
      const now = new Date();
      now.setMinutes(now.getMinutes() + 30);
      const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
      setScheduledAt(local.toISOString().slice(0, 16));
    }
  }, [initial]);

  useEffect(() => {
    setTitle((prev) => prev + transcript);
  }, [transcript]);

  // 智能解析标题输入
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (value.trim().length > 3 && !initial) {
      const intent = parseIntent(value);
      if (intent.type === 'schedule' && intent.scheduledAt) {
        setScheduledAt(intent.scheduledAt);
        const [d, t] = intent.scheduledAt.split('T');
        const [month, day] = d.split('-').slice(1);
        const [hour, minute] = t.split(':');
        setSmartPreview(`已自动识别时间：${parseInt(month)}月${parseInt(day)}日 ${hour}:${minute}`);
      } else {
        setSmartPreview('');
      }
    } else {
      setSmartPreview('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !scheduledAt) return;

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      scheduled_at: new Date(scheduledAt).toISOString(),
      reminder_minutes: reminderMinutes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-cream-700 mb-1.5">标题</label>
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="日程标题（支持自然语言：明天下午三点开会）"
            className="w-full px-4 py-3 pr-11 border border-cream-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cream-900 focus:border-cream-900 bg-cream-50 text-sm placeholder:text-cream-400 transition-all"
            required
          />
          {supported && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors ${
                isListening ? 'bg-red-100 text-red-600' : 'bg-cream-100 text-cream-500 hover:bg-cream-200'
              }`}
              title={isListening ? '停止录音' : '语音输入'}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          )}
        </div>
        {smartPreview && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-cream-800">
            <Wand2 size={12} />
            <span>{smartPreview}</span>
          </div>
        )}
        {speechError && (
          <p className="text-xs text-red-500 mt-1.5">{speechError}</p>
        )}
        {isListening && (
          <p className="text-xs text-cream-700 mt-1.5 animate-pulse">正在聆听... 请说话</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-cream-700 mb-1.5">详情</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="补充说明（可选）"
          rows={2}
          className="w-full px-4 py-3 border border-cream-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cream-900 focus:border-cream-900 bg-cream-50 resize-none text-sm placeholder:text-cream-400 transition-all"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-cream-700 mb-1.5">时间</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full px-4 py-3 border border-cream-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cream-900 focus:border-cream-900 bg-cream-50 text-sm transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-cream-700 mb-1.5">提前提醒</label>
          <select
            value={reminderMinutes}
            onChange={(e) => setReminderMinutes(Number(e.target.value))}
            className="w-full px-4 py-3 border border-cream-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cream-900 focus:border-cream-900 text-sm bg-cream-50 transition-all appearance-none"
          >
            <option value={0}>准时</option>
            <option value={5}>5分钟</option>
            <option value={10}>10分钟</option>
            <option value={15}>15分钟</option>
            <option value={30}>30分钟</option>
            <option value={60}>1小时</option>
            <option value={1440}>1天</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          className="flex-1 py-3 bg-cream-900 text-white rounded-2xl font-medium hover:bg-cream-800 hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2 transition-all shadow-sm"
        >
          <Save size={16} />
          保存
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-3 border border-cream-200 text-cream-700 rounded-2xl font-medium hover:bg-cream-100 hover:shadow-sm active:scale-[0.98] flex items-center gap-1.5 transition-all"
        >
          <X size={16} />
          取消
        </button>
      </div>
    </form>
  );
}
