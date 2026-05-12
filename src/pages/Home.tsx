import { Link } from 'react-router-dom';
import { Calendar, Smile, Bell, Clock } from 'lucide-react';
import { SmartInput } from '../components/SmartInput';
import { usePush } from '../hooks/usePush';

export function Home() {
  const { subscribed } = usePush();

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-cream-200 hover:shadow-md transition-shadow">
        <h2 className="text-2xl font-bold mb-2 tracking-tight text-cream-900">欢迎回来</h2>
        <p className="text-cream-500 text-sm leading-relaxed">
          管理你的日程，记录每日心情，让生活更有条理。
        </p>
        {!subscribed && (
          <div className="mt-4 flex items-center gap-2 text-xs bg-cream-50 rounded-xl px-3 py-2.5 border border-cream-200 text-cream-600">
            <Bell size={14} />
            <span>建议开启推送通知，以免错过提醒</span>
          </div>
        )}
      </section>

      <SmartInput />

      <div className="grid grid-cols-2 gap-4">
        <Link
          to="/schedules"
          className="bg-white rounded-2xl p-5 shadow-sm border border-cream-200 hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col items-center gap-3 text-center group"
        >
          <div className="w-12 h-12 bg-cream-100 rounded-2xl flex items-center justify-center group-hover:bg-cream-200 transition-colors">
            <Calendar className="text-cream-900" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-cream-900">日程管理</h3>
            <p className="text-xs text-cream-500 mt-1">创建和查看日程安排</p>
          </div>
        </Link>

        <Link
          to="/mood"
          className="bg-white rounded-2xl p-5 shadow-sm border border-cream-200 hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col items-center gap-3 text-center group"
        >
          <div className="w-12 h-12 bg-cream-100 rounded-2xl flex items-center justify-center group-hover:bg-cream-200 transition-colors">
            <Smile className="text-cream-900" size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-cream-900">心情日记</h3>
            <p className="text-xs text-cream-500 mt-1">记录每日心情与事件</p>
          </div>
        </Link>
      </div>

      <section className="bg-white rounded-2xl p-5 shadow-sm border border-cream-200 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-3">
          <Clock size={18} className="text-cream-900" />
          <h3 className="font-semibold text-cream-900">每日提醒</h3>
        </div>
        <div className="space-y-2 text-sm text-cream-600">
          <div className="flex items-center justify-between py-2 border-b border-cream-100">
            <span>日程提醒</span>
            <span className="text-xs bg-cream-100 text-cream-700 px-2.5 py-1 rounded-full font-medium">
              到期前自动推送
            </span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span>心情记录</span>
            <span className="text-xs bg-cream-100 text-cream-700 px-2.5 py-1 rounded-full font-medium">
              每天 11:00
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
