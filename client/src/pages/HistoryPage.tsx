import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Undo2, Star } from 'lucide-react';

interface StarLogEntry {
  id: number;
  child_id: number;
  task_id: number | null;
  stars: number;
  note: string | null;
  task_name: string | null;
  task_icon: string | null;
  created_at: string;
  undone_at: string | null;
}

export function HistoryPage() {
  const { id } = useParams<{ id: string }>();
  const { requireAuth } = useAuth();
  const queryClient = useQueryClient();

  const { data: logs, isLoading } = useQuery({
    queryKey: ['star-logs', id],
    queryFn: () => api<StarLogEntry[]>(`/children/${id}/stars`),
    enabled: !!id,
  });

  const handleUndo = (logId: number) => {
    requireAuth(async () => {
      await api(`/children/${id}/stars/${logId}/undo`, { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['star-logs', id] });
      queryClient.invalidateQueries({ queryKey: ['stars-summary', id] });
      queryClient.invalidateQueries({ queryKey: ['children'] });
    });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'Z');
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to={`/child/${id}`} className="text-indigo-400 hover:text-white p-2 -ml-2">
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-xl font-bold text-white">Star History</h2>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-32">
          <Star className="text-yellow-400 animate-spin" size={32} />
        </div>
      )}

      {!isLoading && !logs?.length && (
        <p className="text-indigo-400 text-center py-8">No stars earned yet!</p>
      )}

      <div className="space-y-2">
        {logs?.map(log => (
          <div
            key={log.id}
            className={`flex items-center gap-3 p-4 rounded-xl ${
              log.undone_at
                ? 'bg-indigo-900/30 opacity-50'
                : 'bg-indigo-900/50'
            }`}
          >
            <div className="text-xl">{log.task_icon || '⭐'}</div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-medium truncate">
                {log.task_name || log.note || 'Stars awarded'}
                {log.undone_at && (
                  <span className="text-red-400 text-xs ml-2">(undone)</span>
                )}
              </div>
              <div className="text-indigo-400 text-xs">{formatDate(log.created_at)}</div>
            </div>
            <div className="flex items-center gap-1 text-yellow-400 font-bold">
              +{log.stars} <Star size={14} className="fill-yellow-400" />
            </div>
            {!log.undone_at && (
              <button
                onClick={() => handleUndo(log.id)}
                className="text-indigo-500 hover:text-red-400 p-2 transition-colors"
                title="Undo"
              >
                <Undo2 size={18} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
