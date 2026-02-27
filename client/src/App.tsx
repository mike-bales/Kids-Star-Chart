import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { ChildDashboard } from './pages/ChildDashboard';
import { HistoryPage } from './pages/HistoryPage';
import { AdminPage } from './pages/AdminPage';
import { ManageChildren } from './pages/ManageChildren';
import { ManageTasks } from './pages/ManageTasks';
import { PayoutsPage } from './pages/PayoutsPage';
import { SettingsPage } from './pages/SettingsPage';
import { InsightsPage } from './pages/InsightsPage';
import { HomeworkPage } from './pages/HomeworkPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/child/:id" element={<ChildDashboard />} />
        <Route path="/child/:id/history" element={<HistoryPage />} />
        <Route path="/child/:id/insights" element={<InsightsPage />} />
        <Route path="/child/:id/homework" element={<HomeworkPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/children" element={<ManageChildren />} />
        <Route path="/admin/tasks" element={<ManageTasks />} />
        <Route path="/admin/payouts" element={<PayoutsPage />} />
        <Route path="/admin/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
