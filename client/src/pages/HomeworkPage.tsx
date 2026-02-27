import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { ArrowLeft, ChevronLeft, ChevronRight, Star, Check, X, Calendar, Gamepad2 } from 'lucide-react';
import { useState } from 'react';

interface DayInfo {
  date: string;
  day_name: string;
  status: 'done' | 'not_done' | 'day_off' | 'pending';
  is_today: boolean;
  is_past: boolean;
  is_future: boolean;
}

interface WeekSummary {
  done: number;
  not_done: number;
  day_off: number;
  pending: number;
  total_school_days: number;
  required: number;
  earned: boolean;
  still_possible: boolean;
  lost: boolean;
}

interface WeekData {
  week_start: string;
  week_end: string;
  days: DayInfo[];
  summary: WeekSummary;
}

interface WeekHistory {
  week_start: string;
  done: number;
  not_done: number;
  day_off: number;
  total_school_days: number;
  required: number;
  earned: boolean;
}

interface Child {
  id: number;
  name: string;
  color: string;
  homework_tracking: number;
}

const STATUS_CYCLE: Record<string, string> = {
  pending: 'done',
  done: 'not_done',
  not_done: 'day_off',
  day_off: 'pending',
};

// Past days skip 'pending' since the server auto-marks it back to not_done
const PAST_STATUS_CYCLE: Record<string, string> = {
  pending: 'done',
  done: 'not_done',
  not_done: 'day_off',
  day_off: 'done',
};

const STATUS_CONFIG: Record<string, { icon: typeof Check; label: string; bg: string; text: string }> = {
  done: { icon: Check, label: 'Done', bg: 'bg-green-600', text: 'text-green-400' },
  not_done: { icon: X, label: 'Missed', bg: 'bg-red-600', text: 'text-red-400' },
  day_off: { icon: Calendar, label: 'Day Off', bg: 'bg-indigo-600', text: 'text-indigo-300' },
  pending: { icon: Star, label: 'Pending', bg: 'bg-indigo-800', text: 'text-indigo-500' },
};

