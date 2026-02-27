import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ArrowLeft, Star, Flame, Trophy, TrendingUp, Calendar, Sparkles } from 'lucide-react';

interface TaskStat {
  id: number;
  name: string;
  icon: string | null;
  completions: number;
  total_stars: number;
}

interface Insights {
  total_stars: number;
  stars_this_week: number;
  stars_this_month: number;
  avg_stars_per_day: number;
  active_days: number;
  current_streak: number;
  best_streak: number;
  days_since_first: number;
  most_completed_task: TaskStat | null;
  highest_earning_task: TaskStat | null;
  task_breakdown: TaskStat[];
  total_earned_amount: number;
  total_paid_amount: number;
  unpaid_amount: number;
  rewards_earned: number;
  progress_percent: number;
  stars_toward_next: number;
  threshold_stars: number;
  rank: string;
}

interface Child {
  id: number;
  name: string;
  color: string;
}

const RANK_EMOJI: Record<string, string> = {
  'New Star': '🌱',
  'Star Starter': '⭐',
  'Rising Star': '🌟',
  'Star Explorer': '🚀',
  'Superstar': '💫',
  'Star Champion': '🏆',
  'Star Legend': '👑',
};

function StatCard({ icon, label, value, sub, color = 'text-yellow-400' }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-indigo-900/50 rounded-xl p-4 flex items-center gap-3">
      <div className="text-indigo-400 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-indigo-400 text-xs uppercase tracking-wide">{label}</div>
        <div className={`text-xl font-bold ${color}`}>{value}</div>
        {sub && <div className="text-indigo-500 text-xs">{sub}</div>}
      </div>
    </div>
  );
}

export function InsightsPage() {
  const { id } = useParams<{ id: string }>();

  const { data: children } = useQuery({
    queryKey: ['children'],
    queryFn: () => api<Child[]>('/children'),
  });

  const child = children?.find(c => c.id === Number(id));

  const { data: insights, isLoading } = useQuery({
    queryKey: ['insights', id],
    queryFn: () => api<Insights>(`/children/${id}/stars/insights`),
    enabled: !!id,
  });

  if (isLoading || !insights || !child) {
    return (
      <div className="flex items-center justify-center h-64">
        <Star className="text-yellow-400 animate-spin" size={40} />
      </div>
    );
  }

  const maxTaskStars = insights.task_breakdown.length > 0
    ? Math.max(...insights.task_breakdown.map(t => t.total_stars))
    : 0;

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/child/${id}`} className="text-indigo-400 hover:text-white p-2 -ml-2">
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-xl font-bold text-white flex-1">{child.name}'s Insights</h2>
      </div>

      {/* Rank Banner */}
      <div
        className="rounded-2xl p-6 mb-6 text-center"
        style={{ backgroundColor: child.color + '22', borderColor: child.color, borderWidth: 2 }}
      >
        <div className="text-5xl mb-2">{RANK_EMOJI[insights.rank] || '⭐'}</div>
        <div className="text-2xl font-bold text-white">{insights.rank}</div>
        <div className="text-indigo-300 text-sm mt-1">
          {insights.total_stars} total stars
          {insights.days_since_first > 0 && ` over ${insights.days_since_first} days`}
        </div>
      </div>

      {/* Activity Stats */}
      <h3 className="text-sm font-medium text-indigo-400 uppercase tracking-wide mb-3">Activity</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard
          icon={<Flame size={20} />}
          label="Current Streak"
          value={`${insights.current_streak} day${insights.current_streak !== 1 ? 's' : ''}`}
          color={insights.current_streak > 0 ? 'text-orange-400' : 'text-indigo-500'}
        />
        <StatCard
          icon={<Trophy size={20} />}
          label="Best Streak"
          value={`${insights.best_streak} day${insights.best_streak !== 1 ? 's' : ''}`}
          color="text-yellow-400"
        />
        <StatCard
          icon={<Star size={20} />}
          label="This Week"
          value={insights.stars_this_week}
          color="text-yellow-400"
        />
        <StatCard
          icon={<Calendar size={20} />}
          label="This Month"
          value={insights.stars_this_month}
          color="text-yellow-400"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Avg / Day"
          value={insights.avg_stars_per_day}
          sub={`${insights.active_days} active days`}
          color="text-cyan-400"
        />
        <StatCard
          icon={<Sparkles size={20} />}
          label="Next Reward"
          value={`${insights.progress_percent}%`}
          sub={`${insights.stars_toward_next} / ${insights.threshold_stars} stars`}
          color="text-purple-400"
        />
      </div>

      {/* Task Insights */}
      {insights.task_breakdown.length > 0 && (
        <>
          <h3 className="text-sm font-medium text-indigo-400 uppercase tracking-wide mb-3">Task Insights</h3>

          {/* Most completed & highest earning */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {insights.most_completed_task && (
              <div className="bg-indigo-900/50 rounded-xl p-4">
                <div className="text-indigo-400 text-xs uppercase tracking-wide mb-2">Most Completed</div>
                <div className="text-2xl mb-1">{insights.most_completed_task.icon || '⭐'}</div>
                <div className="text-white font-medium text-sm truncate">{insights.most_completed_task.name}</div>
                <div className="text-indigo-400 text-xs">{insights.most_completed_task.completions} times</div>
              </div>
            )}
            {insights.highest_earning_task && (
              <div className="bg-indigo-900/50 rounded-xl p-4">
                <div className="text-indigo-400 text-xs uppercase tracking-wide mb-2">Top Earner</div>
                <div className="text-2xl mb-1">{insights.highest_earning_task.icon || '⭐'}</div>
                <div className="text-white font-medium text-sm truncate">{insights.highest_earning_task.name}</div>
                <div className="text-yellow-400 text-xs flex items-center gap-1">
                  {insights.highest_earning_task.total_stars} <Star size={10} className="fill-yellow-400" />
                </div>
              </div>
            )}
          </div>

          {/* Task breakdown bar chart */}
          <div className="bg-indigo-900/50 rounded-xl p-4 mb-6 space-y-3">
            <div className="text-indigo-400 text-xs uppercase tracking-wide">Stars by Task</div>
            {insights.task_breakdown.map(task => (
              <div key={task.id} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white truncate flex items-center gap-2">
                    <span>{task.icon || '⭐'}</span>
                    {task.name}
                  </span>
                  <span className="text-yellow-400 font-medium shrink-0 ml-2 flex items-center gap-1">
                    {task.total_stars} <Star size={12} className="fill-yellow-400" />
                  </span>
                </div>
                <div className="h-2 bg-indigo-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${maxTaskStars > 0 ? (task.total_stars / maxTaskStars) * 100 : 0}%`,
                      backgroundColor: child.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Earnings */}
      <h3 className="text-sm font-medium text-indigo-400 uppercase tracking-wide mb-3">Earnings</h3>
      <div className="bg-indigo-900/50 rounded-xl p-5 mb-6 space-y-3">
        <div className="flex justify-between">
          <span className="text-indigo-400">Rewards Earned</span>
          <span className="text-yellow-400 font-bold">{insights.rewards_earned}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-indigo-400">Total Earned</span>
          <span className="text-green-400 font-bold">${insights.total_earned_amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-indigo-400">Paid Out</span>
          <span className="text-white font-bold">${insights.total_paid_amount.toFixed(2)}</span>
        </div>
        <hr className="border-indigo-800" />
        <div className="flex justify-between text-lg">
          <span className="text-indigo-300 font-medium">Unpaid Balance</span>
          <span className="text-yellow-400 font-bold">${insights.unpaid_amount.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
