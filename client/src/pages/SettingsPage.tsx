import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Star, Check } from 'lucide-react';

interface Threshold {
  stars: number;
  amount: number;
}

export function SettingsPage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: threshold } = useQuery({
    queryKey: ['threshold'],
    queryFn: () => api<Threshold>('/settings/reward-threshold'),
  });

  const [stars, setStars] = useState(20);
  const [amount, setAmount] = useState(10);
  const [saved, setSaved] = useState(false);

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSaved, setPinSaved] = useState(false);

  useEffect(() => {
    if (threshold) {
      setStars(threshold.stars);
      setAmount(threshold.amount);
    }
  }, [threshold]);

  if (!isAuthenticated) return null;

  const handleSaveThreshold = async (e: React.FormEvent) => {
    e.preventDefault();
    await api('/settings/reward-threshold', {
      method: 'PUT',
      body: JSON.stringify({ stars, amount }),
    });
    queryClient.invalidateQueries({ queryKey: ['threshold'] });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');

    if (newPin.length !== 4) {
      setPinError('PIN must be 4 digits');
      return;
    }

    try {
      await api('/settings/pin', {
        method: 'PUT',
        body: JSON.stringify({ current_pin: currentPin, new_pin: newPin }),
      });
      setCurrentPin('');
      setNewPin('');
      setPinSaved(true);
      setTimeout(() => setPinSaved(false), 2000);
    } catch {
      setPinError('Current PIN is incorrect');
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin" className="text-indigo-400 hover:text-white p-2 -ml-2">
          <ArrowLeft size={24} />
        </Link>
        <h2 className="text-xl font-bold text-white">Settings</h2>
      </div>

      {/* Reward Threshold */}
      <form onSubmit={handleSaveThreshold} className="bg-indigo-900/50 rounded-xl p-5 mb-4 space-y-4">
        <h3 className="text-lg font-semibold text-white">Reward Threshold</h3>
        <div>
          <label className="block text-sm text-indigo-300 mb-1">Stars needed for reward</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={1000}
              value={stars}
              onChange={e => setStars(Number(e.target.value))}
              className="w-24 bg-indigo-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <Star size={20} className="text-yellow-400 fill-yellow-400" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-indigo-300 mb-1">Reward amount ($)</label>
          <input
            type="number"
            min={0}
            step={0.01}
            value={amount}
            onChange={e => setAmount(Number(e.target.value))}
            className="w-32 bg-indigo-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-indigo-950 font-bold py-3 px-6 rounded-xl transition-colors"
        >
          {saved ? <><Check size={18} /> Saved!</> : 'Save'}
        </button>
      </form>

      {/* Change PIN */}
      <form onSubmit={handleChangePin} className="bg-indigo-900/50 rounded-xl p-5 space-y-4">
        <h3 className="text-lg font-semibold text-white">Change PIN</h3>
        <div>
          <label className="block text-sm text-indigo-300 mb-1">Current PIN</label>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={4}
            value={currentPin}
            onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
            placeholder="Current 4-digit PIN"
            className="w-full bg-indigo-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
        <div>
          <label className="block text-sm text-indigo-300 mb-1">New PIN</label>
          <input
            type="tel"
            inputMode="numeric"
            maxLength={4}
            value={newPin}
            onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
            placeholder="New 4-digit PIN"
            className="w-full bg-indigo-800 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
        {pinError && <p className="text-red-400 text-sm">{pinError}</p>}
        <button
          type="submit"
          className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-indigo-950 font-bold py-3 px-6 rounded-xl transition-colors"
        >
          {pinSaved ? <><Check size={18} /> PIN Changed!</> : 'Change PIN'}
        </button>
      </form>
    </div>
  );
}
