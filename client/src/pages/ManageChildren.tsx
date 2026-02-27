import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ArrowLeft, Plus, Trash2, Pencil, BookOpen } from 'lucide-react';

interface Child {
  id: number;
  name: string;
  color: string;
  homework_tracking: number;
  homework_required: number;
  homework_total_days: number;
}

const COLORS = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#DDA0DD', '#FF9F43', '#A29BFE'];

export function ManageChildren() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [homeworkTracking, setHomeworkTracking] = useState(false);
  const [homeworkRequired, setHomeworkRequired] = useState(4);
  const [homeworkTotalDays, setHomeworkTotalDays] = useState(5);
  const [deleteTarget, setDeleteTarget] = useState<Child | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const { data: children } = useQuery({
    queryKey: ['children'],
    queryFn: () => api<Child[]>('/children'),
  });

  if (!isAuthenticated) return null;

  const openAdd = () => {
    setEditingChild(null);
    setName('');
    setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
    setHomeworkTracking(false);
    setHomeworkRequired(4);
    setHomeworkTotalDays(5);
    setShowForm(true);
  };

  const openEdit = (child: Child) => {
    setEditingChild(child);
    setName(child.name);
    setColor(child.color);
    setHomeworkTracking(child.homework_tracking === 1);
    setHomeworkRequired(child.homework_required);
    setHomeworkTotalDays(child.homework_total_days);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');

    const body = {
      name: name.trim(),
      color,
      homework_tracking: homeworkTracking ? 1 : 0,
      homework_required: homeworkRequired,
      homework_total_days: homeworkTotalDays,
    };

    try {
      if (editingChild) {
        await api(`/children/${editingChild.id}`, {
          method: 'PUT',
          body: JSON.stringify(body),
        });
      } else {
        await api('/children', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }

      queryClient.invalidateQueries({ queryKey: ['children'] });

      if (editingChild) {
        // Show "Saved!" briefly, then close
        setSaved(true);
        setTimeout(() => {
          setSaved(false);
          setName('');
          setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
          setEditingChild(null);
          setShowForm(false);
        }, 1000);
      } else {
        setName('');
        setColor(COLORS[Math.floor(Math.random() * COLORS.length)]);
        setEditingChild(null);
        setShowForm(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await api(`/children/${deleteTarget.id}`, { method: 'DELETE' });
    setDeleteTarget(null);
    queryClient.invalidateQueries({ queryKey: ['children'] });
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin" className="text-indigo-400 hover:text-white p-2 -ml-2">
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-xl font-bold text-white flex-1">Manage Children</h2>
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
            <label className="block text-sm text-indigo-300 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Child's name"
              className="w-full bg-indigo-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-indigo-300 mb-2">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-full transition-transform ${
                    color === c ? 'scale-110 ring-2 ring-white' : ''
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Homework Tracking */}
          <div className="border-t border-indigo-800 pt-4">
            <button
              type="button"
              onClick={() => setHomeworkTracking(!homeworkTracking)}
              className="flex items-center gap-3 cursor-pointer w-full text-left"
            >
              <div
                className={`w-12 h-7 rounded-full transition-colors relative shrink-0 ${
                  homeworkTracking ? 'bg-green-500' : 'bg-indigo-700'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-transform ${
                    homeworkTracking ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </div>
              <div>
                <div className="text-white text-sm font-medium flex items-center gap-2">
                  <BookOpen size={16} /> Homework Tracking
                </div>
                <div className="text-indigo-400 text-xs">Track homework for screen time</div>
              </div>
            </button>
          </div>

          {homeworkTracking && (
            <div className="bg-indigo-800/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs text-indigo-400 mb-1">Days required</label>
                  <select
                    value={homeworkRequired}
                    onChange={e => setHomeworkRequired(Number(e.target.value))}
                    className="w-full bg-indigo-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    {[1, 2, 3, 4, 5].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="text-indigo-500 pt-5">out of</div>
                <div className="flex-1">
                  <label className="block text-xs text-indigo-400 mb-1">School days</label>
                  <select
                    value={homeworkTotalDays}
                    onChange={e => setHomeworkTotalDays(Number(e.target.value))}
                    className="w-full bg-indigo-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    {[3, 4, 5].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-indigo-500 text-xs">
                If a week is shortened (days off), all remaining school days are required.
              </p>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <div className="flex gap-3">
            {editingChild && (
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingChild(null); setError(''); }}
                className="flex-1 py-3 rounded-xl bg-indigo-800 text-indigo-300 font-medium hover:bg-indigo-700 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={saving || saved}
              className={`flex-1 font-bold py-3 rounded-xl transition-colors ${
                saved
                  ? 'bg-green-500 text-white'
                  : 'bg-yellow-500 hover:bg-yellow-400 text-indigo-950'
              }`}
            >
              {saved ? 'Saved!' : saving ? 'Saving...' : editingChild ? 'Save Changes' : 'Add Child'}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {children?.map(child => (
          <div
            key={child.id}
            className="flex items-center gap-3 p-4 rounded-xl bg-indigo-900/50"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white"
              style={{ backgroundColor: child.color }}
            >
              {child.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-white font-medium">{child.name}</span>
              {child.homework_tracking === 1 && (
                <span className="text-indigo-400 text-xs ml-2 inline-flex items-center gap-1">
                  <BookOpen size={12} /> HW
                </span>
              )}
            </div>
            <button
              onClick={() => openEdit(child)}
              className="text-indigo-500 hover:text-yellow-400 p-2 transition-colors"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={() => setDeleteTarget(child)}
              className="text-indigo-500 hover:text-red-400 p-2 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      {deleteTarget && (
        <ConfirmDialog
          title="Delete Child"
          message={`Remove ${deleteTarget.name}? Their star history will be kept.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
