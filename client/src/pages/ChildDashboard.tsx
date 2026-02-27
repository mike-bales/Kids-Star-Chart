import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { StarButton } from '../components/StarButton';
import { StarProgress } from '../components/StarProgress';
import { playStarEarned, playCelebration } from '../lib/sounds';
import { fireStarConfetti, fireStarBurst } from '../lib/confetti';
import { ArrowLeft, History, BarChart3, Star, Minus, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface Child {
  id: number;
  name: string;
  color: string;
  homework_tracking: number;
}

interface Task {
  id: number;
  name: string;
  star_value: number;
  icon: string | null;
}

interface StarSummary {
  total_stars: number;
  outstanding_stars: number;
  stars_toward_next: number;
  threshold_stars: number;
  threshold_amount: number;
}

interface AwardResponse {
  newTotal: number;
  outstanding: number;
  starsAwarded: number;
  thresholdReached: boolean;
}

export function ChildDashboard() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { requireAuth } = useAuth();
  const [celebrating, setCelebrating] = useState(false);
  const [showRemoveForm, setShowRemoveForm] = useState(false);
  const [removeCount, setRemoveCount] = useState('1');
  const [removeNote, setRemoveNote] = useState('');

  const { data: children } = useQuery({
    queryKey: ['children'],
    queryFn: () => api<Child[]>('/children'),
  });

  const child = children?.find(c => c.id === Number(id));

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api<Task[]>('/tasks'),
  });

  const { data: summary } = useQuery({
    queryKey: ['stars-summary', id],
    queryFn: () => api<StarSummary>(`/children/${id}/stars/summary`),
    enabled: !!id,
  });

  const handleRemoveStars = () => {
    requireAuth(async () => {
      setShowRemoveForm(true);
    });
  };

  const submitRemoveStars = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = parseInt(removeCount);
    if (isNaN(count) || count < 1) return;

    await api(`/children/${id}/stars/remove`, {
      method: 'POST',
      body: JSON.stringify({ stars: count, note: removeNote || 'Stars removed' }),
    });

    setShowRemoveForm(false);
    setRemoveCount('1');
    setRemoveNote('');
    queryClient.invalidateQueries({ queryKey: ['stars-summary', id] });
    queryClient.invalidateQueries({ queryKey: ['children'] });
    queryClient.invalidateQueries({ queryKey: ['star-logs', id] });
  };

  const handleTaskComplete = async (taskId: number) => {
    const result = await api<AwardResponse>(`/children/${id}/stars`, {
      method: 'POST',
      body: JSON.stringify({ task_id: taskId }),
    });

    // Invalidate queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['stars-summary', id] });
    queryClient.invalidateQueries({ queryKey: ['children'] });

    if (result.thresholdReached) {
      setCelebrating(true);
      playCelebration();
      fireStarConfetti();
      setTimeout(() => setCelebrating(false), 4000);
    } else {
      playStarEarned();
      fireStarBurst();
    }
  };

  if (!child || !summary) {
    return (
      <div className="flex items-center justify-center h-64">
        <Star className="text-yellow-400 animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Link to="/" className="text-indigo-400 hover:text-white p-2 -ml-2">
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-2xl font-bold text-white">{child.name}</h2>
        <div className="flex items-center gap-1 -mr-2">
          {child.homework_tracking === 1 && (
            <Link
              to={`/child/${id}/homework`}
              className="text-indigo-400 hover:text-white p-2"
              title="Homework"
            >
              <BookOpen size={24} />
            </Link>
          )}
          <Link
            to={`/child/${id}/insights`}
            className="text-indigo-400 hover:text-white p-2"
            title="Insights"
          >
            <BarChart3 size={24} />
          </Link>
          <Link
            to={`/child/${id}/history`}
            className="text-indigo-400 hover:text-white p-2"
            title="History"
          >
            <History size={24} />
          </Link>
        </div>
      </div>

      {/* Progress */}
      <StarProgress
        current={summary.stars_toward_next}
        threshold={summary.threshold_stars}
        color={child.color}
      />

      {/* Remove stars */}
      <div className="flex justify-end mb-2 -mt-4">
        <button
          onClick={handleRemoveStars}
          className="flex items-center gap-1 text-indigo-500 hover:text-red-400 text-xs px-3 py-1 rounded-lg transition-colors"
        >
          <Minus size={14} />
          Remove stars
        </button>
      </div>

      {showRemoveForm && (
        <form onSubmit={submitRemoveStars} className="bg-indigo-900/50 rounded-xl p-5 mb-4 space-y-3">
          <h3 className="text-white font-medium">Remove Stars</h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-indigo-400 mb-1">How many?</label>
              <input
                type="number"
                min="1"
                value={removeCount}
                onChange={e => setRemoveCount(e.target.value)}
                className="w-full bg-indigo-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
                autoFocus
              />
            </div>
            <div className="flex-[2]">
              <label className="block text-xs text-indigo-400 mb-1">Reason (optional)</label>
              <input
                type="text"
                value={removeNote}
                onChange={e => setRemoveNote(e.target.value)}
                placeholder="e.g., Added by mistake"
                className="w-full bg-indigo-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowRemoveForm(false)}
              className="flex-1 py-2 rounded-xl bg-indigo-800 text-indigo-300 text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-500 transition-colors"
            >
              Remove {removeCount} {parseInt(removeCount) === 1 ? 'star' : 'stars'}
            </button>
          </div>
        </form>
      )}

      {/* Celebration overlay */}
      {celebrating && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="text-center animate-star-pop">
            <div className="text-6xl mb-4">🎉</div>
            <div className="text-4xl font-bold text-yellow-400 drop-shadow-lg">
              REWARD EARNED!
            </div>
            <div className="text-2xl text-white mt-2">
              ${summary.threshold_amount.toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Task Buttons */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-indigo-400 uppercase tracking-wide">
          Complete a task:
        </h3>
        {tasks?.map(task => (
          <StarButton
            key={task.id}
            taskName={task.name}
            starValue={task.star_value}
            icon={task.icon}
            color={child.color}
            onComplete={() => handleTaskComplete(task.id)}
          />
        ))}
        {!tasks?.length && (
          <p className="text-indigo-400 text-center py-8">
            No tasks yet. A parent needs to add some tasks first!
          </p>
        )}
      </div>
    </div>
  );
}
