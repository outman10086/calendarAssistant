import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/supabase';
import type { Schedule } from '../types';
import { ScheduleForm } from '../components/ScheduleForm';
import { ScheduleList } from '../components/ScheduleList';
import { Plus, X } from 'lucide-react';

export function Schedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await apiFetch('/api/schedules');
      setSchedules(res.schedules || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const handleCreate = async (data: Partial<Schedule>) => {
    await apiFetch('/api/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    setShowForm(false);
    fetchSchedules();
  };

  const handleUpdate = async (data: Partial<Schedule>) => {
    if (!editing) return;
    await apiFetch('/api/schedules', {
      method: 'PUT',
      body: JSON.stringify({ id: editing.id, ...data }),
    });
    setEditing(null);
    fetchSchedules();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除这个日程吗？')) return;
    await apiFetch(`/api/schedules?id=${id}`, { method: 'DELETE' });
    fetchSchedules();
  };

  const handleToggleComplete = async (schedule: Schedule) => {
    await apiFetch('/api/schedules', {
      method: 'PUT',
      body: JSON.stringify({ id: schedule.id, is_completed: !schedule.is_completed }),
    });
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
