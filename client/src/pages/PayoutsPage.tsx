import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, DollarSign, Star } from 'lucide-react';

interface ChildWithStars {
  id: number;
  name: string;
  color: string;
  total_stars: number;
  total_paid_stars: number;
}

interface StarSummary {
  total_stars: number;
  outstanding_stars: number;
  stars_toward_next: number;
  threshold_stars: number;
  threshold_amount: number;
  rewards_earned: number;
  rewards_paid: number;
  total_earned_amount: number;
  total_paid_amount: number;
}

interface Payout {
  id: number;
  stars_spent: number;
  amount: number;
  note: string | null;
  created_at: string;
}

export function PayoutsPage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutNote, setPayoutNote] = useState('');

  const { data: children } = useQuery({
    queryKey: ['children'],
    queryFn: () => api<ChildWithStars[]>('/children'),
  });

  const { data: summary } = useQuery({
    queryKey: ['stars-summary', selectedChild],
    queryFn: () => api<StarSummary>(`/children/${selectedChild}/stars/summary`),
    enabled: !!selectedChild,
  });

  const { data: payouts } = useQuery({
    queryKey: ['payouts', selectedChild],
    queryFn: () => api<Payout[]>(`/children/${selectedChild}/payouts`),
    enabled: !!selectedChild,
  });

  if (!isAuthenticated) return null;

  const handlePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild || !summary) return;

    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) return;

    // Calculate stars spent proportionally: amount / threshold_amount * threshold_stars
    const starsSpent = Math.round((amount / summary.threshold_amount) * summary.threshold_stars);

    await api(`/children/${selectedChild}/payouts`, {
      method: 'POST',
      body: JSON.stringify({ stars_spent: Math.max(starsSpent, 1), amount, note: payoutNote || undefined }),
    });

    setPayoutAmount('');
    setPayoutNote('');
    setShowPayoutForm(false);
    queryClient.invalidateQueries({ queryKey: ['stars-summary', selectedChild] });
    queryClient.invalidateQueries({ queryKey: ['payouts', selectedChild] });
    queryClient.invalidateQueries({ queryKey: ['children'] });
  };

  const openPayoutForm = () => {
    if (summary) {
      const unpaidAmount = (summary.rewards_earned - summary.rewards_paid) * summary.threshold_amount;
      setPayoutAmount(unpaidAmount > 0 ? unpaidAmount.toFixed(2) : '');
    }
    setPayoutNote('');
    setShowPayoutForm(true);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'Z');
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const unpaidRewards = summary ? summary.rewards_earned - summary.rewards_paid : 0;

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin" className="text-indigo-400 hover:text-white p-2 -ml-2">
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-xl font-bold text-white">Payouts</h2>
      </div>

      {/* Child selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {children?.map(c => (
          <button
            key={c.id}
            onClick={() => setSelectedChild(c.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              selectedChild === c.id
                ? 'bg-yellow-500 text-indigo-950 font-bold'
                : 'bg-indigo-800 text-indigo-300'
            }`}
          >
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: c.color }}
            >
              {c.name.charAt(0)}
            </span>
            {c.name}
          </button>
        ))}
      </div>

      {selectedChild && summary && (
        <>
          {/* Summary */}
          <div className="bg-indigo-900/50 rounded-xl p-5 mb-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-indigo-400">Total Stars Earned</span>
              <span className="text-yellow-400 font-bold flex items-center gap-1">
                {summary.total_stars} <Star size={14} className="fill-yellow-400" />
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-indigo-400">Total Earned</span>
              <span className="text-green-400 font-bold">${summary.total_earned_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-indigo-400">Total Paid Out</span>
              <span className="text-white font-bold">${summary.total_paid_amount.toFixed(2)}</span>
            </div>
            <hr className="border-indigo-800" />
            <div className="flex justify-between text-lg">
              <span className="text-indigo-300 font-medium">Unpaid Balance</span>
              <span className="text-yellow-400 font-bold">
                ${((summary.rewards_earned - summary.rewards_paid) * summary.threshold_amount).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Record payout */}
          {!showPayoutForm ? (
            <button
              onClick={openPayoutForm}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl mb-4 transition-colors"
            >
              <DollarSign size={20} />
              Record Payout
            </button>
          ) : (
            <form onSubmit={handlePayout} className="bg-indigo-900/50 rounded-xl p-5 mb-4 space-y-4">
              <div>
                <label className="block text-sm text-indigo-300 mb-1">Amount ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={payoutAmount}
                  onChange={e => setPayoutAmount(e.target.value)}
                  placeholder="10.00"
                  className="w-full bg-indigo-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400 text-lg"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm text-indigo-300 mb-1">Note (optional)</label>
                <input
                  type="text"
                  value={payoutNote}
                  onChange={e => setPayoutNote(e.target.value)}
                  placeholder="e.g., Cash, spent at store, toy..."
                  className="w-full bg-indigo-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-400"
                />
              </div>
              {unpaidRewards > 0 && (
                <p className="text-indigo-400 text-sm">
                  Unpaid balance: ${(unpaidRewards * summary.threshold_amount).toFixed(2)}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPayoutForm(false)}
                  className="flex-1 py-3 rounded-xl bg-indigo-800 text-indigo-300 font-medium hover:bg-indigo-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors"
                >
                  <DollarSign size={18} />
                  Record
                </button>
              </div>
            </form>
          )}

          {/* Payout history */}
          {payouts && payouts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-indigo-400 uppercase tracking-wide mb-3">
                Payout History
              </h3>
              <div className="space-y-2">
                {payouts.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-4 rounded-xl bg-indigo-900/50">
                    <div>
                      <div className="text-white font-medium">${p.amount.toFixed(2)}</div>
                      {p.note && <div className="text-indigo-300 text-sm">{p.note}</div>}
                      <div className="text-indigo-400 text-xs">{formatDate(p.created_at)}</div>
                    </div>
                    <div className="text-indigo-400 text-sm">{p.stars_spent} stars</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!selectedChild && (
        <p className="text-indigo-400 text-center py-8">Select a child to view their earnings</p>
      )}
    </div>
  );
}
