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
} from 'date-fns';

import { ChevronLeft, ChevronRight, Smile, Filter, RotateCcw } from 'lucide-react';
import type { MoodEntry } from '../types';

interface YearlyMoodViewProps {
  entries: MoodEntry[];
  onSelectDate: (date: string) => void;
}

const moodColors: Record<number, string> = {
  1: 'bg-red-400',
  2: 'bg-orange-400',
  3: 'bg-yellow-400',
  4: 'bg-green-400',
  5: 'bg-emerald-400',
};

const moodBorderColors: Record<number, string> = {
  1: 'border-red-400',
  2: 'border-orange-400',
  3: 'border-yellow-400',
  4: 'border-green-400',
  5: 'border-emerald-400',
};

const moodLabels: Record<number, string> = {
  1: '很糟',
  2: '不太好',
  3: '一般',
  4: '不错',
  5: '超棒',
};

const MONTH_NAMES = [
  '1月', '2月', '3月', '4月', '5月', '6月',
  '7月', '8月', '9月', '10月', '11月', '12月',
];

function MiniMonthCalendar({
  year,
  month,
  entryMap,
  onSelectDate,
  filterStart,
  filterEnd,
  filterScores,
}: {
  year: number;
  month: number;
  entryMap: Record<string, MoodEntry>;
  onSelectDate: (date: string) => void;
  filterStart: string;
  filterEnd: string;
  filterScores: number[];
}) {
  const monthDate = new Date(year, month, 1);
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(monthDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [monthDate]);

  const today = new Date();

  const matchesFilter = (dateStr: string, entry?: MoodEntry): boolean => {
    if (filterStart && dateStr < filterStart) return false;
    if (filterEnd && dateStr > filterEnd) return false;
    if (filterScores.length > 0) {
      if (!entry || entry.mood_score === 0) return false;
      if (!filterScores.includes(entry.mood_score)) return false;
    }
    return true;
  };

  const hasMatchInMonth = days.some((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const entry = entryMap[dateStr];
    return isSameMonth(day, monthDate) && matchesFilter(dateStr, entry);
  });

  return (
    <div className={`bg-white rounded-2xl border p-2.5 ${hasMatchInMonth ? 'border-cream-200' : 'border-cream-100'}`}>
      <div className={`text-xs font-semibold mb-2 text-center ${hasMatchInMonth ? 'text-cream-700' : 'text-cream-400'}`}>
        {MONTH_NAMES[month]}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {['一', '二', '三', '四', '五', '六', '日'].map((d) => (
          <div key={d} className="text-center text-[8px] text-cream-400 py-0.5">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const entry = entryMap[dateStr];
          const isCurrentMonth = isSameMonth(day, monthDate);
          const isToday = isSameDay(day, today);
          const matched = matchesFilter(dateStr, entry);

          if (!isCurrentMonth) {
            return <div key={dateStr} className="aspect-square" />;
          }

          const hasVisibleEntry = entry && entry.mood_score > 0 && matched;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`aspect-square rounded-sm flex items-center justify-center transition-all ${
                isToday ? 'ring-1 ring-cream-900' : ''
              }`}
              title={entry ? `${dateStr} ${moodLabels[entry.mood_score] || ''}` : dateStr}
            >
              <div
                className={`w-5 h-5 rounded-sm flex items-center justify-center text-[9px] leading-none transition-all ${
                  hasVisibleEntry
                    ? `${moodColors[entry.mood_score]} text-white font-medium`
                    : matched && entry && entry.mood_score === 0
                    ? 'bg-cream-100 text-cream-500'
                    : 'bg-cream-50 text-cream-300'
                }`}
              >
                {format(day, 'd')}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function YearlyMoodView({ entries, onSelectDate }: YearlyMoodViewProps) {
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  const [filterStart, setFilterStart] = useState('');
  const [filterEnd, setFilterEnd] = useState('');
  const [filterScores, setFilterScores] = useState<number[]>([]);

  const entryMap = useMemo(() => {
    const map: Record<string, MoodEntry> = {};
    entries.forEach((e) => {
      map[e.date] = e;
    });
    return map;
  }, [entries]);

  const isFiltering = filterStart !== '' || filterEnd !== '' || filterScores.length > 0;

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (!e.date.startsWith(String(viewYear))) return false;
      if (filterStart && e.date < filterStart) return false;
      if (filterEnd && e.date > filterEnd) return false;
      if (filterScores.length > 0) {
        if (e.mood_score === 0) return false;
        if (!filterScores.includes(e.mood_score)) return false;
      }
      return true;
    });
  }, [entries, viewYear, filterStart, filterEnd, filterScores]);

  const stats = useMemo(() => {
    const scoredEntries = filteredEntries.filter((e) => e.mood_score > 0);
    const totalDays = scoredEntries.length;
    const happyDays = scoredEntries.filter((e) => e.mood_score >= 4).length;

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    scoredEntries.forEach((e) => {
      distribution[e.mood_score] = (distribution[e.mood_score] || 0) + 1;
    });

    return { totalDays, happyDays, distribution, scoredEntries };
  }, [filteredEntries]);

  const totalScored = stats.totalDays;
  const toggleScore = (score: number) => {
    setFilterScores((prev) =>
      prev.includes(score) ? prev.filter((s) => s !== score) : [...prev, score]
    );
  };

  const clearFilters = () => {
    setFilterStart('');
    setFilterEnd('');
    setFilterScores([]);
  };

  return (
    <div className="space-y-4">
      {/* 年份导航 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-cream-200">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setViewYear((y) => y - 1)}
            className="p-2 hover:bg-cream-100 rounded-xl hover:shadow-sm active:scale-95 transition-all"
          >
            <ChevronLeft size={18} className="text-cream-500" />
          </button>
          <h3 className="font-semibold text-cream-900 text-lg tracking-tight">{viewYear}年</h3>
          <button
            onClick={() => setViewYear((y) => y + 1)}
            className="p-2 hover:bg-cream-100 rounded-xl hover:shadow-sm active:scale-95 transition-all"
          >
            <ChevronRight size={18} className="text-cream-500" />
          </button>
        </div>
      </div>

      {/* 12 个月迷你日历 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 12 }).map((_, month) => (
          <MiniMonthCalendar
            key={month}
            year={viewYear}
            month={month}
            entryMap={entryMap}
            onSelectDate={onSelectDate}
            filterStart={filterStart}
            filterEnd={filterEnd}
            filterScores={filterScores}
          />
        ))}
      </div>

      {/* 筛选面板 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-cream-200 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-cream-900 flex items-center gap-2">
            <Filter size={18} className="text-cream-900" />
            筛选
          </h3>
          {isFiltering && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-cream-500 hover:text-cream-900 hover:bg-cream-100 rounded-lg transition-colors"
            >
              <RotateCcw size={12} />
              重置
            </button>
          )}
        </div>

        {/* 日期范围 */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-cream-500">日期范围</label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterStart}
              onChange={(e) => setFilterStart(e.target.value)}
              className="flex-1 min-w-0 px-4 py-2.5 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cream-900 focus:border-cream-900 bg-cream-50 transition-all"
            />
            <span className="text-xs text-cream-400 shrink-0">至</span>
            <input
              type="date"
              value={filterEnd}
              onChange={(e) => setFilterEnd(e.target.value)}
              className="flex-1 min-w-0 px-4 py-2.5 border border-cream-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cream-900 focus:border-cream-900 bg-cream-50 transition-all"
            />
          </div>
        </div>

        {/* 心情档位 */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-cream-500">心情档位（可多选）</label>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((score) => {
              const active = filterScores.includes(score);
              return (
                <button
                  key={score}
                  onClick={() => toggleScore(score)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border-2 transition-all ${
                    active
                      ? `${moodBorderColors[score]} ${moodColors[score]} text-white shadow-md`
                      : 'border-cream-200 bg-white text-cream-600 hover:bg-cream-50 hover:shadow-sm'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${active ? 'bg-white' : moodColors[score]}`} />
                  {moodLabels[score]}
                </button>
              );
            })}
          </div>
        </div>

        {/* 筛选结果提示 */}
        {isFiltering && (
          <div className="text-xs text-cream-600 bg-cream-50 rounded-xl px-4 py-3 border border-cream-100">
            符合条件：<span className="font-semibold text-cream-900">{stats.totalDays}</span> 天
            {filterStart && `，从 ${filterStart}`}
            {filterEnd && ` 到 ${filterEnd}`}
            {filterScores.length > 0 && `，心情：${filterScores.map((s) => moodLabels[s]).join('、')}`}
          </div>
        )}
      </div>

      {/* 统计面板 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-cream-200 space-y-5">
        <h3 className="font-semibold text-cream-900 flex items-center gap-2">
          <Smile size={18} className="text-cream-900" />
          {isFiltering ? '筛选统计' : '年度统计'}
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-cream-50 rounded-2xl p-4 text-center border border-cream-100">
            <div className="text-2xl font-bold text-cream-900">{stats.totalDays}</div>
            <div className="text-xs text-cream-500 mt-0.5">记录天数</div>
          </div>
          <div className="bg-cream-100 rounded-2xl p-4 text-center border border-cream-200">
            <div className="text-2xl font-bold text-cream-900">{stats.happyDays}</div>
            <div className="text-xs text-cream-600 mt-0.5">快乐天数</div>
          </div>
        </div>

        {/* 分布条形图 */}
        <div className="space-y-2.5">
          <div className="text-xs font-medium text-cream-500">心情分布</div>
          {[5, 4, 3, 2, 1].map((score) => {
            const count = stats.distribution[score] || 0;
            const pct = totalScored > 0 ? (count / totalScored) * 100 : 0;
            return (
              <div key={score} className="flex items-center gap-3">
                <span className="text-xs text-cream-500 w-10 shrink-0">{moodLabels[score]}</span>
                <div className="flex-1 h-5 bg-cream-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${moodColors[score]} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-cream-500 w-6 text-right shrink-0">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
