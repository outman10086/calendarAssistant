import { format, isPast, isToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Schedule } from '../types';
import { CheckCircle2, Circle, Clock, Edit2, Trash2 } from 'lucide-react';

interface ScheduleListProps {
  schedules: Schedule[];
  onEdit: (schedule: Schedule) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (schedule: Schedule) => void;
}

export function ScheduleList({ schedules, onEdit, onDelete, onToggleComplete }: ScheduleListProps) {
  const grouped = schedules.reduce<Record<string, Schedule[]>>((acc, s) => {
    const date = format(new Date(s.scheduled_at), 'yyyy-MM-dd');
    if (!acc[date]) acc[date] = [];
    acc[date].push(s);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  if (schedules.length === 0) {
    return (
      <div className="text-center py-12 text-cream-400 bg-white rounded-2xl border border-dashed border-cream-200">
        <Clock size={40} className="mx-auto mb-3 opacity-50" />
        <p>暂无日程</p>
        <p className="text-sm mt-1">点击上方按钮创建你的第一个日程</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {sortedDates.map((date) => {
        const daySchedules = grouped[date].sort(
          (a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()
        );
        const dateObj = new Date(date + 'T00:00:00');
        const isTodayDate = isToday(dateObj);

        return (
          <div key={date}>
            <div className="flex items-center gap-2 mb-2.5 px-1">
              <span className={`text-sm font-semibold ${isTodayDate ? 'text-cream-900' : 'text-cream-500'}`}>
                {isTodayDate ? '今天' : format(dateObj, 'M月d日', { locale: zhCN })}
              </span>
              <span className="text-xs text-cream-400">
                {format(dateObj, 'EEEE', { locale: zhCN })}
              </span>
            </div>
            <div className="space-y-2">
              {daySchedules.map((schedule) => {
                const scheduleTime = new Date(schedule.scheduled_at);
                const isPastTime = isPast(scheduleTime) && !isTodayDate;
                const isTodayPast = isToday(dateObj) && isPast(scheduleTime);

                return (
                  <div
                    key={schedule.id}
                    className={`bg-white rounded-2xl p-4 border transition-all ${
                      schedule.is_completed
                        ? 'border-cream-100 opacity-60'
                        : isTodayPast || isPastTime
                        ? 'border-red-100 bg-red-50/30'
                        : 'border-cream-200 hover:shadow-md hover:border-cream-300 hover:-translate-y-px'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleComplete(schedule);
                        }}
                        className="mt-0.5 shrink-0"
                      >
                        {schedule.is_completed ? (
                          <CheckCircle2 size={20} className="text-green-500" />
                        ) : (
                          <Circle size={20} className="text-cream-300 hover:text-cream-900 transition-colors" />
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium truncate ${schedule.is_completed ? 'line-through text-cream-400' : 'text-cream-900'}`}>
                            {schedule.title}
                          </h4>
                          {!schedule.is_completed && schedule.reminder_minutes > 0 && (
                            <span className="text-[10px] bg-cream-100 text-cream-700 px-2 py-0.5 rounded-full shrink-0 font-medium">
                              提前{schedule.reminder_minutes}分钟
                            </span>
                          )}
                        </div>
                        {schedule.description && (
                          <p className={`text-sm mt-1 truncate ${schedule.is_completed ? 'text-cream-300' : 'text-cream-500'}`}>
                            {schedule.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1 mt-1.5 text-xs text-cream-400">
                          <Clock size={12} />
                          {format(scheduleTime, 'HH:mm')}
                          {(isTodayPast || isPastTime) && !schedule.is_completed && (
                            <span className="text-red-500 ml-1 font-medium">已过期</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(schedule);
                          }}
                          className="p-1.5 text-cream-400 hover:text-cream-900 hover:bg-cream-100 rounded-lg transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(schedule.id);
                          }}
                          className="p-1.5 text-cream-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
