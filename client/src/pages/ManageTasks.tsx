import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ArrowLeft, Plus, Trash2, Star, Pencil } from 'lucide-react';

interface Task {
  id: number;
  name: string;
  star_value: number;
  icon: string | null;
}

const TASK_ICONS = ['⭐', '🧹', '📚', '🍽️', '🛏️', '🐕', '🎵', '🏃', '🧺', '🗑️', '✏️', '🦷'];

export function ManageTasks() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [name, setName] = useState('');
  const [starValue, setStarValue] = useState(1);
  const [icon, setIcon] = useState('⭐');
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);

  const { data: tasks } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api<Task[]>('/tasks'),
  });

  if (!isAuthenticated) return null;

  const openAdd = () => {
    setEditingTask(null);
    setName('');
    setStarValue(1);
    setIcon('⭐');
    setShowForm(true);
  };

  const openEdit = (task: Task) => {
    setEditingTask(task);
    setName(task.name);
    setStarValue(task.star_value);
    setIcon(task.icon || '⭐');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingTask) {
      await api(`/tasks/${editingTask.id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: name.trim(), star_value: starValue, icon }),
      });
    } else {
      await api('/tasks', {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), star_value: starValue, icon }),
      });
    }

    setName('');
    setStarValue(1);
    setIcon('⭐');
    setEditingTask(null);
    setShowForm(false);
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api(`/tasks/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    queryClient.invalidateQueries({ queryKey: ['tasks'] });
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin" className="text-indigo-400 hover:text-white p-2 -ml-2">
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-xl font-bold text-white flex-1">Manage Tasks</h2>
        <button
          onClick={() => showForm ? setShowForm(false) : openAdd()}
          className="bg-yellow-500 hover:bg-yellow-400 text-indigo-950 p-2 rounded-xl transition-colors"
        >
          <Plus size={20} />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-indigo-900/50 rounded-xl p-5 mb-4 space-y-4">
          <div>
            <label className="block text-sm text-indigo-300 mb-1">Task Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Make bed"
              className="w-full bg-indigo-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-indigo-300 mb-1">Stars Worth</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={1}
                max={10}
                value={starValue}
                onChange={e => setStarValue(Number(e.target.value))}
                className="flex-1 accent-yellow-400"
              />
              <div className="flex items-center gap-1 min-w-[4rem] justify-end">
                <span className="text-yellow-400 font-bold text-lg">{starValue}</span>
                <Star size={18} className="text-yellow-400 fill-yellow-400" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm text-indigo-300 mb-2">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {TASK_ICONS.map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                    icon === i ? 'bg-indigo-700 ring-2 ring-yellow-400 scale-110' : 'bg-indigo-800'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            {editingTask && (
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingTask(null); }}
                className="flex-1 py-3 rounded-xl bg-indigo-800 text-indigo-300 font-medium hover:bg-indigo-700 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-indigo-950 font-bold py-3 rounded-xl transition-colors"
            >
              {editingTask ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {tasks?.map(task => (
          <div
            key={task.id}
            className="flex items-center gap-3 p-4 rounded-xl bg-indigo-900/50"
          >
            <span className="text-xl">{task.icon || '⭐'}</span>
            <span className="text-white font-medium flex-1">{task.name}</span>
            <div className="flex items-center gap-1 text-yellow-400 text-sm">
              {task.star_value} <Star size={14} className="fill-yellow-400" />
            </div>
            <button
              onClick={() => openEdit(task)}
              className="text-indigo-500 hover:text-yellow-400 p-2 transition-colors"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => setDeleteTarget(task)}
              className="text-indigo-500 hover:text-red-400 p-2 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {!tasks?.length && (
          <p className="text-indigo-400 text-center py-8">No tasks yet. Add some!</p>
        )}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Task"
          message={`Remove "${deleteTarget.name}"? Past star history for this task will be kept.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
