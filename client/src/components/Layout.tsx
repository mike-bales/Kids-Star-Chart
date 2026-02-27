import { Outlet, NavLink } from 'react-router-dom';
import { Home, Shield } from 'lucide-react';
import { PinDialog } from './PinDialog';

export function Layout() {
  return (
    <div className="flex flex-col h-full bg-indigo-950 text-white">
      <header className="flex items-center justify-center px-4 py-3 bg-indigo-900 shadow-lg">
        <h1 className="text-2xl font-bold tracking-wide">
          <span className="text-yellow-400">&#9733;</span> Star Chart
        </h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        <Outlet />
      </main>

      <nav className="flex border-t border-indigo-800 bg-indigo-900 safe-bottom">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${
              isActive ? 'text-yellow-400' : 'text-indigo-300 hover:text-white'
            }`
          }
        >
          <Home size={24} />
          <span className="mt-1">Home</span>
        </NavLink>
        <NavLink
          to="/admin"
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${
              isActive ? 'text-yellow-400' : 'text-indigo-300 hover:text-white'
            }`
          }
        >
          <Shield size={24} />
          <span className="mt-1">Parent</span>
        </NavLink>
      </nav>

      <PinDialog />
    </div>
  );
}
