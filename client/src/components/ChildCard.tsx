import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';

interface ChildCardProps {
  id: number;
  name: string;
  color: string;
  totalStars: number;
  totalPaidStars: number;
}

export function ChildCard({ id, name, color, totalStars, totalPaidStars }: ChildCardProps) {
  const navigate = useNavigate();
  const outstanding = totalStars - totalPaidStars;

  return (
    <button
      onClick={() => navigate(`/child/${id}`)}
      className="w-full rounded-2xl p-6 shadow-lg active:scale-[0.98] transition-transform duration-150 text-left"
      style={{ backgroundColor: color + '22', borderColor: color, borderWidth: 2 }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold text-white"
          style={{ backgroundColor: color }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white">{name}</h3>
          <div className="flex items-center gap-1 mt-1">
            <Star size={18} className="text-yellow-400 fill-yellow-400" />
            <span className="text-yellow-400 font-semibold">{outstanding}</span>
            <span className="text-indigo-400 text-sm"> stars</span>
          </div>
        </div>
        <div className="text-indigo-400 text-3xl">›</div>
      </div>
    </button>
  );
}
