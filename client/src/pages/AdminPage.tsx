import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, ListTodo, DollarSign, Settings, LogOut } from 'lucide-react';
import { useEffect } from 'react';

export function AdminPage() {
  const { isAuthenticated, requireAuth, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      requireAuth(() => {});
    }
  }, [isAuthenticated, requireAuth]);

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-indigo-400">Enter your PIN to access parent settings</p>
      </div>
    );
  }

  const menuItems = [
    { label: 'Manage Children', icon: Users, path: '/admin/children', desc: 'Add or remove children' },
    { label: 'Manage Tasks', icon: ListTodo, path: '/admin/tasks', desc: 'Add, edit, or remove tasks' },
    { label: 'Payouts', icon: DollarSign, path: '/admin/payouts', desc: 'Track earnings and payments' },
    { label: 'Settings', icon: Settings, path: '/admin/settings', desc: 'Reward threshold and PIN' },
  ];

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Parent Settings</h2>
        <button
          onClick={logout}
          className="flex items-center gap-2 text-indigo-400 hover:text-white text-sm"
        >
          <LogOut size={16} />
          Lock
        </button>
      </div>

      <div className="space-y-3">
        {menuItems.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center gap-4 p-5 rounded-xl bg-indigo-900/50 hover:bg-indigo-800/50 transition-colors text-left"
          >
            <item.icon size={24} className="text-yellow-400 shrink-0" />
            <div>
              <div className="text-white font-medium">{item.label}</div>
              <div className="text-indigo-400 text-sm">{item.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
