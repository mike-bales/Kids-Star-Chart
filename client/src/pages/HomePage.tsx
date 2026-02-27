import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { ChildCard } from '../components/ChildCard';
import { Star } from 'lucide-react';

interface ChildWithStars {
  id: number;
  name: string;
  color: string;
  total_stars: number;
  total_paid_stars: number;
}

export function HomePage() {
  const { data: children, isLoading } = useQuery({
    queryKey: ['children'],
    queryFn: () => api<ChildWithStars[]>('/children'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Star className="text-yellow-400 animate-spin" size={40} />
      </div>
    );
  }

  if (!children?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Star className="text-indigo-600 mb-4" size={64} />
        <h2 className="text-xl font-bold text-white mb-2">No children yet</h2>
        <p className="text-indigo-400">
          Go to Parent settings to add your children
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <h2 className="text-lg font-semibold text-indigo-300 mb-2">Choose who's earning stars:</h2>
      {children.map(child => (
        <ChildCard
          key={child.id}
          id={child.id}
          name={child.name}
          color={child.color}
          totalStars={child.total_stars}
          totalPaidStars={child.total_paid_stars}
        />
      ))}
    </div>
  );
}
