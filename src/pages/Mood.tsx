import { useState, useEffect, useCallback } from 'react';
import type { MoodEntry } from '../types';
import { MoodForm } from '../components/MoodForm';
import { MoodCalendar } from '../components/MoodCalendar';
import { YearlyMoodView } from '../components/YearlyMoodView';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { PenLine, CalendarDays, Trash2, Sun, Sunset, Moon, LayoutGrid, Calendar } from 'lucide-react';

const MOOD_KEY = 'local_mood_entries';

function getLocalMoodEntries(): MoodEntry[] {
  try {
    return JSON.parse(localStorage.getItem(MOOD_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalMoodEntries(list: MoodEntry[]) {
  localStorage.setItem(MOOD_KEY, JSON.stringify(list));
}

const PERIOD_META: Record<string, { label: string; icon: typeof Sun; color: string }> = {
  morning: { label: '上午', icon: Sun, color: 'text-amber-500' },
  afternoon: { label: '下午', icon: Sunset, color: 'text-orange-500' },
  evening: { label: '晚上', icon: Moon, color: 'text-indigo-500' },
};

export function Mood() {
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'month' | 'year'>('month');

  const fetchEntries = useCallback(() => {
    setEntries(getLocalMoodEntries());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleSubmit = (data: Partial<MoodEntry>) => {
    const list = getLocalMoodEntries();
    const idx = list.findIndex((e) => e.date === data.date);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...data } as MoodEntry;
    } else {
      const newEntry: MoodEntry = {
        id: `mood-${Date.now()}`,
        user_id: '',
        date: data.date || format(new Date(), 'yyyy-MM-dd'),
        mood_score: data.mood_score ?? 0,
        events: data.events || [],
        note: data.note || '',
        created_at: new Date().toISOString(),
      };
      list.push(newEntry);
    }
    saveLocalMoodEntries(list);
    setShowForm(false);
    fetchEntries();
  };

  const handleDelete = () => {
    if (!selectedEntry) return;
    if (!confirm('确定删除这条心情记录吗？')) return;
    const list = getLocalMoodEntries().filter((e) => e.id !== selectedEntry.id);
    saveLocalMoodEntries(list);
    setShowForm(false);
    fetchEntries();
  };

  const selectedEntry = entries.find((e) => e.date === selectedDate);
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const eventsByPeriod = useCallback((entry: MoodEntry) => {
    const groups: Record<string, typeof entry.events> = { morning: [], afternoon: [], evening: [] };
    for (const ev of entry.events || []) {
      if (groups[ev.period]) groups[ev.period].push(ev);
    }
    return groups;
  }, []);

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setShowForm(true);
  };

  const handleSelectDateFromYear = (date: string) => {
    setViewMode('month');
    setSelectedDate(date);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-cream-900 tracking-tight">心情日记</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-cream-900 text-white rounded-xl text-sm font-medium hover:bg-cream-800 hover:shadow-md active:scale-[0.98] transition-all shadow-sm"
        >
          <PenLine size={16} />
          {selectedDate === todayStr ? '记录今天' : '记录'}
        </button>
      </div>

      {/* 视图切换 */}
      <div className="flex bg-cream-100 rounded-2xl p-1">
        <button
          onClick={() => setViewMode('month')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            viewMode === 'month'
              ? 'bg-white text-cream-900 shadow-md'
              : 'text-cream-500 hover:text-cream-700'
          }`}
        >
          <Calendar size={14} />
          月历
        </button>
        <button
          onClick={() => setViewMode('year')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            viewMode === 'year'
              ? 'bg-white text-cream-900 shadow-md'
              : 'text-cream-500 hover:text-cream-700'
          }`}
        >
          <LayoutGrid size={14} />
          年度
        </button>
      </div>

      {viewMode === 'month' ? (
        <MoodCalendar
          entries={entries}
          selectedDate={selectedDate}
          onSelectDate={handleSelectDate}
        />
      ) : (
        <YearlyMoodView
          entries={entries}
          onSelectDate={handleSelectDateFromYear}
        />
      )}

      {showForm && (
        <MoodForm
          date={selectedDate}
          initial={selectedEntry}
          onSubmit={handleSubmit}
          onCancel={() => setShowForm(false)}
          onDelete={selectedEntry ? handleDelete : undefined}
        />
      )}

      {!showForm && selectedEntry && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-cream-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-cream-900" />
              <h3 className="font-semibold text-cream-900">
                {selectedDate === todayStr ? '今天' : format(new Date(selectedDate + 'T00:00:00'), 'M月d日', { locale: zhCN })}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (confirm('确定删除这条心情记录吗？')) {
                    handleDelete();
                  }
                }}
                className="p-1.5 text-cream-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 size={14} />
              </button>
              {selectedEntry.mood_score > 0 ? (
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                        i < selectedEntry.mood_score ? 'bg-cream-900 text-white' : 'bg-cream-100 text-cream-300'
                      }`}
                    >
                      ★
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-cream-400">未记录心情</span>
              )}
            </div>
          </div>

          {/* 按时段展示事件 */}
          {selectedEntry.events && selectedEntry.events.length > 0 ? (
            <div className="space-y-3">
              {Object.entries(eventsByPeriod(selectedEntry)).map(([period, list]) => {
                if (list.length === 0) return null;
                const meta = PERIOD_META[period];
                const Icon = meta.icon;
                return (
                  <div key={period}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon size={12} className={meta.color} />
                      <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>
                    </div>
                    <div className="space-y-1.5">
                      {list.map((ev) => (
                        <div
                          key={ev.id}
                          className="flex items-center gap-2 bg-cream-50 rounded-xl px-3 py-2.5 text-sm text-cream-800"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-cream-300 shrink-0" />
                          {ev.text}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-cream-400 py-2">没有记录今天发生的事</p>
          )}

          {selectedEntry.note && (
            <div className="mt-4 pt-4 border-t border-cream-100">
              <p className="text-xs text-cream-500 mb-1">备注</p>
              <p className="text-sm text-cream-800 whitespace-pre-wrap">{selectedEntry.note}</p>
            </div>
          )}
        </div>
      )}

      {!showForm && !selectedEntry && selectedDate === todayStr && (
        <div className="text-center py-8 text-cream-400 bg-white rounded-2xl border border-dashed border-cream-200">
          <p>今天还没有记录心情</p>
          <p className="text-sm mt-1">点击右上角记录一下今天吧</p>
        </div>
      )}
    </div>
  );
}
