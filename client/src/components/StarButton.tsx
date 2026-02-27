import { useState, useEffect, useRef } from 'react';
import { Star } from 'lucide-react';

interface StarButtonProps {
  taskName: string;
  starValue: number;
  icon?: string | null;
  color: string;
  onComplete: () => Promise<void>;
}

const COOLDOWN_MS = 1500;

export function StarButton({ taskName, starValue, icon, color, onComplete }: StarButtonProps) {
  const [animating, setAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const cooldownTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearTimeout(cooldownTimer.current);
    };
  }, []);

  const handleClick = async () => {
    if (loading || cooldown) return;
    setLoading(true);
    setAnimating(true);

    try {
      await onComplete();
    } finally {
      setLoading(false);
      setCooldown(true);
      cooldownTimer.current = setTimeout(() => setCooldown(false), COOLDOWN_MS);
      setTimeout(() => setAnimating(false), 300);
    }
  };

  const disabled = loading || cooldown;

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative w-full rounded-2xl p-5 shadow-lg
        active:scale-95 transition-all duration-150
        flex items-center gap-4 text-left
        ${animating ? 'animate-star-bounce' : ''}
        ${disabled ? 'opacity-50 grayscale' : ''}
      `}
      style={{ backgroundColor: color + '22', borderColor: color, borderWidth: 2 }}
    >
      <div
        className="flex items-center justify-center w-14 h-14 rounded-xl text-2xl shrink-0"
        style={{ backgroundColor: color + '33' }}
      >
        {icon || '⭐'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-white font-semibold text-lg truncate">{taskName}</div>
        <div className="flex items-center gap-1 mt-1">
          {Array.from({ length: starValue }, (_, i) => (
            <Star key={i} size={16} className="text-yellow-400 fill-yellow-400" />
          ))}
          <span className="text-indigo-300 text-sm ml-1">
            {starValue} {starValue === 1 ? 'star' : 'stars'}
          </span>
        </div>
      </div>

      <div
        className="text-lg font-bold px-4 py-2 rounded-xl text-white"
        style={{ backgroundColor: disabled ? '#555' : color }}
      >
        {cooldown ? 'Nice!' : 'I did it!'}
      </div>
    </button>
  );
}