export function HomeworkPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [weekOffset, setWeekOffset] = useState(0);

  // Calculate the reference date for the current week view
  const refDate = new Date();
  refDate.setDate(refDate.getDate() + weekOffset * 7);
  const refStr = refDate.toISOString().slice(0, 10);

  const { data: children } = useQuery({
    queryKey: ['children'],
    queryFn: () => api<Child[]>('/children'),
  });
  const child = children?.find(c => c.id === Number(id));

  const { data: weekData } = useQuery({
    queryKey: ['homework', id, refStr],
    queryFn: () => api<WeekData>(`/children/${id}/homework?week=${refStr}`),
    enabled: !!id,
  });

  const { data: history } = useQuery({
    queryKey: ['homework-history', id],
    queryFn: () => api<WeekHistory[]>(`/children/${id}/homework/history?weeks=8`),
    enabled: !!id,
  });

  const handleToggle = async (date: string, currentStatus: string, isPast: boolean) => {
    const cycle = isPast ? PAST_STATUS_CYCLE : STATUS_CYCLE;
    const nextStatus = cycle[currentStatus] || 'done';
    await api(`/children/${id}/homework`, {
      method: 'POST',
      body: JSON.stringify({ date, status: nextStatus }),
    });
    queryClient.invalidateQueries({ queryKey: ['homework', id] });
    queryClient.invalidateQueries({ queryKey: ['homework-history', id] });
  };

  if (!child || !weekData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Star className="text-yellow-400 animate-spin" size={40} />
      </div>
    );
  }

  const { summary } = weekData;
  const isCurrentWeek = weekOffset === 0;

  const formatWeekRange = (start: string, end: string) => {
    const s = new Date(start + 'T12:00:00');
    const e = new Date(end + 'T12:00:00');
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${s.toLocaleDateString(undefined, opts)} – ${e.toLocaleDateString(undefined, opts)}`;
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link to={`/child/${id}`} className="text-indigo-400 hover:text-white p-2 -ml-2">
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-xl font-bold text-white flex-1">Homework</h2>
      </div>

      {/* Earned Status Banner */}
      <div
        className={`rounded-2xl p-5 mb-6 text-center ${
          summary.earned
            ? 'bg-green-900/40 border-2 border-green-500'
            : summary.lost
              ? 'bg-red-900/40 border-2 border-red-500'
              : 'bg-indigo-900/50 border-2 border-indigo-700'
        }`}
      >
        <div className="text-4xl mb-2">
          {summary.earned ? '🎮' : summary.lost ? '😔' : '📚'}
        </div>
        <div className={`text-xl font-bold ${
          summary.earned ? 'text-green-400' : summary.lost ? 'text-red-400' : 'text-white'
        }`}>
          {summary.earned
            ? 'Screen Time Earned!'
            : summary.lost
              ? 'Not This Week'
              : `${summary.done} of ${summary.required} Done`
          }
        </div>
        {!summary.earned && !summary.lost && summary.still_possible && (
          <div className="text-indigo-400 text-sm mt-1">
            Need {summary.required - summary.done} more
          </div>
        )}
      </div>

      {/* Week Navigator */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setWeekOffset(w => w - 1)}
          className="text-indigo-400 hover:text-white p-2"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <div className="text-white font-medium">
            {isCurrentWeek ? 'This Week' : formatWeekRange(weekData.week_start, weekData.week_end)}
          </div>
          {!isCurrentWeek && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-yellow-400 text-xs hover:underline"
            >
              Back to this week
            </button>
          )}
        </div>
        <button
          onClick={() => setWeekOffset(w => w + 1)}
          disabled={weekOffset >= 0}
          className={`p-2 ${weekOffset >= 0 ? 'text-indigo-800' : 'text-indigo-400 hover:text-white'}`}
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Day Cards */}
      <div className="space-y-2 mb-6">
        {weekData.days.map(day => {
          const config = STATUS_CONFIG[day.status];
          const Icon = config.icon;
          return (
            <button
              key={day.date}
              onClick={() => handleToggle(day.date, day.status, day.is_past)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all active:scale-[0.98] ${
                day.is_today ? 'ring-2 ring-yellow-400' : ''
              } bg-indigo-900/50`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.bg}`}>
                <Icon size={24} className="text-white" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-white font-medium">
                  {day.day_name}
                  {day.is_today && (
                    <span className="text-yellow-400 text-xs ml-2">Today</span>
                  )}
                </div>
                <div className={`text-sm ${config.text}`}>{config.label}</div>
              </div>
              <div className="text-indigo-600 text-xs">tap to change</div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mb-6 text-xs">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-600" /> Done</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-600" /> Missed</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-600" /> Day Off</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-800" /> Pending</span>
      </div>

      {/* Recent History */}
      {history && history.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-indigo-400 uppercase tracking-wide mb-3">
            Recent Weeks
          </h3>
          <div className="space-y-2">
            {history.map(week => {
              const weekEnd = new Date(week.week_start + 'T12:00:00');
              weekEnd.setDate(weekEnd.getDate() + 4);
              return (
                <button
                  key={week.week_start}
                  onClick={() => {
                    const d = new Date(week.week_start + 'T12:00:00');
                    const now = new Date();
                    const diff = Math.round((d.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000));
                    setWeekOffset(diff);
                  }}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-indigo-900/50 hover:bg-indigo-800/50 transition-colors"
                >
                  <div className="text-white text-sm">
                    {formatWeekRange(week.week_start, weekEnd.toISOString().slice(0, 10))}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-indigo-400 text-sm">
                      {week.done}/{week.required}
                    </span>
                    {week.earned ? (
                      <Gamepad2 size={18} className="text-green-400" />
                    ) : (
                      <X size={18} className="text-red-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
