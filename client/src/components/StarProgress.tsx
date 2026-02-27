import { Star } from 'lucide-react';

interface StarProgressProps {
  current: number;
  threshold: number;
  color: string;
}

export function StarProgress({ current, threshold, color }: StarProgressProps) {
  const progress = Math.min((current / threshold) * 100, 100);
  const starsToGo = Math.max(threshold - current, 0);

  return (
    <div className="bg-indigo-900/50 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Star className="text-yellow-400 fill-yellow-400" size={28} />
          <span className="text-3xl font-bold text-white">{current}</span>
          <span className="text-indigo-400 text-lg">/ {threshold}</span>
        </div>
        {starsToGo > 0 ? (
          <span className="text-indigo-300 text-sm">{starsToGo} to go!</span>
        ) : (
          <span className="text-yellow-400 text-sm font-bold">Reward earned!</span>
        )}
      </div>

      <div className="h-4 bg-indigo-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out animate-fill"
          style={{
            width: `${progress}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}
