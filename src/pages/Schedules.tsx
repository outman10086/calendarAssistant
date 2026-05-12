import { useState, useEffect, useCallback } from 'react';
import type { Schedule } from '../types';
import { ScheduleForm } from '../components/ScheduleForm';
import { ScheduleList } from '../components/ScheduleList';
import { Plus, X } from 'lucide-react';

const SCHEDULES_KEY = 'local_schedules';

function getLocalSchedules(): Schedule[] {
  try {
    return JSON.parse(localStorage.getItem(SCHEDULES_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveLocalSchedules(list: Schedule[]) {
  localStorage.setItem(SCHEDULES_KEY, JSON.stringify(list));
}

export function Schedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(() => {
    setSchedules(getLocalSchedules());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleCreate = (data: Partial<Schedule>) => {
    const list = getLocalSchedules();
    const newItem: Schedule = {
      id: `local-${Date.now()}`,
      user_id: '',
      title: data.title || '',
      description: data.description || '',
      scheduled_at: data.scheduled_at || new Date().toISOString(),
      reminder_minutes: data.reminder_minutes || 0,
      is_completed: false,
      created_at: new Date().toISOString(),
    };
    list.push(newItem);
    saveLocalSchedules(list);
    setShowForm(false);
    fetchSchedules();
  };

  const handleUpdate = (data: Partial<Schedule>) => {
    if (!editing) return;
    const list = getLocalSchedules();
    const idx = list.findIndex((s) => s.id === editing.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...data };
      saveLocalSchedules(list);
    }
    setEditing(null);
    fetchSchedules();
  };

  const handleDelete = (id: string) => {
    if (!confirm('确定删除这个日程吗？')) return;
    const list = getLocalSchedules().filter((s) => s.id !== id);
    saveLocalSchedules(list);
    fetchSchedules();
  };

  const handleToggleComplete = (schedule: Schedule) => {
    const list = getLocalSchedules();
    const idx = list.findIndex((s) => s.id === schedule.id);
    if (idx >= 0) {
      list[idx].is_completed = !list[idx].is_completed;
      saveLocalSchedules(list);
    }
    fetchSchedules();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-cream-900 tracking-tight">日程管理</h2>
        <button
          onClick={() => { setShowForm(true); setEditing(null); }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-cream-900 text-white rounded-xl text-sm font-medium hover:bg-cream-800 hover:shadow-md active:scale-[0.98] transition-all shadow-sm"
        >
          <Plus size={16} />
          新建
        </button>
      </div>

      {(showForm || editing) && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-cream-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-cream-900">
              {editing ? '编辑日程' : '新建日程'}
            </h3>
            <button
              onClick={() => { setShowForm(false); setEditing(null); }}
              className="p-1.5 text-cream-400 hover:text-cream-700 hover:bg-cream-100 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <ScheduleForm
            initial={editing || undefined}
            onSubmit={editing ? handleUpdate : handleCreate}
            onCancel={() => { setShowForm(false); setEditing(null); }}
          />
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-cream-400">加载中...</div>
      ) : (
        <ScheduleList
          schedules={schedules}
          onEdit={setEditing}
          onDelete={handleDelete}
          onToggleComplete={handleToggleComplete}
        />
      )}
    </div>
  );
}
