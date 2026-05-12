import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { MoodEntry } from '../types';

interface MoodCalendarProps {
  entries: MoodEntry[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

const moodColors: Record<number, string> = {
  1: 'bg-red-400',
  2: 'bg-orange-400',
  3: 'bg-yellow-400',
  4: 'bg-green-400',
  5: 'bg-emerald-400',
};

const MONTH_LABELS = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

export function MoodCalendar({ entries, selectedDate, onSelectDate }: MoodCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentMonth.getFullYear());
  const [pickerMonth, setPickerMonth] = useState(currentMonth.getMonth());

  const entryMap = useMemo(() => {
    const map: Record<string, MoodEntry> = {};
    entries.forEach((e) => {
      map[e.date] = e;
    });
    return map;
  }, [entries]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const weekDays = ['一', '二', '三', '四', '五', '六', '日'];

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let y = currentYear - 5; y <= currentYear + 5; y++) {
      years.push(y);
    }
    return years;
  }, []);

  const openPicker = () => {
    setPickerYear(currentMonth.getFullYear());
    setPickerMonth(currentMonth.getMonth());
    setShowPicker(true);
  };

  const closePicker = () => {
    setShowPicker(false);
  };

  const confirmPicker = () => {
    setCurrentMonth(new Date(pickerYear, pickerMonth, 1));
    setShowPicker(false);
  };

  return (
    <>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-cream-200">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-cream-100 rounded-xl hover:shadow-sm active:scale-95 transition-all"
          >
            <ChevronLeft size={18} className="text-cream-500" />
          </button>
          <button
            onClick={openPicker}
            className="font-semibold text-cream-900 px-4 py-1.5 rounded-xl hover:bg-cream-100 transition-colors"
          >
            {format(currentMonth, 'yyyy年 M月', { locale: zhCN })}
          </button>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-cream-100 rounded-xl hover:shadow-sm active:scale-95 transition-all"
          >
            <ChevronRight size={18} className="text-cream-500" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-xs text-cream-400 py-1 font-medium">
              {d}
            </div>
          ))}
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const entry = entryMap[dateStr];
            const isSelected = dateStr === selectedDate;
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={dateStr}
                onClick={() => onSelectDate(dateStr)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all relative ${
                  isSelected
                    ? 'ring-2 ring-cream-900 bg-cream-50 shadow-md'
                    : 'hover:bg-cream-50 hover:shadow-sm'
                } ${!isCurrentMonth ? 'opacity-30' : ''}`}
              >
                <span className={`font-medium ${isToday ? 'text-cream-900' : 'text-cream-700'}`}>
                  {format(day, 'd')}
                </span>
                {entry && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${moodColors[entry.mood_score] || 'bg-cream-300'}`} />
                )}
                {isToday && !entry && (
                  <div className="w-1 h-1 rounded-full bg-cream-400 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-4 mt-3 pt-3 border-t border-cream-100">
          {[
            { score: 1, label: '很糟', color: 'bg-red-400' },
            { score: 3, label: '一般', color: 'bg-yellow-400' },
            { score: 5, label: '超棒', color: 'bg-emerald-400' },
          ].map((m) => (
            <div key={m.score} className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${m.color}`} />
              <span className="text-[10px] text-cream-400">{m.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 年月选择弹层 */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closePicker}
          />
          <div className="relative bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-sm mx-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-cream-900 text-lg">选择年月</h3>
              <button
                onClick={closePicker}
                className="p-2 hover:bg-cream-100 rounded-xl hover:shadow-sm active:scale-95 transition-all"
              >
                <X size={18} className="text-cream-500" />
              </button>
            </div>

            {/* 年份选择 */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-cream-500 mb-2">年份</label>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {yearOptions.map((year) => (
                  <button
                    key={year}
                    onClick={() => setPickerYear(year)}
                    className={`shrink-0 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
                      pickerYear === year
                        ? 'bg-cream-900 text-white shadow-sm'
                        : 'bg-cream-100 text-cream-700 hover:bg-cream-200 hover:shadow-sm'
                    }`}
                  >
                    {year}
                  </button>
                ))}
              </div>
            </div>

            {/* 月份选择 */}
            <div className="mb-6">
              <label className="block text-xs font-medium text-cream-500 mb-2">月份</label>
              <div className="grid grid-cols-4 gap-2">
                {MONTH_LABELS.map((label, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPickerMonth(idx)}
                    className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                      pickerMonth === idx
                        ? 'bg-cream-900 text-white shadow-sm'
                        : 'bg-cream-100 text-cream-700 hover:bg-cream-200 hover:shadow-sm'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <button
                onClick={closePicker}
                className="flex-1 py-3 border border-cream-200 text-cream-700 rounded-2xl font-medium hover:bg-cream-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmPicker}
                className="flex-1 py-3 bg-cream-900 text-white rounded-2xl font-medium hover:bg-cream-800 hover:shadow-md active:scale-[0.98] transition-all shadow-sm"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
