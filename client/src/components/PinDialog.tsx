import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X } from 'lucide-react';

export function PinDialog() {
  const { showPinDialog, setShowPinDialog, authenticate, pendingCallback } = useAuth();
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (showPinDialog) {
      setPin(['', '', '', '']);
      setError('');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [showPinDialog]);

  if (!showPinDialog) return null;

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);
    setError('');

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (value && index === 3) {
      const fullPin = [...newPin.slice(0, 3), value.slice(-1)].join('');
      handleSubmit(fullPin);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (fullPin: string) => {
    setLoading(true);
    const success = await authenticate(fullPin);
    setLoading(false);

    if (success) {
      setShowPinDialog(false);
      if (pendingCallback) pendingCallback();
    } else {
      setError('Wrong PIN');
      setPin(['', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  };

  const close = () => {
    setShowPinDialog(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-indigo-900 rounded-2xl p-8 mx-4 w-full max-w-sm shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Enter Parent PIN</h2>
          <button onClick={close} className="text-indigo-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        <div className="flex justify-center gap-3 mb-6">
          {pin.map((digit, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              disabled={loading}
              className="w-14 h-16 text-center text-2xl font-bold rounded-xl bg-indigo-800 border-2 border-indigo-600 text-white focus:border-yellow-400 focus:outline-none transition-colors"
            />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-center text-sm mb-4">{error}</p>
        )}

        <p className="text-indigo-400 text-center text-xs">
          Default PIN: 1234
        </p>
      </div>
    </div>
  );
}
